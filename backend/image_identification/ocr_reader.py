"""
OCR Reader — Extracts text, manufacturer markings, product codes,
and dimensional information from cutting-tool photographs.
"""
import re
from PIL import Image, ImageEnhance, ImageFilter
import io
import os

# Try importing pytesseract — gracefully handle if Tesseract not installed
try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

from backend.tool_catalogue.knowledge_base import KNOWN_MANUFACTURERS


class OCRReader:
    """Extracts text from cutting-tool images using OCR."""

    def __init__(self):
        self.tesseract_available = HAS_TESSERACT
        if HAS_TESSERACT:
            try:
                pytesseract.get_tesseract_version()
            except Exception:
                self.tesseract_available = False

    def _preprocess_for_ocr(self, img: Image.Image) -> Image.Image:
        """Enhance image for better OCR accuracy."""
        # Convert to grayscale
        gray = img.convert("L")
        # Increase contrast
        enhancer = ImageEnhance.Contrast(gray)
        gray = enhancer.enhance(2.0)
        # Increase sharpness
        enhancer = ImageEnhance.Sharpness(gray)
        gray = enhancer.enhance(2.0)
        # Apply slight denoise via median filter
        gray = gray.filter(ImageFilter.MedianFilter(size=3))
        # Binarize using adaptive-like threshold (simple)
        threshold = 128
        gray = gray.point(lambda p: 255 if p > threshold else 0)
        return gray

    def _load_image(self, image_input) -> Image.Image:
        """Load image from path or bytes."""
        if isinstance(image_input, str) and os.path.isfile(image_input):
            return Image.open(image_input)
        elif isinstance(image_input, bytes):
            return Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            return image_input
        else:
            raise ValueError("Image input must be a file path, bytes, or PIL Image.")

    def extract_text(self, image_input) -> dict:
        """
        Extract text from image using OCR.
        Returns raw text, cleaned lines, detected numbers, and codes.
        """
        if not self.tesseract_available:
            return {
                "available": False,
                "error": "Tesseract OCR is not installed or not found in PATH. "
                         "Install Tesseract from https://github.com/tesseract-ocr/tesseract",
                "raw_text": "",
                "cleaned_lines": [],
                "detected_numbers": [],
                "detected_codes": [],
            }

        try:
            img = self._load_image(image_input)
            processed = self._preprocess_for_ocr(img)

            # Run OCR with multiple PSM modes for best results
            raw_text = pytesseract.image_to_string(processed, config="--psm 6")

            # Also try with different orientation
            raw_text_2 = pytesseract.image_to_string(processed, config="--psm 11")

            # Combine unique lines
            all_lines = raw_text.split("\n") + raw_text_2.split("\n")
            cleaned = []
            seen = set()
            for line in all_lines:
                stripped = line.strip()
                if stripped and len(stripped) >= 2 and stripped.lower() not in seen:
                    seen.add(stripped.lower())
                    cleaned.append(stripped)

            # Extract numbers (dimensions, measurements)
            numbers = re.findall(r"\b\d+\.?\d*\b", " ".join(cleaned))
            numbers = [float(n) for n in numbers if 0.1 <= float(n) <= 500]

            # Extract alphanumeric codes (product IDs)
            codes = re.findall(
                r"\b[A-Z]{2,}[\s-]?\d{2,}(?:[\s.-]?\w+)*\b",
                " ".join(cleaned),
            )

            return {
                "available": True,
                "raw_text": raw_text.strip(),
                "cleaned_lines": cleaned,
                "detected_numbers": numbers,
                "detected_codes": codes,
            }
        except Exception as e:
            return {
                "available": True,
                "error": str(e),
                "raw_text": "",
                "cleaned_lines": [],
                "detected_numbers": [],
                "detected_codes": [],
            }

    def find_manufacturer(self, text_lines: list, known=None) -> dict:
        """Match extracted text against known manufacturer names."""
        if known is None:
            known = KNOWN_MANUFACTURERS
        combined = " ".join(text_lines).lower()
        matches = []
        for mfg in known:
            if mfg.lower() in combined:
                matches.append({"manufacturer": mfg, "confidence": "high"})
            else:
                # Check partial match (first word of multi-word names)
                first_word = mfg.split()[0].lower()
                if len(first_word) >= 4 and first_word in combined:
                    matches.append({"manufacturer": mfg, "confidence": "medium"})

        return {
            "matched_manufacturers": matches,
            "best_match": matches[0]["manufacturer"] if matches else None,
        }

    def find_product_code(self, text_lines: list) -> dict:
        """Find product/model codes using regex patterns."""
        combined = " ".join(text_lines)
        patterns = [
            # ISO turning insert codes: CNMG120408, WNMG080404, DNMG150608
            (r"\b[CDRSTW]N[A-Z]G\s?\d{6,8}\b", "ISO Insert Code"),
            # End mill codes: EM-4FL-3/8, F4AE0800
            (r"\b[A-Z]\d[A-Z]{1,3}\d{4,6}[A-Z]*\b", "Tool Product Code"),
            # General alphanumeric: 2P370-1000-PA
            (r"\b\d[A-Z]\d{3}-\d{4}-[A-Z]{2}\b", "Sandvik-style Code"),
            # Generic product numbers
            (r"\b[A-Z]{2,4}[-\s]?\d{3,6}[-\s]?[A-Z]{0,3}\b", "General Product Code"),
        ]
        found_codes = []
        for pattern, code_type in patterns:
            hits = re.findall(pattern, combined, re.IGNORECASE)
            for h in hits:
                found_codes.append({"code": h.strip(), "type": code_type})

        return {
            "product_codes": found_codes,
            "best_match": found_codes[0]["code"] if found_codes else None,
        }

    def find_dimensions(self, text_lines: list) -> dict:
        """Extract dimensional measurements from text."""
        combined = " ".join(text_lines)
        dims = {}

        # Diameter patterns: Ø8, D=10, 8mm dia
        dia_match = re.findall(r"(?:Ø|[Dd]ia(?:meter)?[\s=:]*|[Dd][\s=:]+)(\d+\.?\d*)", combined)
        if dia_match:
            dims["diameter_mm"] = float(dia_match[0])

        # Length patterns
        len_match = re.findall(r"(?:[Ll]ength|[Ll][\s=:]+|OAL[\s=:]*)(\d+\.?\d*)", combined)
        if len_match:
            dims["length_mm"] = float(len_match[0])

        # Numbers with mm unit
        mm_match = re.findall(r"(\d+\.?\d*)\s*mm", combined)
        if mm_match and "diameter_mm" not in dims:
            dims["detected_mm_values"] = [float(v) for v in mm_match]

        return dims

    def full_analysis(self, image_input) -> dict:
        """Complete OCR analysis combining text extraction, manufacturer, and code detection."""
        text_result = self.extract_text(image_input)
        if not text_result.get("available") or text_result.get("error"):
            return text_result

        lines = text_result["cleaned_lines"]
        mfg = self.find_manufacturer(lines)
        codes = self.find_product_code(lines)
        dimensions = self.find_dimensions(lines)

        return {
            "available": True,
            "raw_text": text_result["raw_text"],
            "cleaned_lines": lines,
            "detected_numbers": text_result["detected_numbers"],
            "manufacturer": mfg,
            "product_codes": codes,
            "dimensions": dimensions,
        }

