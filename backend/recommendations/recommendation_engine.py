"""
Operation Recommendation Engine — Deterministic rule-based engine
for machining operation suitability, material compatibility,
damage prevention guidance, and wear-condition warnings.
"""
from backend.tool_catalogue.knowledge_base import (
    TOOL_CATEGORIES, TOOL_MATERIALS, TOOL_COATINGS, WORKPIECE_MATERIALS,
    MACHINING_OPERATIONS, OPERATION_COMPATIBILITY, MATERIAL_COMPATIBILITY,
    WEAR_DAMAGE_TYPES, DAMAGE_PREVENTION_GUIDELINES,
)


class OperationRecommendationEngine:
    """Generates operation recommendations based on engineering rules and data."""

    def recommend_operations(
        self, tool_category: str, tool_material: str = None,
        tool_coating: str = None, workpiece_material: str = None,
        current_vb: float = None
    ) -> dict:
        """
        Get operation recommendations for a tool.
        Returns suitable, conditional, and unsuitable operations.
        """
        compat = OPERATION_COMPATIBILITY.get(tool_category, {})
        if not compat:
            return {
                "error": f"No compatibility data for category '{tool_category}'.",
                "available_categories": list(OPERATION_COMPATIBILITY.keys()),
            }

        suitable = []
        conditional = []
        unsuitable = []
        general_warnings = []

        for op_name, info in compat.items():
            entry = {
                "operation": op_name,
                "reason": info["reason"],
            }

            # Add operation description
            op_info = MACHINING_OPERATIONS.get(op_name, {})
            entry["description"] = op_info.get("description", "")

            # Add speed/feed guidance if material is specified
            if workpiece_material and tool_material:
                mat_compat = MATERIAL_COMPATIBILITY.get(tool_material, {})
                wp_info = mat_compat.get(workpiece_material, {})
                if wp_info:
                    wp_base = WORKPIECE_MATERIALS.get(workpiece_material, {})
                    base_speed = wp_base.get("base_speed_sfm", 200)
                    factor = wp_info.get("speed_factor", 1.0)
                    coating_info = TOOL_COATINGS.get(tool_coating, {})
                    coating_boost = 1 + coating_info.get("speed_increase_pct", 0) / 100
                    rec_speed = round(base_speed * factor * coating_boost)
                    entry["recommended_speed_sfm"] = rec_speed
                    entry["material_notes"] = wp_info.get("notes", "")

            if info["suitability"] == "suitable":
                suitable.append(entry)
            elif info["suitability"] == "conditional":
                conditional.append(entry)
            else:
                unsuitable.append(entry)

        # Tool condition impact
        condition_impact = None
        if current_vb is not None:
            if current_vb >= 0.6:
                condition_impact = "CRITICAL: Tool wear exceeds ISO 3685 failure limit (VB ≥ 0.6 mm). Replace tool immediately."
                general_warnings.append("Do NOT use this tool for any operation. It has reached end-of-life.")
            elif current_vb >= 0.3:
                condition_impact = "WARNING: Significant wear (VB ≥ 0.3 mm). Only light finishing operations recommended."
                general_warnings.append("Reduce cutting speed by 20% and feed rate by 15%.")
                general_warnings.append("Avoid heavy roughing operations.")
            elif current_vb >= 0.15:
                condition_impact = "CAUTION: Moderate wear (VB ≥ 0.15 mm). Monitor closely. Full operations still possible."
                general_warnings.append("Schedule tool inspection within next 5-10 operations.")

        # Workpiece material warnings
        if workpiece_material and tool_material:
            mat_compat = MATERIAL_COMPATIBILITY.get(tool_material, {})
            wp_info = mat_compat.get(workpiece_material, {})
            if wp_info:
                if wp_info.get("suitability") == "unsuitable":
                    general_warnings.append(
                        f"WARNING: {tool_material} is NOT suitable for {workpiece_material}. "
                        f"Reason: {wp_info.get('notes', 'Incompatible combination.')}"
                    )
                elif wp_info.get("suitability") == "conditional":
                    general_warnings.append(
                        f"CAUTION: {tool_material} has limited suitability for {workpiece_material}. "
                        f"{wp_info.get('notes', '')}"
                    )

        return {
            "tool_category": tool_category,
            "tool_material": tool_material,
            "tool_coating": tool_coating,
            "workpiece_material": workpiece_material,
            "suitable_operations": suitable,
            "conditional_operations": conditional,
            "unsuitable_operations": unsuitable,
            "general_warnings": general_warnings,
            "tool_condition_impact": condition_impact,
        }

    def check_operation_feasibility(
        self, tool_category: str, operation_type: str,
        workpiece_material: str = None, tool_material: str = None,
        cutting_speed: float = None, feed_rate: float = None,
        doc: float = None, current_vb: float = None
    ) -> dict:
        """Check if a specific operation is feasible with the given parameters."""
        compat = OPERATION_COMPATIBILITY.get(tool_category, {})
        op_info = compat.get(operation_type)

        if not op_info:
            # Check if operation exists at all
            if operation_type not in MACHINING_OPERATIONS:
                return {
                    "feasible": False,
                    "suitability": "unknown",
                    "reasons": [f"Unknown operation: '{operation_type}'."],
                    "warnings": [],
                }
            return {
                "feasible": False,
                "suitability": "unsuitable",
                "reasons": [f"No compatibility data for '{tool_category}' performing '{operation_type}'."],
                "warnings": ["This tool type is not designed for this operation."],
            }

        reasons = [op_info["reason"]]
        warnings = []
        suitability = op_info["suitability"]
        parameter_assessment = {}

        # Material check
        if workpiece_material and tool_material:
            mat_compat = MATERIAL_COMPATIBILITY.get(tool_material, {})
            wp_info = mat_compat.get(workpiece_material)
            if wp_info:
                if wp_info["suitability"] == "unsuitable":
                    suitability = "unsuitable"
                    reasons.append(f"Material incompatibility: {wp_info['notes']}")
                elif wp_info["suitability"] == "conditional":
                    if suitability == "suitable":
                        suitability = "conditional"
                    warnings.append(f"Material caution: {wp_info['notes']}")

                # Speed check
                if cutting_speed is not None:
                    wp_base = WORKPIECE_MATERIALS.get(workpiece_material, {})
                    base_speed = wp_base.get("base_speed_sfm", 200)
                    factor = wp_info.get("speed_factor", 1.0)
                    rec_min = base_speed * factor * 0.6
                    rec_max = base_speed * factor * 1.3
                    if cutting_speed > rec_max:
                        parameter_assessment["speed"] = "too_high"
                        warnings.append(f"Cutting speed {cutting_speed} SFM exceeds recommended max ~{int(rec_max)} SFM.")
                    elif cutting_speed < rec_min:
                        parameter_assessment["speed"] = "too_low"
                        warnings.append(f"Cutting speed {cutting_speed} SFM is below recommended min ~{int(rec_min)} SFM.")
                    else:
                        parameter_assessment["speed"] = "within_range"

        # Condition check
        if current_vb is not None:
            if current_vb >= 0.6:
                suitability = "unsuitable"
                reasons.append("Tool has exceeded wear limit (VB ≥ 0.6 mm). Must be replaced.")
            elif current_vb >= 0.3:
                if suitability == "suitable":
                    suitability = "conditional"
                warnings.append("Tool wear is significant (VB ≥ 0.3 mm). Reduce parameters and monitor closely.")

        feasible = suitability in ("suitable", "conditional")

        return {
            "feasible": feasible,
            "suitability": suitability,
            "operation": operation_type,
            "tool_category": tool_category,
            "reasons": reasons,
            "warnings": warnings,
            "parameter_assessment": parameter_assessment,
        }

    def get_material_recommendations(self, tool_material: str, tool_coating: str = None) -> list:
        """Get workpiece material compatibility for a tool material."""
        mat_compat = MATERIAL_COMPATIBILITY.get(tool_material, {})
        results = []
        for wp_name, info in mat_compat.items():
            entry = {
                "workpiece_material": wp_name,
                "suitability": info["suitability"],
                "speed_factor": info["speed_factor"],
                "notes": info["notes"],
            }
            # Add coating benefit if specified
            if tool_coating:
                coating = TOOL_COATINGS.get(tool_coating, {})
                entry["coating_speed_boost_pct"] = coating.get("speed_increase_pct", 0)
            results.append(entry)
        return sorted(results, key=lambda x: {"suitable": 0, "conditional": 1, "unsuitable": 2}.get(x["suitability"], 3))

    def get_damage_prevention_tips(
        self, tool_category: str = None,
        workpiece_material: str = None, operation: str = None
    ) -> list:
        """Return context-aware damage prevention guidelines."""
        tips = list(DAMAGE_PREVENTION_GUIDELINES)

        # For now, return all tips but mark relevance
        result = []
        for tip in tips:
            relevance = "general"
            if workpiece_material:
                cond = tip["condition"].lower()
                if "material" in cond:
                    relevance = "high"
                elif "speed" in cond or "feed" in cond:
                    relevance = "high"
            if tool_category:
                if "geometry" in tip["condition"].lower():
                    relevance = "high"
            result.append({**tip, "relevance": relevance})

        return result

    def get_wear_warnings(self, current_vb: float) -> dict:
        """ISO 3685-based condition assessment and warnings."""
        if current_vb < 0.10:
            category = "New / Minimal Wear"
            iso_status = "Well within service limits"
            action = "Continue normal operation"
            urgency = "none"
            color = "#22c55e"
        elif current_vb < 0.20:
            category = "Initial Wear Region"
            iso_status = "Within ISO 3685 initial wear zone"
            action = "Normal monitoring. Tool is performing as expected."
            urgency = "low"
            color = "#22c55e"
        elif current_vb < 0.30:
            category = "Steady-State Wear Region"
            iso_status = "Within ISO 3685 steady wear zone"
            action = "Schedule inspection. Plan for replacement within next 10-15 operations."
            urgency = "moderate"
            color = "#eab308"
        elif current_vb < 0.45:
            category = "Accelerated Wear Region"
            iso_status = "Approaching ISO 3685 uniform wear limit (0.3 mm)"
            action = "Reduce cutting parameters. Inspect after every 3-5 operations. Prepare replacement."
            urgency = "high"
            color = "#f97316"
        elif current_vb < 0.60:
            category = "Severe Wear"
            iso_status = "Exceeded uniform wear limit. Approaching catastrophic failure threshold."
            action = "Replace tool immediately. Only light finishing cuts if absolutely necessary."
            urgency = "critical"
            color = "#ef4444"
        else:
            category = "End of Life / Failure"
            iso_status = "Exceeded ISO 3685 failure criterion (VB ≥ 0.6 mm)"
            action = "STOP. Do not use. Replace immediately. Inspect workpiece for damage."
            urgency = "critical"
            color = "#dc2626"

        return {
            "current_vb_mm": current_vb,
            "category": category,
            "iso_status": iso_status,
            "recommended_action": action,
            "urgency": urgency,
            "color": color,
            "thresholds": {
                "initial_limit": 0.20,
                "uniform_wear_limit": 0.30,
                "accelerated_limit": 0.45,
                "failure_criterion": 0.60,
            },
        }

    def generate_full_recommendation(
        self, tool_info: dict, operation: str,
        workpiece_material: str, cutting_params: dict = None,
        current_condition: dict = None
    ) -> dict:
        """Complete recommendation combining all checks."""
        category = tool_info.get("category", "End Mill")
        material = tool_info.get("tool_material", "Solid Carbide")
        coating = tool_info.get("coating", "Uncoated")
        current_vb = current_condition.get("predicted_vb") if current_condition else None

        # Operation recommendation
        op_rec = self.recommend_operations(
            category, material, coating, workpiece_material, current_vb
        )

        # Feasibility check
        speed = cutting_params.get("cutting_speed") if cutting_params else None
        feed = cutting_params.get("feed_rate") if cutting_params else None
        doc = cutting_params.get("depth_of_cut") if cutting_params else None

        feasibility = self.check_operation_feasibility(
            category, operation, workpiece_material, material,
            speed, feed, doc, current_vb
        )

        # Material compatibility
        mat_rec = self.get_material_recommendations(material, coating)

        # Wear warnings
        wear_warn = self.get_wear_warnings(current_vb) if current_vb else None

        # Damage prevention
        prevention = self.get_damage_prevention_tips(category, workpiece_material, operation)

        return {
            "tool": tool_info,
            "requested_operation": operation,
            "workpiece_material": workpiece_material,
            "cutting_parameters": cutting_params,
            "feasibility": feasibility,
            "operation_recommendations": op_rec,
            "material_compatibility": mat_rec,
            "wear_assessment": wear_warn,
            "damage_prevention": prevention[:5],
            "summary": {
                "can_proceed": feasibility["feasible"],
                "suitability": feasibility["suitability"],
                "critical_warnings": [w for w in feasibility.get("warnings", [])
                                      if "WARNING" in w.upper() or "CRITICAL" in w.upper()],
            },
        }

