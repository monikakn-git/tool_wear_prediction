"""
Tool Classifier Module — Image-based cutting tool identification.

Uses feature-extraction (color histograms, shape descriptors, edge/texture analysis)
paired with a scikit-learn GradientBoosting classifier.  Falls back to heuristic
shape-based classification when no trained model is available.
"""

import cv2
import numpy as np
from PIL import Image
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
import joblib
import os
import io
from pathlib import Path
from typing import Union, Dict, Any, List, Optional

# ──────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────
TOOL_CATEGORIES: List[str] = [
    "End Mill",
    "Ball Nose End Mill",
    "Face Milling Cutter",
    "Twist Drill",
    "Reamer",
    "Turning Insert",
    "Boring Tool",
    "Chamfer Mill",
    "Thread Mill",
    "Slitting Saw",
]

# Default model save location (sibling to backend/models/)
_MODULE_DIR = Path(__file__).resolve().parent
_MODELS_DIR = _MODULE_DIR.parent / "models"
_DEFAULT_MODEL_PATH = _MODELS_DIR / "tool_classifier.joblib"
_DEFAULT_ENCODER_PATH = _MODELS_DIR / "tool_label_encoder.joblib"

# Standard image size for feature extraction
_TARGET_SIZE = (256, 256)


class ToolClassifier:
    """Identifies cutting-tool type from a photograph.

    Works in two modes:
    1. **Heuristic mode** (default) — shape / colour rule-based guess with low
       confidence.  Always available, no training data required.
    2. **Model mode** — trained GradientBoosting classifier loaded from disk.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model: Optional[Pipeline] = None
        self.label_encoder: Optional[LabelEncoder] = None
        self.model_available: bool = False

        model_file = Path(model_path) if model_path else _DEFAULT_MODEL_PATH
        encoder_file = (
            Path(model_path).with_name("tool_label_encoder.joblib")
            if model_path
            else _DEFAULT_ENCODER_PATH
        )

        if model_file.exists() and encoder_file.exists():
            try:
                self.model = joblib.load(model_file)
                self.label_encoder = joblib.load(encoder_file)
                self.model_available = True
                print(f"[ToolClassifier] Loaded trained model from {model_file}")
            except Exception as exc:
                print(f"[ToolClassifier] Failed to load model: {exc}")
                self.model_available = False
        else:
            print("[ToolClassifier] No trained model found — heuristic mode active.")

    # ──────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────

    def is_model_trained(self) -> bool:
        """Return whether a trained ML model is loaded."""
        return self.model_available

    def classify(self, image_input: Union[str, bytes, Path, Image.Image]) -> Dict[str, Any]:
        """Classify a cutting-tool image.

        Parameters
        ----------
        image_input : str | bytes | Path | PIL.Image
            File path, raw bytes, or a PIL Image.

        Returns
        -------
        dict with keys:
            category, confidence, top_3_predictions,
            features_extracted (int), method ("model" | "heuristic")
        """
        try:
            pil_img, cv_img = self._load_image(image_input)
            features = self.extract_features(pil_img, cv_img)

            if self.model_available:
                return self._predict_with_model(features)
            else:
                return self.get_default_prediction(pil_img, cv_img, features)
        except Exception as exc:
            return {
                "category": "Unknown",
                "confidence": 0.0,
                "confidence_label": "error",
                "top_3_predictions": [],
                "features_extracted": 0,
                "method": "error",
                "error": str(exc),
            }

    def get_default_prediction(
        self,
        pil_img: Optional[Image.Image] = None,
        cv_img: Optional[np.ndarray] = None,
        features: Optional[np.ndarray] = None,
        image_input: Optional[Union[str, bytes, Path, Image.Image]] = None,
    ) -> Dict[str, Any]:
        """Heuristic classification based on shape / colour characteristics.

        Can be called standalone with *image_input* or with pre-computed
        PIL/CV images and feature vector.
        """
        # Allow standalone call via image_input
        if pil_img is None or cv_img is None:
            if image_input is None:
                return {
                    "category": "Unknown",
                    "confidence": 0.0,
                    "confidence_label": "low",
                    "top_3_predictions": [],
                    "features_extracted": 0,
                    "method": "heuristic",
                    "note": "No image provided for heuristic analysis.",
                }
            pil_img, cv_img = self._load_image(image_input)

        if features is None:
            features = self.extract_features(pil_img, cv_img)

        shape_feats = self._extract_shape_features(cv_img)
        aspect_ratio = shape_feats[0]  # w/h aspect ratio
        solidity = shape_feats[1]
        extent = shape_feats[2]
        area_ratio = shape_feats[3]
        contour_count = shape_feats[4]
        circularity = shape_feats[-1] if len(shape_feats) > 8 else 0.0

        # Compute dominant hue from HSV histogram peak
        hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
        dominant_hue = float(np.argmax(cv2.calcHist([hsv], [0], None, [180], [0, 180])))

        scores: Dict[str, float] = {cat: 0.0 for cat in TOOL_CATEGORIES}

        # Rule 1: Long thin cylindrical → End Mill / Drill / Reamer
        if aspect_ratio > 3.0:
            scores["End Mill"] += 0.30
            scores["Twist Drill"] += 0.25
            scores["Reamer"] += 0.20
            scores["Boring Tool"] += 0.10
        elif aspect_ratio > 2.0:
            scores["End Mill"] += 0.20
            scores["Twist Drill"] += 0.15
            scores["Chamfer Mill"] += 0.10
            scores["Thread Mill"] += 0.10

        # Rule 2: Compact / square → Turning Insert
        if aspect_ratio < 1.5 and solidity > 0.8:
            scores["Turning Insert"] += 0.40
        if aspect_ratio < 1.3 and extent > 0.7:
            scores["Turning Insert"] += 0.15

        # Rule 3: Large circular → Face Milling Cutter / Slitting Saw
        if circularity > 0.7 and area_ratio > 0.3:
            scores["Face Milling Cutter"] += 0.30
            scores["Slitting Saw"] += 0.25
        if circularity > 0.85:
            scores["Slitting Saw"] += 0.15
            scores["Face Milling Cutter"] += 0.10

        # Rule 4: High contour complexity → toothed / fluted tools
        if contour_count > 15:
            scores["Face Milling Cutter"] += 0.10
            scores["Slitting Saw"] += 0.10
            scores["Thread Mill"] += 0.05

        # Rule 5: Ball nose hint — moderate aspect ratio, high circularity on tip
        if 1.5 < aspect_ratio < 4.0 and circularity > 0.5:
            scores["Ball Nose End Mill"] += 0.20

        # Rule 6: Metallic silver hue range
        if 0 <= dominant_hue <= 30 or dominant_hue > 160:
            scores["End Mill"] += 0.05
            scores["Twist Drill"] += 0.05

        # Rank
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_score = ranked[0][1] if ranked[0][1] > 0 else 0.01
        top_3 = [
            {"category": cat, "confidence": round(min(sc / max(top_score, 0.01), 1.0), 3)}
            for cat, sc in ranked[:3]
        ]

        return {
            "category": ranked[0][0],
            "confidence": round(min(top_score, 0.60), 3),  # cap at 0.60 for heuristic
            "confidence_label": "low",
            "top_3_predictions": top_3,
            "features_extracted": len(features),
            "method": "heuristic",
            "note": (
                "Classification is based on shape/colour heuristics. "
                "Confidence is intentionally capped at 60%. "
                "Train a model on labelled images for higher accuracy."
            ),
        }

    # ──────────────────────────────────────────────────────────────────
    # Feature extraction
    # ──────────────────────────────────────────────────────────────────

    def extract_features(
        self,
        pil_img_or_path: Union[str, Path, Image.Image, None] = None,
        cv_img: Optional[np.ndarray] = None,
    ) -> np.ndarray:
        """Extract a ~125-dimensional feature vector from an image.

        Accepts either a PIL Image / file path (first arg) or a pre-loaded
        OpenCV BGR ndarray (second arg), or both.
        """
        if pil_img_or_path is not None and cv_img is None:
            pil_img, cv_img = self._load_image(pil_img_or_path)
        elif cv_img is not None and pil_img_or_path is None:
            pil_img = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
        elif pil_img_or_path is not None and cv_img is not None:
            # Both provided — trust them
            if isinstance(pil_img_or_path, (str, Path)):
                pil_img = Image.open(pil_img_or_path).convert("RGB")
            else:
                pil_img = pil_img_or_path
        else:
            raise ValueError("Provide at least one of pil_img_or_path or cv_img.")

        features: List[float] = []

        # 1. Colour histogram (HSV, 3×32 = 96)
        features.extend(self._extract_color_histogram(cv_img))

        # 2. Shape features (~7)
        features.extend(self._extract_shape_features(cv_img))

        # 3. Edge features (3)
        features.extend(self._extract_edge_features(cv_img))

        # 4. Texture features (Gabor 4×2 = 8 + LBP stats 4 = 12)
        features.extend(self._extract_texture_features(cv_img))

        # 5. Size features (4)
        features.extend(self._extract_size_features(cv_img))

        return np.array(features, dtype=np.float64)

    # ──────────────────────────────────────────────────────────────────
    # Training helpers
    # ──────────────────────────────────────────────────────────────────

    def train_on_directory(self, image_dir: str) -> Dict[str, Any]:
        """Train classifier from a directory of labelled sub-folders.

        Expected layout::

            image_dir/
                End Mill/
                    img1.jpg
                    img2.png
                Twist Drill/
                    ...

        Returns training metrics dict.
        """
        image_dir = Path(image_dir)
        if not image_dir.is_dir():
            raise FileNotFoundError(f"Image directory not found: {image_dir}")

        X, y = [], []
        valid_ext = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}

        for category_dir in sorted(image_dir.iterdir()):
            if not category_dir.is_dir():
                continue
            label = category_dir.name
            if label not in TOOL_CATEGORIES:
                print(f"[ToolClassifier] Skipping unknown category folder: {label}")
                continue

            for img_file in category_dir.iterdir():
                if img_file.suffix.lower() not in valid_ext:
                    continue
                try:
                    pil_img, cv_img = self._load_image(str(img_file))
                    feats = self.extract_features(pil_img, cv_img)
                    X.append(feats)
                    y.append(label)
                except Exception as exc:
                    print(f"[ToolClassifier] Skipping {img_file}: {exc}")

        if len(X) < 5:
            raise ValueError(
                f"Only {len(X)} valid images found. Need at least 5 to train."
            )

        X_arr = np.array(X)
        self.label_encoder = LabelEncoder()
        y_enc = self.label_encoder.fit_transform(y)

        self.model = Pipeline([
            ("scaler", StandardScaler()),
            ("clf", GradientBoostingClassifier(
                n_estimators=200,
                max_depth=5,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42,
            )),
        ])

        # Cross-validation
        n_splits = min(5, len(set(y)))
        if len(X) >= n_splits * 2:
            cv_scores = cross_val_score(self.model, X_arr, y_enc, cv=n_splits, scoring="accuracy")
        else:
            cv_scores = np.array([0.0])

        # Full fit
        self.model.fit(X_arr, y_enc)
        self.model_available = True

        # Persist
        _MODELS_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, _DEFAULT_MODEL_PATH)
        joblib.dump(self.label_encoder, _DEFAULT_ENCODER_PATH)

        metrics = {
            "images_used": len(X),
            "categories_found": sorted(set(y)),
            "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
            "cv_accuracy_std": round(float(cv_scores.std()), 4),
            "model_saved_to": str(_DEFAULT_MODEL_PATH),
        }
        print(f"[ToolClassifier] Training complete: {metrics}")
        return metrics

    # ──────────────────────────────────────────────────────────────────
    # Private helpers — image loading
    # ──────────────────────────────────────────────────────────────────

    @staticmethod
    def _load_image(source: Union[str, bytes, Path, Image.Image]):
        """Load image and return (PIL.Image, cv2 BGR ndarray) tuple, resized."""
        if isinstance(source, Image.Image):
            pil_img = source.convert("RGB")
        elif isinstance(source, bytes):
            pil_img = Image.open(io.BytesIO(source)).convert("RGB")
        elif isinstance(source, (str, Path)):
            path = Path(source)
            if not path.exists():
                raise FileNotFoundError(f"Image not found: {path}")
            pil_img = Image.open(path).convert("RGB")
        else:
            raise TypeError(f"Unsupported image source type: {type(source)}")

        pil_img = pil_img.resize(_TARGET_SIZE, Image.LANCZOS)
        cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        return pil_img, cv_img

    # ──────────────────────────────────────────────────────────────────
    # Private helpers — feature groups
    # ──────────────────────────────────────────────────────────────────

    @staticmethod
    def _extract_color_histogram(cv_img: np.ndarray) -> List[float]:
        """HSV colour histogram — 3 channels × 32 bins = 96 features."""
        hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
        features: List[float] = []
        for ch, upper in [(0, 180), (1, 256), (2, 256)]:
            hist = cv2.calcHist([hsv], [ch], None, [32], [0, upper])
            hist = cv2.normalize(hist, hist).flatten()
            features.extend(hist.tolist())
        return features  # 96

    @staticmethod
    def _extract_shape_features(cv_img: np.ndarray) -> List[float]:
        """Shape descriptors from largest contour — ~7 features."""
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return [1.0, 0.0, 0.0, 0.0, 0, 0.0, 0.0]

        largest = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        perimeter = cv2.arcLength(largest, True)
        x, y, w, h = cv2.boundingRect(largest)
        hull = cv2.convexHull(largest)
        hull_area = cv2.contourArea(hull)

        aspect_ratio = float(w) / max(h, 1)
        solidity = float(area) / max(hull_area, 1)
        extent = float(area) / max(w * h, 1)
        img_area = cv_img.shape[0] * cv_img.shape[1]
        area_ratio = float(area) / max(img_area, 1)
        contour_count = len(contours)

        # Convexity defects count (proxy for flute/tooth count)
        try:
            hull_idx = cv2.convexHull(largest, returnPoints=False)
            if hull_idx is not None and len(hull_idx) > 3:
                defects = cv2.convexityDefects(largest, hull_idx)
                convexity_defects = 0 if defects is None else len(defects)
            else:
                convexity_defects = 0
        except Exception:
            convexity_defects = 0

        circularity = (4.0 * np.pi * area) / max(perimeter * perimeter, 1)

        return [
            aspect_ratio,
            solidity,
            extent,
            area_ratio,
            float(contour_count),
            float(convexity_defects),
            circularity,
        ]  # 7

    @staticmethod
    def _extract_edge_features(cv_img: np.ndarray) -> List[float]:
        """Canny edge density, H/V edge ratio, mean edge intensity — 3 features."""
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)

        total_pixels = max(edges.size, 1)
        edge_density = float(np.count_nonzero(edges)) / total_pixels

        # Sobel horizontal / vertical
        sobel_h = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_v = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        h_energy = float(np.sum(np.abs(sobel_h)))
        v_energy = float(np.sum(np.abs(sobel_v)))
        hv_ratio = h_energy / max(v_energy, 1.0)

        edge_mean = float(np.mean(edges))

        return [edge_density, hv_ratio, edge_mean]  # 3

    @staticmethod
    def _extract_texture_features(cv_img: np.ndarray) -> List[float]:
        """Gabor filter responses (4 orient × 2 freq = 8) + LBP-like stats (4) = 12."""
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY).astype(np.float64)
        features: List[float] = []

        # Gabor filters
        orientations = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]
        frequencies = [0.1, 0.3]
        for theta in orientations:
            for freq in frequencies:
                wavelength = 1.0 / max(freq, 1e-6)
                kernel = cv2.getGaborKernel(
                    (21, 21), sigma=4.0, theta=theta,
                    lambd=wavelength, gamma=0.5, psi=0,
                )
                response = cv2.filter2D(gray, cv2.CV_64F, kernel)
                features.append(float(np.mean(np.abs(response))))
        # 8 features

        # LBP-like statistics (simplified: local variance in patches)
        h, w = gray.shape
        patch_h, patch_w = h // 2, w // 2
        patches = [
            gray[:patch_h, :patch_w],
            gray[:patch_h, patch_w:],
            gray[patch_h:, :patch_w],
            gray[patch_h:, patch_w:],
        ]
        for patch in patches:
            features.append(float(np.std(patch)))
        # 4 features

        return features  # 12

    @staticmethod
    def _extract_size_features(cv_img: np.ndarray) -> List[float]:
        """Bounding-box dimensions, perimeter, circularity of largest contour — 4 features."""
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return [0.0, 0.0, 0.0, 0.0]

        largest = max(contours, key=cv2.contourArea)
        _, _, w, h = cv2.boundingRect(largest)
        perimeter = cv2.arcLength(largest, True)
        area = cv2.contourArea(largest)
        circularity = (4.0 * np.pi * area) / max(perimeter * perimeter, 1)

        img_h, img_w = cv_img.shape[:2]
        return [
            float(w) / max(img_w, 1),   # normalised width
            float(h) / max(img_h, 1),   # normalised height
            perimeter / max(img_w + img_h, 1),  # normalised perimeter
            circularity,
        ]  # 4

    # ──────────────────────────────────────────────────────────────────
    # Private — model-based prediction
    # ──────────────────────────────────────────────────────────────────

    def _predict_with_model(self, features: np.ndarray) -> Dict[str, Any]:
        """Run the trained sklearn pipeline and return structured result."""
        X = features.reshape(1, -1)
        proba = self.model.predict_proba(X)[0]
        classes = self.label_encoder.classes_

        ranked_idx = np.argsort(proba)[::-1]
        top_3 = [
            {"category": str(classes[i]), "confidence": round(float(proba[i]), 3)}
            for i in ranked_idx[:3]
        ]

        best_idx = ranked_idx[0]
        confidence = float(proba[best_idx])

        if confidence >= 0.70:
            conf_label = "high"
        elif confidence >= 0.40:
            conf_label = "medium"
        else:
            conf_label = "low"

        return {
            "category": str(classes[best_idx]),
            "confidence": round(confidence, 3),
            "confidence_label": conf_label,
            "top_3_predictions": top_3,
            "features_extracted": len(features),
            "method": "model",
        }


# Module-level singleton for convenience
tool_classifier = ToolClassifier()
