"""
Tool Catalogue Service — CRUD operations for the cutting tool database.
Seeds default tools, handles queries, and provides dashboard statistics.
"""
import json
import datetime
from sqlalchemy.orm import Session
from backend.database.models import CuttingTool, ToolAssessment, SessionLocal
from backend.tool_catalogue.knowledge_base import (
    TOOL_CATEGORIES, TOOL_MATERIALS, TOOL_COATINGS,
    OPERATION_COMPATIBILITY, MATERIAL_COMPATIBILITY,
)


# ── Default tools to seed ────────────────────────────────────────────────
DEFAULT_TOOLS = [
    {"category": "End Mill", "subcategory": "Square End", "manufacturer": "Kennametal", "model_number": "F4AE0800AWL",
     "tool_material": "Solid Carbide", "coating": "TiAlN", "diameter_mm": 8.0, "num_flutes": 4, "helix_angle": 35.0,
     "shank_diameter_mm": 8.0, "overall_length_mm": 63.0, "cutting_length_mm": 20.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Stainless Steel (Austenitic)", "Cast Iron (Gray)"]),
     "compatible_operations": json.dumps(["Face Milling", "Side Milling", "Slot Milling", "Profile Milling", "Pocket Milling"]),
     "speed_range_min": 80, "speed_range_max": 200, "feed_range_min": 0.03, "feed_range_max": 0.10,
     "doc_range_min": 0.5, "doc_range_max": 8.0},
    {"category": "End Mill", "subcategory": "Square End", "manufacturer": "Sandvik Coromant", "model_number": "2P370-1000-PA",
     "tool_material": "Solid Carbide", "coating": "TiAlN", "diameter_mm": 10.0, "num_flutes": 4, "helix_angle": 30.0,
     "shank_diameter_mm": 10.0, "overall_length_mm": 72.0, "cutting_length_mm": 22.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Cast Iron (Gray)", "Cast Iron (Ductile)"]),
     "compatible_operations": json.dumps(["Face Milling", "Side Milling", "Slot Milling", "Pocket Milling"]),
     "speed_range_min": 100, "speed_range_max": 220, "feed_range_min": 0.04, "feed_range_max": 0.12,
     "doc_range_min": 0.5, "doc_range_max": 10.0},
    {"category": "End Mill", "subcategory": "Square End", "manufacturer": "Iscar", "model_number": "EC-E4L 12-22W12CF72",
     "tool_material": "Solid Carbide", "coating": "TiCN", "diameter_mm": 12.0, "num_flutes": 4, "helix_angle": 35.0,
     "shank_diameter_mm": 12.0, "overall_length_mm": 83.0, "cutting_length_mm": 26.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Stainless Steel (Austenitic)"]),
     "compatible_operations": json.dumps(["Face Milling", "Side Milling", "Slot Milling", "Profile Milling", "Pocket Milling"]),
     "speed_range_min": 90, "speed_range_max": 180, "feed_range_min": 0.04, "feed_range_max": 0.10,
     "doc_range_min": 0.5, "doc_range_max": 12.0},
    {"category": "End Mill", "subcategory": "Roughing", "manufacturer": "YG-1", "model_number": "E5E48060",
     "tool_material": "Solid Carbide", "coating": "AlTiN", "diameter_mm": 6.0, "num_flutes": 3, "helix_angle": 45.0,
     "shank_diameter_mm": 6.0, "overall_length_mm": 57.0, "cutting_length_mm": 13.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Stainless Steel (Austenitic)", "Titanium Alloy"]),
     "compatible_operations": json.dumps(["Side Milling", "Slot Milling", "Profile Milling", "Pocket Milling"]),
     "speed_range_min": 60, "speed_range_max": 150, "feed_range_min": 0.02, "feed_range_max": 0.08,
     "doc_range_min": 0.3, "doc_range_max": 6.0},
    {"category": "Ball Nose End Mill", "subcategory": "Ball End", "manufacturer": "Harvey Tool", "model_number": "843716",
     "tool_material": "Solid Carbide", "coating": "AlTiN", "diameter_mm": 6.0, "num_flutes": 2, "helix_angle": 30.0,
     "shank_diameter_mm": 6.0, "overall_length_mm": 57.0, "cutting_length_mm": 18.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Aluminum Alloy"]),
     "compatible_operations": json.dumps(["Profile Milling", "Contouring"]),
     "speed_range_min": 80, "speed_range_max": 200, "feed_range_min": 0.02, "feed_range_max": 0.06,
     "doc_range_min": 0.1, "doc_range_max": 3.0},
    {"category": "Ball Nose End Mill", "subcategory": "Ball End", "manufacturer": "Mitsubishi Materials", "model_number": "VF2SBR0500",
     "tool_material": "Solid Carbide", "coating": "TiAlN", "diameter_mm": 10.0, "num_flutes": 2, "helix_angle": 30.0,
     "shank_diameter_mm": 10.0, "overall_length_mm": 70.0, "cutting_length_mm": 22.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Stainless Steel (Austenitic)", "Aluminum Alloy"]),
     "compatible_operations": json.dumps(["Contouring", "Profile Milling"]),
     "speed_range_min": 70, "speed_range_max": 180, "feed_range_min": 0.03, "feed_range_max": 0.08,
     "doc_range_min": 0.2, "doc_range_max": 5.0},
    {"category": "Face Milling Cutter", "subcategory": "Indexable", "manufacturer": "Sandvik Coromant", "model_number": "R245-080Q27-12M",
     "tool_material": "Tungsten Carbide", "coating": "TiCN", "diameter_mm": 80.0, "num_flutes": 6, "helix_angle": 0.0,
     "shank_diameter_mm": 27.0, "overall_length_mm": 50.0, "cutting_length_mm": 4.5,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Cast Iron (Gray)", "Cast Iron (Ductile)"]),
     "compatible_operations": json.dumps(["Face Milling"]),
     "speed_range_min": 120, "speed_range_max": 300, "feed_range_min": 0.10, "feed_range_max": 0.25,
     "doc_range_min": 0.5, "doc_range_max": 4.0},
    {"category": "Twist Drill", "subcategory": "Jobber Length", "manufacturer": "Guhring", "model_number": "5515 8.00",
     "tool_material": "Solid Carbide", "coating": "TiN", "diameter_mm": 8.0, "num_flutes": 2, "helix_angle": 30.0,
     "shank_diameter_mm": 8.0, "overall_length_mm": 79.0, "cutting_length_mm": 41.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Stainless Steel (Austenitic)", "Aluminum Alloy"]),
     "compatible_operations": json.dumps(["Drilling"]),
     "speed_range_min": 60, "speed_range_max": 180, "feed_range_min": 0.10, "feed_range_max": 0.25,
     "doc_range_min": 0.0, "doc_range_max": 41.0},
    {"category": "Twist Drill", "subcategory": "Stub Length", "manufacturer": "OSG", "model_number": "ADO-3D 10.0",
     "tool_material": "Solid Carbide", "coating": "TiAlN", "diameter_mm": 10.0, "num_flutes": 2, "helix_angle": 30.0,
     "shank_diameter_mm": 10.0, "overall_length_mm": 89.0, "cutting_length_mm": 30.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Cast Iron (Gray)", "Aluminum Alloy"]),
     "compatible_operations": json.dumps(["Drilling"]),
     "speed_range_min": 80, "speed_range_max": 200, "feed_range_min": 0.15, "feed_range_max": 0.30,
     "doc_range_min": 0.0, "doc_range_max": 30.0},
    {"category": "Reamer", "subcategory": "Machine Reamer", "manufacturer": "Dormer Pramet", "model_number": "B951 10.0mm",
     "tool_material": "Solid Carbide", "coating": "TiAlN", "diameter_mm": 10.0, "num_flutes": 6, "helix_angle": 15.0,
     "shank_diameter_mm": 10.0, "overall_length_mm": 72.0, "cutting_length_mm": 24.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Cast Iron (Gray)"]),
     "compatible_operations": json.dumps(["Reaming"]),
     "speed_range_min": 40, "speed_range_max": 100, "feed_range_min": 0.15, "feed_range_max": 0.40,
     "doc_range_min": 0.1, "doc_range_max": 0.3},
    {"category": "Turning Insert", "subcategory": "CNMG", "manufacturer": "Sandvik Coromant", "model_number": "CNMG 12 04 08-PM 4325",
     "tool_material": "Tungsten Carbide", "coating": "TiCN", "diameter_mm": 12.7, "num_flutes": 0, "helix_angle": 0.0,
     "shank_diameter_mm": 0.0, "overall_length_mm": 12.7, "cutting_length_mm": 4.8,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel"]),
     "compatible_operations": json.dumps(["Turning (Roughing)", "Turning (Finishing)"]),
     "speed_range_min": 200, "speed_range_max": 400, "feed_range_min": 0.15, "feed_range_max": 0.50,
     "doc_range_min": 0.5, "doc_range_max": 5.0},
    {"category": "Turning Insert", "subcategory": "WNMG", "manufacturer": "Kyocera", "model_number": "WNMG080408HQ CA5525",
     "tool_material": "Tungsten Carbide", "coating": "TiAlN", "diameter_mm": 12.7, "num_flutes": 0, "helix_angle": 0.0,
     "shank_diameter_mm": 0.0, "overall_length_mm": 9.525, "cutting_length_mm": 4.7,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Stainless Steel (Austenitic)"]),
     "compatible_operations": json.dumps(["Turning (Roughing)", "Turning (Finishing)"]),
     "speed_range_min": 150, "speed_range_max": 350, "feed_range_min": 0.10, "feed_range_max": 0.40,
     "doc_range_min": 0.5, "doc_range_max": 4.0},
    {"category": "Boring Tool", "subcategory": "Fine Boring", "manufacturer": "Kennametal", "model_number": "A12SCLCR3",
     "tool_material": "Tungsten Carbide", "coating": "TiN", "diameter_mm": 16.0, "num_flutes": 1, "helix_angle": 0.0,
     "shank_diameter_mm": 12.0, "overall_length_mm": 150.0, "cutting_length_mm": 20.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Cast Iron (Gray)"]),
     "compatible_operations": json.dumps(["Boring"]),
     "speed_range_min": 100, "speed_range_max": 250, "feed_range_min": 0.05, "feed_range_max": 0.15,
     "doc_range_min": 0.2, "doc_range_max": 2.0},
    {"category": "Chamfer Mill", "subcategory": "90 Degree", "manufacturer": "Harvey Tool", "model_number": "849408-C3",
     "tool_material": "Solid Carbide", "coating": "AlTiN", "diameter_mm": 8.0, "num_flutes": 4, "helix_angle": 0.0,
     "shank_diameter_mm": 8.0, "overall_length_mm": 63.0, "cutting_length_mm": 8.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Stainless Steel (Austenitic)", "Aluminum Alloy"]),
     "compatible_operations": json.dumps(["Chamfering"]),
     "speed_range_min": 80, "speed_range_max": 180, "feed_range_min": 0.02, "feed_range_max": 0.06,
     "doc_range_min": 0.1, "doc_range_max": 2.0},
    {"category": "Thread Mill", "subcategory": "M10×1.5", "manufacturer": "Emuge-Franken", "model_number": "Z5244 300 M10",
     "tool_material": "Solid Carbide", "coating": "TiCN", "diameter_mm": 7.5, "num_flutes": 3, "helix_angle": 0.0,
     "shank_diameter_mm": 10.0, "overall_length_mm": 72.0, "cutting_length_mm": 14.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Stainless Steel (Austenitic)"]),
     "compatible_operations": json.dumps(["Thread Milling"]),
     "speed_range_min": 50, "speed_range_max": 120, "feed_range_min": 0.01, "feed_range_max": 0.05,
     "doc_range_min": 0.0, "doc_range_max": 1.5},
    {"category": "End Mill", "subcategory": "Aluminum High-Speed", "manufacturer": "Destiny Tool", "model_number": "V2AH3 12mm",
     "tool_material": "Solid Carbide", "coating": "DLC", "diameter_mm": 12.0, "num_flutes": 3, "helix_angle": 45.0,
     "shank_diameter_mm": 12.0, "overall_length_mm": 83.0, "cutting_length_mm": 30.0,
     "compatible_materials": json.dumps(["Aluminum Alloy", "Copper Alloy"]),
     "compatible_operations": json.dumps(["Face Milling", "Side Milling", "Slot Milling", "Profile Milling", "Pocket Milling"]),
     "speed_range_min": 300, "speed_range_max": 800, "feed_range_min": 0.05, "feed_range_max": 0.20,
     "doc_range_min": 0.5, "doc_range_max": 12.0},
    {"category": "Slitting Saw", "subcategory": "HSS Slitting", "manufacturer": "Niagara Cutter", "model_number": "SS540 63×2.0",
     "tool_material": "HSS", "coating": "TiN", "diameter_mm": 63.0, "num_flutes": 36, "helix_angle": 0.0,
     "shank_diameter_mm": 22.0, "overall_length_mm": 63.0, "cutting_length_mm": 2.0,
     "compatible_materials": json.dumps(["Carbon Steel", "Alloy Steel", "Aluminum Alloy", "Copper Alloy"]),
     "compatible_operations": json.dumps(["Slot Milling"]),
     "speed_range_min": 20, "speed_range_max": 80, "feed_range_min": 0.01, "feed_range_max": 0.04,
     "doc_range_min": 0.5, "doc_range_max": 30.0},
]


class ToolCatalogueService:
    """Service for managing the cutting tool catalogue."""

    def seed_default_tools(self):
        """Seed the database with default tools if empty."""
        db = SessionLocal()
        try:
            count = db.query(CuttingTool).count()
            if count > 0:
                return {"message": f"Database already has {count} tools", "seeded": 0}
            for t in DEFAULT_TOOLS:
                tool = CuttingTool(**t)
                db.add(tool)
            db.commit()
            return {"message": f"Seeded {len(DEFAULT_TOOLS)} default tools", "seeded": len(DEFAULT_TOOLS)}
        finally:
            db.close()

    def get_all_tools(self, category=None, material=None):
        db = SessionLocal()
        try:
            q = db.query(CuttingTool)
            if category:
                q = q.filter(CuttingTool.category == category)
            if material:
                q = q.filter(CuttingTool.tool_material == material)
            return [t.to_dict() for t in q.order_by(CuttingTool.category, CuttingTool.manufacturer).all()]
        finally:
            db.close()

    def get_tool_by_id(self, tool_id: int):
        db = SessionLocal()
        try:
            tool = db.query(CuttingTool).filter(CuttingTool.id == tool_id).first()
            return tool.to_dict() if tool else None
        finally:
            db.close()

    def add_tool(self, data: dict):
        db = SessionLocal()
        try:
            if "compatible_materials" in data and isinstance(data["compatible_materials"], list):
                data["compatible_materials"] = json.dumps(data["compatible_materials"])
            if "compatible_operations" in data and isinstance(data["compatible_operations"], list):
                data["compatible_operations"] = json.dumps(data["compatible_operations"])
            tool = CuttingTool(**data)
            db.add(tool)
            db.commit()
            db.refresh(tool)
            return tool.to_dict()
        finally:
            db.close()

    def update_tool(self, tool_id: int, data: dict):
        db = SessionLocal()
        try:
            tool = db.query(CuttingTool).filter(CuttingTool.id == tool_id).first()
            if not tool:
                return None
            if "compatible_materials" in data and isinstance(data["compatible_materials"], list):
                data["compatible_materials"] = json.dumps(data["compatible_materials"])
            if "compatible_operations" in data and isinstance(data["compatible_operations"], list):
                data["compatible_operations"] = json.dumps(data["compatible_operations"])
            for k, v in data.items():
                if hasattr(tool, k):
                    setattr(tool, k, v)
            tool.updated_at = datetime.datetime.utcnow()
            db.commit()
            db.refresh(tool)
            return tool.to_dict()
        finally:
            db.close()

    def delete_tool(self, tool_id: int):
        db = SessionLocal()
        try:
            tool = db.query(CuttingTool).filter(CuttingTool.id == tool_id).first()
            if not tool:
                return False
            db.delete(tool)
            db.commit()
            return True
        finally:
            db.close()

    def search_tools(self, query: str):
        db = SessionLocal()
        try:
            q_lower = f"%{query.lower()}%"
            results = db.query(CuttingTool).filter(
                (CuttingTool.category.ilike(q_lower)) |
                (CuttingTool.manufacturer.ilike(q_lower)) |
                (CuttingTool.model_number.ilike(q_lower)) |
                (CuttingTool.tool_material.ilike(q_lower)) |
                (CuttingTool.subcategory.ilike(q_lower))
            ).all()
            return [t.to_dict() for t in results]
        finally:
            db.close()

    def get_tool_stats(self):
        db = SessionLocal()
        try:
            total = db.query(CuttingTool).count()
            categories = {}
            for tool in db.query(CuttingTool).all():
                categories[tool.category] = categories.get(tool.category, 0) + 1
            manufacturers = {}
            for tool in db.query(CuttingTool).all():
                manufacturers[tool.manufacturer] = manufacturers.get(tool.manufacturer, 0) + 1
            assessments = db.query(ToolAssessment).count()
            recent = db.query(ToolAssessment).order_by(
                ToolAssessment.created_at.desc()
            ).limit(5).all()
            return {
                "total_tools": total,
                "categories": categories,
                "manufacturers": manufacturers,
                "total_assessments": assessments,
                "recent_assessments": [a.to_dict() for a in recent],
            }
        finally:
            db.close()

    def get_compatible_operations(self, tool_id: int):
        tool = self.get_tool_by_id(tool_id)
        if not tool:
            return []
        category = tool["category"]
        compat = OPERATION_COMPATIBILITY.get(category, {})
        ops = []
        for op, info in compat.items():
            ops.append({
                "operation": op,
                "suitability": info["suitability"],
                "reason": info["reason"],
            })
        return sorted(ops, key=lambda x: {"suitable": 0, "conditional": 1, "unsuitable": 2}.get(x["suitability"], 3))

    def get_material_compatibility(self, tool_id: int):
        tool = self.get_tool_by_id(tool_id)
        if not tool:
            return []
        mat = tool["tool_material"]
        compat = MATERIAL_COMPATIBILITY.get(mat, {})
        result = []
        for wp, info in compat.items():
            result.append({
                "workpiece_material": wp,
                "suitability": info["suitability"],
                "speed_factor": info["speed_factor"],
                "notes": info["notes"],
            })
        return sorted(result, key=lambda x: {"suitable": 0, "conditional": 1, "unsuitable": 2}.get(x["suitability"], 3))

