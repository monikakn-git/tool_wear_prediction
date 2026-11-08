import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "uploaded_data"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Dataset path
DEFAULT_DATASET_NAME = "mill.mat"
DEFAULT_DATASET_PATH = DATA_DIR / DEFAULT_DATASET_NAME

# Sensor Channels
SENSOR_CHANNELS = [
    "smcAC",       # AC Spindle motor current (Amperes)
    "smcDC",       # DC Spindle motor current (Amperes)
    "vib_table",   # Table vibration acceleration (g / m/s^2)
    "vib_spindle", # Spindle vibration acceleration (g / m/s^2)
    "AE_table",    # Acoustic emission at table (Volts)
    "AE_spindle"   # Acoustic emission at spindle (Volts)
]

# Machining Parameters
OPERATING_PARAMS = [
    "DOC",         # Depth of cut (mm: 1.5 or 0.75)
    "feed",        # Feed rate (mm/rev: 0.5 or 0.25)
    "material"     # Material (1 = cast iron, 2 = steel)
]

# Target variable
TARGET_VARIABLE = "VB"  # Flank wear (mm)

# Sampling specs
SAMPLING_POINTS_PER_RUN = 9000
SAMPLING_RATE_HZ = 250.0  # ~250 Hz based on NASA documentation

# Industrial Flank Wear Criteria (ISO 3685 Standard)
# VB < 0.20 mm: Normal/Break-in wear
# 0.20 <= VB < 0.40 mm: Progressive steady wear
# VB >= 0.40 mm: Severe/Critical tool wear requiring tool insert replacement
WEAR_THRESHOLD_INITIAL = 0.20
WEAR_THRESHOLD_CRITICAL = 0.40

