"""Synthetic data generation (DeepSeek-V3 recipe + local materialization)."""

from ml_core.alchemist.generator import (
    AlchemistResult,
    SyntheticAlchemist,
    generate_synthetic_batch,
)
from ml_core.pipeline_signals import PipelineSignal

__all__ = [
    "AlchemistResult",
    "PipelineSignal",
    "SyntheticAlchemist",
    "generate_synthetic_batch",
]
