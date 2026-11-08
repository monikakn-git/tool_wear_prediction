"""
Visual Inspection — Damage Detector.
Analyses cutting-tool photographs to assess physical condition,
detect visible damage, and provide qualitative wear indicators.
"""
import numpy as np
from PIL import Image
import io
import os

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False


DISCLAIMER = (
    "Visual condition assessment is based on image analysis and provides "
    "qualitative indicators only. Accurate flank wear measurement (VB) "
    "requires calibrated microscope inspection. This assessment should be "
    "verified by physical inspection."
)


class DamageDetector:
    """Analyses cutting-tool images for visible physical defects."""

    def _load_image(self, image_input):
        """Load image as both PIL and OpenCV (numpy) formats."""
        if isinstance(image_input, str) and os.path.isfile(image_input):
            pil_img = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, bytes):
            pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
        elif isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")
        else:
            raise ValueError("Input must be a file path, bytes, or PIL Image.")

        # Resize to a manageable size while keeping aspect ratio
        max_dim = 800
        w, h = pil_img.size
        if max(w, h) > max_dim:
            scale = max_dim / max(w, h)
            pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        np_img = np.array(pil_img)
        return pil_img, np_img

    def _edge_analysis(self, gray: np.ndarray) -> dict:
        """Analyse cutting edge sharpness and regularity."""
        if not HAS_CV2:
            return {"sharpness_score": 0, "regularity_score": 0,
                    "discontinuities": 0, "available": False}

        # Canny edge detection
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.count_nonzero(edges) / edges.size

        # Laplacian for sharpness (higher variance = sharper edges)
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        lap_var = float(np.var(lap))

        # Sharpness score: higher Laplacian variance = sharper tool edges
        sharpness = min(100, int(lap_var / 50))

        # Regularity: check edge continuity via contour analysis
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        large_contours = [c for c in contours if cv2.contourArea(c) > 50]
        regularity = min(100, max(0, 100 - len(large_contours) * 2))

        # Discontinuities: gaps in major contours
        discontinuities = max(0, len(large_contours) - 5)

        return {
            "sharpness_score": sharpness,
            "regularity_score": regularity,
            "discontinuities": discontinuities,
            "edge_density": round(edge_density, 4),
            "laplacian_variance": round(lap_var, 2),
            "available": True,
        }

    def _surface_analysis(self, gray: np.ndarray, rgb: np.ndarray) -> dict:
        """Analyse surface texture and colour anomalies."""
        # Local variance as a roughness indicator
        from scipy.ndimage import uniform_filter
        local_mean = uniform_filter(gray.astype(float), size=11)
        local_sq = uniform_filter((gray.astype(float)) ** 2, size=11)
        local_var = local_sq - local_mean ** 2
        roughness = float(np.mean(local_var))

        # Discoloration: check for heat damage (blue/purple) or corrosion (orange/brown)
        hsv = rgb  # Convert to HSV if OpenCV available
        discoloration = False
        corrosion = False
        heat_damage = False

        if HAS_CV2:
            hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
            h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

            # Blue/purple tint indicates heat damage (H ~ 100-130 in OpenCV)
            blue_mask = (h >= 100) & (h <= 130) & (s > 30)
            blue_ratio = np.count_nonzero(blue_mask) / h.size
            if blue_ratio > 0.05:
                heat_damage = True
                discoloration = True

            # Orange/brown tint indicates corrosion (H ~ 5-25)
            orange_mask = (h >= 5) & (h <= 25) & (s > 50)
            orange_ratio = np.count_nonzero(orange_mask) / h.size
            if orange_ratio > 0.08:
                corrosion = True
                discoloration = True

        roughness_indicator = "low" if roughness < 200 else ("moderate" if roughness < 800 else "high")

        return {
            "roughness_value": round(roughness, 2),
            "roughness_indicator": roughness_indicator,
            "discoloration_detected": discoloration,
            "heat_damage_detected": heat_damage,
            "corrosion_likelihood": corrosion,
        }

    def _crack_detection(self, gray: np.ndarray) -> dict:
        """Detect potential cracks using line detection."""
        if not HAS_CV2:
            return {"cracks_detected": 0, "crack_lines": [], "available": False}

        # Edge detection with low threshold
        edges = cv2.Canny(gray, 30, 100)

        # Morphological closing to connect nearby edges
        kernel = np.ones((3, 3), np.uint8)
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

        # Hough line detection for linear features (potential cracks)
        lines = cv2.HoughLinesP(closed, 1, np.pi / 180, threshold=40,
                                minLineLength=30, maxLineGap=10)

        crack_candidates = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
                angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                crack_candidates.append({
                    "length_px": round(length, 1),
                    "angle_deg": round(angle, 1),
                })

        # Filter: only significant line features
        significant = [c for c in crack_candidates if c["length_px"] > 50]

        return {
            "cracks_detected": len(significant),
            "crack_lines": significant[:10],  # Limit to top 10
            "available": True,
        }

    def _geometric_analysis(self, gray: np.ndarray) -> dict:
        """Analyse geometric regularity to detect broken sections."""
        if not HAS_CV2:
            return {"symmetry_score": 0, "broken_sections_likely": False, "available": False}

        # Threshold and find main contour
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return {"symmetry_score": 50, "broken_sections_likely": False, "available": True}

        # Largest contour (assumed to be the tool)
        main = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(main)
        perimeter = cv2.arcLength(main, True)

        # Circularity = 4π × area / perimeter²  (1.0 for perfect circle)
        circularity = (4 * np.pi * area / (perimeter ** 2)) if perimeter > 0 else 0

        # Convexity = contour area / convex hull area
        hull = cv2.convexHull(main)
        hull_area = cv2.contourArea(hull)
        convexity = (area / hull_area) if hull_area > 0 else 0

        # Solidity check — low solidity may indicate broken/chipped sections
        broken_likely = convexity < 0.85

        # Symmetry: compare left and right halves
        moments = cv2.moments(main)
        cx = int(moments["m10"] / moments["m00"]) if moments["m00"] != 0 else gray.shape[1] // 2
        left_mass = np.sum(thresh[:, :cx])
        right_mass = np.sum(thresh[:, cx:])
        total = left_mass + right_mass
        symmetry = 1.0 - abs(left_mass - right_mass) / total if total > 0 else 0
        symmetry_score = int(symmetry * 100)

        return {
            "symmetry_score": symmetry_score,
            "circularity": round(circularity, 3),
            "convexity": round(convexity, 3),
            "broken_sections_likely": broken_likely,
            "available": True,
        }

    def analyze_condition(self, image_input) -> dict:
        """
        Full condition analysis of a cutting tool image.
        Returns overall condition, detected issues, and recommendations.
        """
        try:
            pil_img, np_img = self._load_image(image_input)
        except Exception as e:
            return {"error": f"Failed to load image: {e}", "disclaimer": DISCLAIMER}

        # Convert to grayscale
        gray = np.mean(np_img, axis=2).astype(np.uint8)

        # Run all analysis modules
        edge = self._edge_analysis(gray)
        surface = self._surface_analysis(gray, np_img)
        cracks = self._crack_detection(gray)
        geometry = self._geometric_analysis(gray)

        # Compile detected issues
        issues = []
        severity_points = 0

        if edge.get("sharpness_score", 50) < 30:
            issues.append({
                "type": "Dull Cutting Edge",
                "severity": "moderate",
                "confidence": "medium",
                "description": "Edge sharpness analysis indicates reduced cutting-edge definition.",
            })
            severity_points += 20

        if edge.get("discontinuities", 0) > 10:
            issues.append({
                "type": "Edge Discontinuity / Chipping",
                "severity": "high",
                "confidence": "medium",
                "description": f"Detected {edge['discontinuities']} edge discontinuities suggesting possible chipping.",
            })
            severity_points += 30

        if surface.get("heat_damage_detected"):
            issues.append({
                "type": "Heat Damage (Discoloration)",
                "severity": "high",
                "confidence": "medium",
                "description": "Blue/purple discoloration detected, indicating possible thermal damage from excessive heat.",
            })
            severity_points += 25

        if surface.get("corrosion_likelihood"):
            issues.append({
                "type": "Corrosion / Oxidation",
                "severity": "moderate",
                "confidence": "medium",
                "description": "Orange/brown coloration detected, suggesting possible corrosion or oxidation.",
            })
            severity_points += 15

        if surface.get("roughness_indicator") == "high":
            issues.append({
                "type": "Surface Roughness / Damage",
                "severity": "moderate",
                "confidence": "low",
                "description": "High surface variance detected, possibly indicating surface damage or heavy wear.",
            })
            severity_points += 15

        if cracks.get("cracks_detected", 0) > 3:
            issues.append({
                "type": "Potential Crack Lines",
                "severity": "critical",
                "confidence": "low",
                "description": f"Detected {cracks['cracks_detected']} linear features that may indicate cracks. Verify with physical inspection.",
            })
            severity_points += 35

        if geometry.get("broken_sections_likely"):
            issues.append({
                "type": "Possible Broken Section",
                "severity": "critical",
                "confidence": "low",
                "description": "Geometric analysis suggests irregular contour — possible broken or missing cutting section.",
            })
            severity_points += 40

        if geometry.get("symmetry_score", 100) < 60:
            issues.append({
                "type": "Geometric Asymmetry",
                "severity": "moderate",
                "confidence": "low",
                "description": "Tool profile shows significant asymmetry which may indicate uneven wear or damage.",
            })
            severity_points += 10

        # Calculate overall condition
        condition_score = max(0, 100 - severity_points)
        if condition_score >= 80:
            overall = "Good"
        elif condition_score >= 55:
            overall = "Fair"
        elif condition_score >= 30:
            overall = "Poor"
        else:
            overall = "Critical"

        # Recommendations
        recommendations = []
        if overall == "Good":
            recommendations.append("Tool appears to be in acceptable condition for continued use.")
            recommendations.append("Continue monitoring at regular intervals.")
        elif overall == "Fair":
            recommendations.append("Minor wear indicators detected. Inspect cutting edge under magnification.")
            recommendations.append("Consider reducing cutting speed or feed rate.")
            recommendations.append("Plan for tool replacement or indexing in the near future.")
        elif overall == "Poor":
            recommendations.append("Significant wear indicators detected. Physical inspection strongly recommended.")
            recommendations.append("Reduce cutting parameters immediately if tool must be used.")
            recommendations.append("Prepare replacement tool.")
        else:
            recommendations.append("CRITICAL: Tool should not be used without physical inspection and clearance.")
            recommendations.append("Replace or index the tool immediately.")
            recommendations.append("Inspect workpiece for damage from the worn tool.")

        limitations = [
            "Image resolution and lighting affect analysis accuracy.",
            "Flank wear (VB) cannot be measured numerically from a standard photograph.",
            "Internal cracks and subsurface damage cannot be detected visually.",
            "Coating condition assessment is limited to visible discoloration.",
            "This analysis does not replace calibrated microscope inspection per ISO 3685.",
        ]

        return {
            "overall_condition": overall,
            "condition_score": condition_score,
            "detected_issues": issues,
            "issue_count": len(issues),
            "edge_analysis": edge,
            "surface_analysis": surface,
            "crack_detection": cracks,
            "geometric_analysis": geometry,
            "recommendations": recommendations,
            "limitations": limitations,
            "image_size": {"width": pil_img.size[0], "height": pil_img.size[1]},
            "disclaimer": DISCLAIMER,
        }

