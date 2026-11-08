"""
Tool Life Estimator — Estimates remaining useful life using
degradation modelling of the NASA Milling Wear sequential data.
"""
import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
from scipy.io import loadmat
import os
import json


class ToolLifeEstimator:
    """Analyses tool wear progression and estimates remaining useful life."""

    def __init__(self, mat_path=None):
        if mat_path is None:
            mat_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "uploaded_data", "mill.mat"
            )
        self.mat_path = mat_path
        self._wear_histories = None

    # ── Degradation curve models ─────────────────────────────────────────
    @staticmethod
    def _linear(t, a, b):
        return a * t + b

    @staticmethod
    def _exponential(t, a, b, c):
        return a * np.exp(b * t) + c

    @staticmethod
    def _polynomial2(t, a, b, c):
        return a * t**2 + b * t + c

    @staticmethod
    def _power(t, a, b, c):
        return a * np.power(t + 0.1, b) + c

    def load_wear_history(self) -> dict:
        """Load NASA dataset and extract per-case wear progression."""
        if self._wear_histories is not None:
            return self._wear_histories

        if not os.path.isfile(self.mat_path):
            return {}

        mat = loadmat(self.mat_path, squeeze_me=True)
        mill = mat.get("mill")
        if mill is None:
            return {}

        cases = {}
        n_runs = mill.shape[0] if hasattr(mill, "shape") else len(mill)

        for i in range(n_runs):
            entry = mill[i]
            try:
                case_id = int(entry["case"]) if "case" in entry.dtype.names else 0
                run_id = int(entry["run"]) if "run" in entry.dtype.names else 0
                vb_raw = entry["VB"] if "VB" in entry.dtype.names else None
            except (ValueError, TypeError, KeyError):
                continue

            vb = float(vb_raw) if vb_raw is not None and not np.isnan(float(vb_raw)) else None
            if vb is None or vb <= 0:
                continue

            if case_id not in cases:
                cases[case_id] = []
            cases[case_id].append({"run": run_id, "vb": round(vb, 4), "index": i})

        # Sort each case by run number
        for cid in cases:
            cases[cid] = sorted(cases[cid], key=lambda x: x["run"])

        self._wear_histories = cases
        return cases

    def fit_degradation_model(self, wear_history: list, model_type="exponential") -> dict:
        """
        Fit a degradation curve to a tool's wear history.
        wear_history: list of dicts with 'run' and 'vb' keys.
        """
        if len(wear_history) < 3:
            return {
                "success": False,
                "error": "Insufficient data points (minimum 3 required).",
                "model_type": model_type,
            }

        t = np.array([d["run"] for d in wear_history], dtype=float)
        vb = np.array([d["vb"] for d in wear_history], dtype=float)

        # Normalize time to start from 0
        t_norm = t - t.min()

        models = {
            "linear": (self._linear, [0.01, 0.1], 2),
            "exponential": (self._exponential, [0.01, 0.05, 0.1], 3),
            "polynomial": (self._polynomial2, [0.001, 0.01, 0.1], 3),
            "power": (self._power, [0.1, 0.5, 0.01], 3),
        }

        if model_type not in models:
            model_type = "exponential"

        func, p0, n_params = models[model_type]

        try:
            popt, pcov = curve_fit(func, t_norm, vb, p0=p0, maxfev=5000)
            fitted = func(t_norm, *popt)
            ss_res = np.sum((vb - fitted) ** 2)
            ss_tot = np.sum((vb - np.mean(vb)) ** 2)
            r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0
            residuals = (vb - fitted).tolist()

            return {
                "success": True,
                "model_type": model_type,
                "parameters": [round(float(p), 6) for p in popt],
                "r_squared": round(float(r_squared), 4),
                "residuals": [round(r, 4) for r in residuals],
                "fitted_values": [round(float(f), 4) for f in fitted],
                "t_values": t.tolist(),
                "vb_actual": vb.tolist(),
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Curve fitting failed: {str(e)}",
                "model_type": model_type,
            }

    def estimate_remaining_life(
        self, wear_history: list, failure_threshold=0.6,
        model_type="exponential", avg_op_minutes=2.0
    ) -> dict:
        """
        Estimate remaining useful life by extrapolating the degradation model.
        """
        if len(wear_history) < 3:
            return {
                "success": False,
                "error": "Insufficient data for reliable life estimation. "
                         "At least 3 sequential wear measurements are required.",
                "limitations": [
                    "Remaining tool life cannot currently be estimated reliably "
                    "because sufficient usage-history observations are unavailable."
                ],
            }

        fit = self.fit_degradation_model(wear_history, model_type)
        if not fit["success"]:
            return {
                "success": False, "error": fit["error"],
                "limitations": ["Degradation model could not be fitted to the data."],
            }

        t = np.array([d["run"] for d in wear_history], dtype=float)
        vb = np.array([d["vb"] for d in wear_history], dtype=float)
        t_norm = t - t.min()

        current_run = int(t.max())
        current_vb = float(vb[-1])

        # Select model function
        funcs = {
            "linear": self._linear,
            "exponential": self._exponential,
            "polynomial": self._polynomial2,
            "power": self._power,
        }
        func = funcs[model_type]
        popt = fit["parameters"]

        # Extrapolate to find failure point
        max_extrapolate = int(t_norm.max()) + 200
        future_t = np.arange(0, max_extrapolate, 1)
        try:
            future_vb = func(future_t, *popt)
        except Exception:
            return {
                "success": False,
                "error": "Extrapolation failed.",
                "limitations": ["Model extrapolation produced invalid values."],
            }

        # Find where VB crosses threshold
        crossing_idx = np.where(future_vb >= failure_threshold)[0]
        if len(crossing_idx) > 0:
            failure_t = int(future_t[crossing_idx[0]])
            current_t = int(t_norm.max())
            remaining_ops = max(0, failure_t - current_t)
        else:
            failure_t = None
            remaining_ops = None

        # Wear rate (recent)
        if len(vb) >= 2:
            recent_rate = float((vb[-1] - vb[-2]) / max(1, t[-1] - t[-2]))
        else:
            recent_rate = 0.0

        # Acceleration (is wear increasing?)
        if len(vb) >= 3:
            rate_prev = (vb[-2] - vb[-3]) / max(1, t[-2] - t[-3])
            rate_curr = (vb[-1] - vb[-2]) / max(1, t[-1] - t[-2])
            accelerating = bool(rate_curr > rate_prev)
        else:
            accelerating = False

        # Confidence based on R² and data points
        r2 = fit["r_squared"]
        n_pts = len(wear_history)
        if r2 > 0.9 and n_pts >= 8:
            confidence = "high"
        elif r2 > 0.7 and n_pts >= 5:
            confidence = "medium"
        else:
            confidence = "low"

        # Projection curve for plotting
        plot_t = np.arange(0, min(max_extrapolate, int(t_norm.max()) + 50), 1)
        try:
            plot_vb = func(plot_t, *popt)
            projection = [
                {"run": int(t.min()) + int(pt), "projected_vb": round(float(pv), 4)}
                for pt, pv in zip(plot_t, plot_vb)
                if 0 < pv < 2.0  # Clip unreasonable values
            ]
        except Exception:
            projection = []

        # Inspection interval recommendation
        if confidence == "high":
            inspection_interval = max(2, remaining_ops // 5) if remaining_ops else 3
        elif confidence == "medium":
            inspection_interval = max(1, remaining_ops // 4) if remaining_ops else 2
        else:
            inspection_interval = 1

        remaining_minutes = round(remaining_ops * avg_op_minutes, 1) if remaining_ops else None

        limitations = [
            "Estimate assumes operating conditions remain constant.",
            "Actual tool life depends on workpiece material, speed, feed, and DOC.",
            f"Model R² = {r2:.3f} — {'good' if r2>0.85 else 'moderate' if r2>0.6 else 'limited'} fit.",
            f"Based on {n_pts} data points from the NASA Milling Wear dataset.",
        ]
        if confidence == "low":
            limitations.append(
                "Low confidence — prediction should be treated as a rough estimate only."
            )

        return {
            "success": True,
            "current_vb": round(current_vb, 4),
            "current_run": current_run,
            "total_runs_completed": len(wear_history),
            "failure_threshold": failure_threshold,
            "estimated_failure_run": int(t.min()) + failure_t if failure_t is not None else None,
            "remaining_operations": remaining_ops,
            "remaining_time_minutes": remaining_minutes,
            "confidence": confidence,
            "wear_rate_per_op": round(recent_rate, 5),
            "wear_accelerating": accelerating,
            "model_type": model_type,
            "model_r_squared": r2,
            "projection_curve": projection,
            "inspection_interval": inspection_interval,
            "limitations": limitations,
        }

    def get_all_case_analyses(self) -> list:
        """Analyse all NASA cases and return summary statistics."""
        histories = self.load_wear_history()
        summaries = []
        for case_id in sorted(histories.keys()):
            h = histories[case_id]
            vb_values = [d["vb"] for d in h]
            summary = {
                "case_id": case_id,
                "total_runs": len(h),
                "initial_vb": vb_values[0] if vb_values else None,
                "final_vb": vb_values[-1] if vb_values else None,
                "max_vb": max(vb_values) if vb_values else None,
                "min_vb": min(vb_values) if vb_values else None,
                "mean_vb": round(float(np.mean(vb_values)), 4) if vb_values else None,
                "wear_range": round(max(vb_values) - min(vb_values), 4) if len(vb_values) > 1 else 0,
            }

            # Try fitting a model
            if len(h) >= 3:
                fit = self.fit_degradation_model(h, "exponential")
                if not fit["success"]:
                    fit = self.fit_degradation_model(h, "linear")
                summary["best_model"] = fit.get("model_type", "none")
                summary["model_r_squared"] = fit.get("r_squared", 0)
            else:
                summary["best_model"] = "insufficient_data"
                summary["model_r_squared"] = None

            summaries.append(summary)
        return summaries

    def get_case_wear_progression(self, case_id: int) -> dict:
        """Return detailed wear progression for a specific case."""
        histories = self.load_wear_history()
        if case_id not in histories:
            return {"error": f"Case {case_id} not found."}

        h = histories[case_id]
        vb_values = [d["vb"] for d in h]

        # Fit best model
        best_fit = None
        best_r2 = -1
        for mtype in ["linear", "exponential", "polynomial", "power"]:
            fit = self.fit_degradation_model(h, mtype)
            if fit["success"] and fit["r_squared"] > best_r2:
                best_r2 = fit["r_squared"]
                best_fit = fit

        # Estimate life
        life_est = self.estimate_remaining_life(h, 0.6, best_fit["model_type"] if best_fit else "linear")

        return {
            "case_id": case_id,
            "wear_history": h,
            "total_runs": len(h),
            "vb_progression": vb_values,
            "run_numbers": [d["run"] for d in h],
            "best_fit": best_fit,
            "life_estimation": life_est,
        }

    def predict_from_manual_input(
        self, current_vb: float, runs_completed: int,
        operating_conditions: dict = None, failure_threshold: float = 0.6
    ) -> dict:
        """
        Estimate remaining life from manually entered data.
        Uses average degradation patterns from NASA dataset.
        """
        histories = self.load_wear_history()
        if not histories:
            return {
                "success": False,
                "error": "NASA dataset not loaded. Cannot establish baseline degradation model.",
            }

        # Compute average wear rate from all NASA cases
        all_rates = []
        for cid, h in histories.items():
            if len(h) >= 2:
                vb = [d["vb"] for d in h]
                for i in range(1, len(vb)):
                    rate = vb[i] - vb[i - 1]
                    if rate > 0:
                        all_rates.append(rate)

        if not all_rates:
            return {"success": False, "error": "Cannot compute average wear rate."}

        avg_rate = float(np.mean(all_rates))
        median_rate = float(np.median(all_rates))
        remaining_wear = max(0, failure_threshold - current_vb)

        if avg_rate <= 0:
            return {"success": False, "error": "Average wear rate is zero or negative."}

        remaining_ops_avg = int(remaining_wear / avg_rate)
        remaining_ops_median = int(remaining_wear / median_rate)

        # Condition classification
        if current_vb < 0.15:
            condition = "Initial Wear (Good)"
        elif current_vb < 0.30:
            condition = "Steady-State Wear (Acceptable)"
        elif current_vb < 0.45:
            condition = "Accelerated Wear (Monitor Closely)"
        else:
            condition = "Critical Wear (Replace Tool)"

        return {
            "success": True,
            "current_vb_mm": current_vb,
            "runs_completed": runs_completed,
            "failure_threshold_mm": failure_threshold,
            "condition_assessment": condition,
            "remaining_wear_budget_mm": round(remaining_wear, 4),
            "estimated_remaining_ops_avg": remaining_ops_avg,
            "estimated_remaining_ops_median": remaining_ops_median,
            "average_wear_rate_per_op": round(avg_rate, 5),
            "median_wear_rate_per_op": round(median_rate, 5),
            "confidence": "low",
            "limitations": [
                "Estimate uses average NASA dataset wear rates — actual rates depend on specific operating conditions.",
                "No sequential wear history provided for this specific tool.",
                "For reliable estimates, provide multiple sequential VB measurements.",
            ],
            "operating_conditions": operating_conditions,
        }

