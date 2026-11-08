# NASA Milling Wear Dataset Data Dictionary

## 1. Dataset Overview
The NASA Milling Wear Dataset was acquired by the Ames Research Center Prognostics Center of Excellence in collaboration with UC Berkeley. The data represents face-milling experiments conducted on a Matsuura Machining Center (MC-510V) vertical CNC mill using KC710 titanium-carbide coated cutting inserts.

- **Total Experimental Runs:** 167 runs
- **Experimental Cases:** 16 cases (Tools tested under different cutting conditions)
- **Valid Tool Flank Wear (VB) Observations:** 146 runs
- **Unmeasured / Missing Wear Runs:** 21 runs (omitted from supervised regression training)
- **Signal Sampling Rate:** 250 Hz
- **Points per Signal Channel per Run:** 9,000 points (36-second cut duration)

---

## 2. Variables & Signal Channels

| Variable Name | Type | Physical Domain | Units | Description |
|---|---|---|---|---|
| `case` | Integer | Metadata | - | Experimental tool trial identifier (1 to 16). Used for grouped validation. |
| `run` | Integer | Metadata | - | Sequence index of the cutting pass with the designated cutter. |
| `VB` | Float | Target Variable | mm | Flank land wear width physically measured using an optical microscope. |
| `time` | Float | Parameter | s | Cumulative experiment or cut duration. |
| `DOC` | Float | Parameter | mm | Radial depth of cut (set to 0.75 mm or 1.50 mm). |
| `feed` | Float | Parameter | mm/rev | Table feed rate per revolution (0.25 mm/rev or 0.50 mm/rev). |
| `material` | Integer | Parameter | - | Workpiece material: `1` = Cast Iron, `2` = J45 Hardened Steel. |
| `smcAC` | Float[9000] | Sensor Channel | Amperes | AC spindle motor current, captured via Hall-effect transducer. |
| `smcDC` | Float[9000] | Sensor Channel | Amperes | DC spindle motor current, reflecting steady-state torque demands. |
| `vib_table` | Float[9000] | Sensor Channel | g | Workpiece table acceleration, measured via piezoelectric accelerometer. |
| `vib_spindle` | Float[9000] | Sensor Channel | g | Spindle head acceleration, measured via piezoelectric accelerometer. |
| `AE_table` | Float[9000] | Sensor Channel | Volts | Acoustic emission at the table fixture (high-frequency stress wave). |
| `AE_spindle` | Float[9000] | Sensor Channel | Volts | Acoustic emission at the spindle housing (tool-work engagement). |

---

## 3. Extracted Run-Level Statistical Features
From each of the 6 raw sensor arrays ($N = 9,000$ points), 9 statistical indicators are computed:

1. **Mean:** DC offset and steady-state drift ($\mu = \frac{1}{N}\sum x_i$).
2. **Root Mean Square (RMS):** Total energy and mechanical power ($\text{RMS} = \sqrt{\frac{1}{N}\sum x_i^2}$).
3. **Standard Deviation ($\sigma$):** Dynamic signal variance.
4. **Maximum ($\max$):** Peak positive amplitude.
5. **Minimum ($\min$):** Peak negative amplitude.
6. **Peak-to-Peak ($P2P$):** Full dynamic range ($\max - \min$).
7. **Skewness ($S$):** Degree of asymmetry of the probability distribution.
8. **Kurtosis ($K$):** Peakedness and presence of extreme transient impulses (micro-chipping).
9. **Crest Factor ($CF$):** Ratio of peak amplitude to RMS ($\frac{\max(|x|)}{\text{RMS}}$).

**Total Input Feature Vector Length:** $6 \times 9 + 3\ (\text{DOC, feed, material}) = 57$ features.

---

## 4. Flank Wear Target ($V_B$) & ISO 3685 Standard
Tool flank wear ($V_B$) represents the width of the wear land formed on the tool flank face due to abrasive and adhesive contact with the machined surface.

- **$V_B < 0.20$ mm:** Initial Break-in Wear Zone (Sharp tool).
- **$0.20 \le V_B < 0.40$ mm:** Steady-state / Progressive Wear Zone (Normal production).
- **$V_B \ge 0.40$ mm:** Severe / Critical Wear Zone (ISO 3685 tool replacement criterion).

