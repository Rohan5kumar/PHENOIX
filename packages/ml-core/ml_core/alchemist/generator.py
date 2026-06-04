"""Synthetic balancing data via DeepSeek v4-Pro structured outputs."""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from ml_core.alchemist.governance import compute_bias_check, compute_diversity_score
from ml_core.pipeline_signals import PipelineSignal
from ml_core.sentinel.drift_report import DriftReport

try:
    from openai import OpenAI as _OpenAI
except ImportError:
    _OpenAI = None  # type: ignore[misc, assignment]

_PACKAGE_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_PATH = _PACKAGE_ROOT / "data" / "healed_batch.csv"
LEGACY_OUTPUT_PATH = _PACKAGE_ROOT / "data" / "synthetic_batch.csv"

STRUCTURED_OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "rows": {
            "type": "array",
            "items": {"type": "object", "additionalProperties": {"type": "number"}},
        },
        "recipe": {
            "type": "object",
            "additionalProperties": {
                "type": "object",
                "properties": {
                    "dist": {"type": "string"},
                    "mean": {"type": "number"},
                    "std": {"type": "number"},
                    "low": {"type": "number"},
                    "high": {"type": "number"},
                },
            },
        },
        "governance": {
            "type": "object",
            "properties": {
                "diversity_score": {"type": "number"},
                "bias_check_result": {"type": "string"},
            },
        },
    },
    "required": ["rows", "recipe"],
}


@dataclass
class AlchemistResult:
    path: Path
    signal: PipelineSignal
    diversity_score: float
    bias_check_result: str
    row_count: int
    estimated_cost: float


def generate_synthetic_batch(
    schema_columns: list[str],
    n_rows: int = 100,
    *,
    seed: int = 42,
) -> pd.DataFrame:
    """Produce a reproducible synthetic batch matching the reference schema."""
    rng = np.random.default_rng(seed)
    data: dict[str, list[float]] = {}
    for col in schema_columns:
        data[col] = rng.normal(loc=0.0, scale=1.0, size=n_rows).tolist()
    return pd.DataFrame(data)


def _column_recipe_from_stats(
    col: str,
    stats: dict[str, float],
    *,
    drifted: bool,
) -> dict[str, Any]:
    mean = stats.get("mean", 0.0)
    std = max(stats.get("std", 1.0), 1e-6)
    lo = stats.get("min", mean - std)
    hi = stats.get("max", mean + std)
    if drifted or std < 1e-3:
        return {"dist": "normal", "mean": mean, "std": std}
    span = hi - lo
    if span > 1e-6 and (hi <= 1.0 and lo >= 0.0):
        return {"dist": "uniform", "low": lo, "high": hi}
    return {"dist": "normal", "mean": mean, "std": std}


def _fallback_recipe(
    feature_columns: list[str],
    reference_stats: dict[str, dict[str, float]],
    drifted_features: list[str],
) -> dict[str, dict[str, Any]]:
    drifted = set(drifted_features)
    recipe: dict[str, dict[str, Any]] = {}
    for col in feature_columns:
        stats = reference_stats.get(col, {"mean": 0.0, "std": 1.0, "min": -1.0, "max": 1.0})
        recipe[col] = _column_recipe_from_stats(col, stats, drifted=col in drifted)
    return recipe


def _parse_json_object(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, dict):
            return parsed
    raise ValueError("Response did not contain a JSON object")


def _normalize_recipe(
    raw: dict[str, Any],
    feature_columns: list[str],
    reference_stats: dict[str, dict[str, float]],
    drifted_features: list[str],
) -> dict[str, dict[str, Any]]:
    base = _fallback_recipe(feature_columns, reference_stats, drifted_features)
    recipe_block = raw.get("recipe") if isinstance(raw.get("recipe"), dict) else raw
    for col in feature_columns:
        spec = recipe_block.get(col) if isinstance(recipe_block, dict) else None
        if not isinstance(spec, dict):
            continue
        dist = str(spec.get("dist", "normal")).lower()
        if dist == "uniform":
            base[col] = {
                "dist": "uniform",
                "low": float(spec.get("low", base[col].get("low", 0.0))),
                "high": float(spec.get("high", base[col].get("high", 1.0))),
            }
        else:
            ref = reference_stats.get(col, {})
            base[col] = {
                "dist": "normal",
                "mean": float(spec.get("mean", ref.get("mean", 0.0))),
                "std": max(float(spec.get("std", ref.get("std", 1.0))), 1e-6),
            }
    return base


def _materialize_recipe(
    recipe: dict[str, dict[str, Any]],
    columns: list[str],
    n_rows: int,
    *,
    seed: int = 42,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    data: dict[str, np.ndarray] = {}
    for col in columns:
        spec = recipe.get(col, {"dist": "normal", "mean": 0.0, "std": 1.0})
        dist = str(spec.get("dist", "normal")).lower()
        if dist == "uniform":
            low = float(spec.get("low", 0.0))
            high = float(spec.get("high", 1.0))
            if high <= low:
                high = low + 1e-6
            data[col] = rng.uniform(low, high, n_rows)
        else:
            mean = float(spec.get("mean", 0.0))
            std = max(float(spec.get("std", 1.0)), 1e-6)
            data[col] = rng.normal(mean, std, n_rows)
    return pd.DataFrame(data)


def _rows_to_dataframe(rows: list[Any], feature_columns: list[str]) -> pd.DataFrame:
    clean: list[dict[str, float]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        entry = {c: float(row[c]) for c in feature_columns if c in row}
        if len(entry) == len(feature_columns):
            clean.append(entry)
    return pd.DataFrame(clean) if clean else pd.DataFrame(columns=feature_columns)


def notify_alchemist_action(
    *,
    diversity_score: float,
    bias_check_result: str,
    drifted_features: list[str],
    row_count: int,
    batch_path: str,
    estimated_cost: float = 0.0,
) -> None:
    """POST governance record to Phoenix API (best-effort)."""
    base = os.environ.get("PHOENIX_API_URL", "http://127.0.0.1:8000").rstrip("/")
    try:
        import httpx

        httpx.post(
            f"{base}/governance/alchemist-actions",
            json={
                "diversity_score": diversity_score,
                "bias_check_result": bias_check_result,
                "drifted_features": drifted_features,
                "row_count": row_count,
                "batch_path": batch_path,
                "estimated_cost": estimated_cost,
            },
            timeout=5.0,
        )
    except Exception:
        pass


class SyntheticAlchemist:
    """
    Data Alchemist: DeepSeek v4-Pro structured synthesis for drift healing.

    Accepts ``drifted_features`` + ``schema_definition`` (column → stats/types),
    or a full ``DriftReport`` from Sentinel.
    """

    def __init__(
        self,
        *,
        drifted_features: list[str] | None = None,
        schema_definition: dict[str, Any] | None = None,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
    ) -> None:
        self.drifted_features = list(drifted_features or [])
        self.schema_definition = dict(schema_definition or {})
        self.api_key = api_key if api_key is not None else os.environ.get("DEEPSEEK_API_KEY")
        self.model = model or os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-pro")
        self.base_url = base_url or os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    @classmethod
    def from_drift_report(cls, report: DriftReport, **kwargs: Any) -> SyntheticAlchemist:
        return cls(
            drifted_features=report.drifted_features,
            schema_definition={
                "columns": report.feature_columns,
                "reference_stats": report.reference_stats,
                "drift_scores": report.drift_scores,
            },
            **kwargs,
        )

    def _feature_columns(self) -> list[str]:
        cols = self.schema_definition.get("columns")
        if isinstance(cols, list) and cols:
            return [str(c) for c in cols]
        return list(self.schema_definition.get("reference_stats", {}).keys())

    def _reference_stats(self) -> dict[str, dict[str, float]]:
        stats = self.schema_definition.get("reference_stats")
        if isinstance(stats, dict):
            return stats
        return {}

    def _request_structured_batch(self, count: int) -> dict[str, Any]:
        if _OpenAI is None:
            raise RuntimeError("openai required; install ml-core[alchemist]")

        feature_columns = self._feature_columns()
        client = _OpenAI(api_key=self.api_key, base_url=self.base_url)
        sample_cap = min(count, 120)

        system = (
            "You are the Phoenix Data Alchemist (2026). Given feature drift, emit JSON with:\n"
            "- rows: high-fidelity synthetic tabular rows that specifically target 'edge-case' data\n"
            "  which counters the drift identified in the report.\n"
            "- recipe: per-column sampling spec (normal or uniform) to heal drift\n"
            "- governance: diversity_score (0-1) and bias_check_result (pass|review|fail)\n"
            "Reply with JSON only."
        )
        user = json.dumps(
            {
                "drifted_features": self.drifted_features,
                "schema_definition": self.schema_definition,
                "row_count": sample_cap,
                "feature_columns": feature_columns,
            }
        )

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        usage = getattr(response, "usage", None)
        prompt_tokens = getattr(usage, "prompt_tokens", 0)
        completion_tokens = getattr(usage, "completion_tokens", 0)
        total_tokens = prompt_tokens + completion_tokens
        estimated_cost = (total_tokens / 1_000_000) * 0.28

        content = response.choices[0].message.content or "{}"
        return _parse_json_object(content), estimated_cost

    def generate_data_batch(
        self,
        count: int = 1000,
        *,
        output_path: Path | None = None,
        seed: int = 42,
        notify: bool = True,
        spot_price_hr: float = 1.17,
    ) -> AlchemistResult:
        """Generate synthetic CSV via DeepSeek structured JSON + local materialization with FinOps cost gating."""
        # Enforce FinOps budgeting controls
        if spot_price_hr > 2.50:
            raise ValueError(
                f"FinOps Violation: Spot instance pricing of ${spot_price_hr:.2f}/hr exceeds budget threshold of $2.50/hr. Synthesis aborted."
            )

        path = output_path or DEFAULT_OUTPUT_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        feature_columns = self._feature_columns()
        reference_stats = self._reference_stats()

        governance_override: dict[str, Any] | None = None
        recipe: dict[str, dict[str, Any]]
        estimated_cost = 0.0

        if self.api_key:
            try:
                payload, estimated_cost = self._request_structured_batch(count)
                recipe = _normalize_recipe(
                    payload,
                    feature_columns,
                    reference_stats,
                    self.drifted_features,
                )
                seed_rows = _rows_to_dataframe(
                    payload.get("rows") if isinstance(payload.get("rows"), list) else [],
                    feature_columns,
                )
                governance_override = (
                    payload.get("governance") if isinstance(payload.get("governance"), dict) else None
                )
            except Exception:
                recipe = _fallback_recipe(feature_columns, reference_stats, self.drifted_features)
                seed_rows = pd.DataFrame(columns=feature_columns)
        else:
            recipe = _fallback_recipe(feature_columns, reference_stats, self.drifted_features)
            seed_rows = pd.DataFrame(columns=feature_columns)
            estimated_cost = 0.0

        if len(seed_rows) >= count:
            df = seed_rows.iloc[:count].reset_index(drop=True)
        elif len(seed_rows) > 0:
            extra = _materialize_recipe(recipe, feature_columns, count - len(seed_rows), seed=seed)
            df = pd.concat([seed_rows, extra], ignore_index=True)
        else:
            df = _materialize_recipe(recipe, feature_columns, count, seed=seed)

        diversity_score = compute_diversity_score(df, feature_columns)
        bias_check_result = compute_bias_check(
            df, feature_columns, drifted_features=self.drifted_features
        )

        if governance_override:
            diversity_score = float(
                governance_override.get("diversity_score", diversity_score)
            )
            bias_check_result = str(
                governance_override.get("bias_check_result", bias_check_result)
            )

        df.to_csv(path, index=False)
        if path != LEGACY_OUTPUT_PATH:
            df.to_csv(LEGACY_OUTPUT_PATH, index=False)

        result = AlchemistResult(
            path=path,
            signal=PipelineSignal.READY_FOR_RETRAINING,
            diversity_score=diversity_score,
            bias_check_result=bias_check_result,
            row_count=len(df),
            estimated_cost=estimated_cost,
        )

        if notify:
            notify_alchemist_action(
                diversity_score=result.diversity_score,
                bias_check_result=result.bias_check_result,
                drifted_features=self.drifted_features,
                row_count=result.row_count,
                batch_path=str(path),
                estimated_cost=result.estimated_cost,
            )

        return result

    def generate_balancing_data(
        self,
        report: DriftReport,
        *,
        n_rows: int = 5000,
        output_path: Path | None = None,
        seed: int = 42,
        spot_price_hr: float = 1.17,
    ) -> tuple[Path, PipelineSignal]:
        """Backward-compatible wrapper around ``generate_data_batch``."""
        alchemist = SyntheticAlchemist.from_drift_report(report, api_key=self.api_key, model=self.model)
        result = alchemist.generate_data_batch(
            count=n_rows,
            output_path=output_path,
            seed=seed,
            spot_price_hr=spot_price_hr,
        )
        return result.path, result.signal
