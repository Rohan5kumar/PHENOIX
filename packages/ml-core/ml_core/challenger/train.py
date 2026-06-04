"""Challenger model training with Ray Train + PyTorch."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np

from ml_core.challenger.features import FEATURE_DIM


def build_model():
    import torch.nn as nn

    return nn.Sequential(
        nn.Linear(FEATURE_DIM, 32),
        nn.ReLU(),
        nn.Linear(32, 1),
        nn.Sigmoid(),
    )


def _train_loop(config: dict[str, Any]) -> dict[str, float]:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset

    epochs = int(config.get("epochs", 5))
    batch_size = int(config.get("batch_size", 64))
    lr = float(config.get("lr", 1e-3))

    x = np.load(config["x_path"]).astype(np.float32)
    y = np.load(config["y_path"]).astype(np.float32)

    dataset = TensorDataset(torch.from_numpy(x), torch.from_numpy(y))
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = build_model()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.BCELoss()

    model.train()
    last_loss = 0.0
    correct = 0
    total = 0

    for _ in range(epochs):
        for batch_x, batch_y in loader:
            optimizer.zero_grad()
            preds = model(batch_x).squeeze(1)
            loss = loss_fn(preds, batch_y)
            loss.backward()
            optimizer.step()
            last_loss = float(loss.item())
            predicted = (preds > 0.5).float()
            correct += int((predicted == batch_y).sum().item())
            total += batch_y.size(0)

    accuracy = correct / max(total, 1)
    
    # Simple F1-score calculation
    tp = int(((predicted == 1) & (batch_y == 1)).sum().item())
    fp = int(((predicted == 1) & (batch_y == 0)).sum().item())
    fn = int(((predicted == 0) & (batch_y == 1)).sum().item())
    precision = tp / max(tp + fp, 1e-6)
    recall = tp / max(tp + fn, 1e-6)
    f1 = 2 * (precision * recall) / max(precision + recall, 1e-6)

    metrics = {
        "accuracy": float(accuracy),
        "f1_score": float(f1),
        "loss": last_loss,
        "epochs": float(epochs)
    }

    model_out = config.get("model_out_path")
    if model_out:
        should_save = True
        try:
            from ray.train import get_context

            should_save = get_context().get_world_rank() == 0
        except (ImportError, RuntimeError):
            should_save = True
        if should_save:
            import torch

            torch.save(model.state_dict(), model_out)

    try:
        from ray.train import report

        report(metrics)
    except (ImportError, RuntimeError):
        return metrics
    return metrics


def train_on_arrays(
    x: np.ndarray,
    y: np.ndarray,
    *,
    epochs: int = 5,
    num_workers: int = 1,
    model_out_path: Path | None = None,
    smoke_test: bool = False,
) -> dict[str, float]:
    """Train on in-memory arrays; optionally persist state dict to ``model_out_path``."""
    import tempfile

    if smoke_test:
        num_workers = 1
        epochs = min(epochs, 2)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        x_path = tmp_path / "x.npy"
        y_path = tmp_path / "y.npy"
        np.save(x_path, x.astype(np.float32))
        np.save(y_path, y.astype(np.float32))

        out_str = str(model_out_path) if model_out_path else None
        config: dict[str, Any] = {
            "epochs": epochs,
            "batch_size": 64,
            "lr": 1e-3,
            "x_path": str(x_path),
            "y_path": str(y_path),
            "model_out_path": out_str,
        }

        if num_workers > 1:
            try:
                from ray.train import ScalingConfig
                from ray.train.torch import TorchTrainer

                trainer = TorchTrainer(
                    train_loop_per_worker=_train_loop,
                    train_loop_config=config,
                    scaling_config=ScalingConfig(num_workers=num_workers, use_gpu=False),
                )
                result = trainer.fit()
                metrics = result.metrics
                return {
                    "accuracy": float(metrics.get("accuracy", 0.0)),
                    "f1_score": float(metrics.get("f1_score", 0.0)),
                    "loss": float(metrics.get("loss", 0.0)),
                    "epochs": float(epochs),
                }
            except ImportError:
                pass

        return _train_loop(config)


def evaluate_checkpoint(
    model_path: Path,
    x: np.ndarray,
    y: np.ndarray,
) -> float:
    """Accuracy of a saved state dict on labeled feature rows."""
    import torch

    model = build_model()
    state = torch.load(model_path, map_location="cpu", weights_only=True)
    model.load_state_dict(state)
    model.eval()

    with torch.no_grad():
        preds = model(torch.from_numpy(x.astype(np.float32))).squeeze(1)
        predicted = (preds > 0.5).float()
        target = torch.from_numpy(y.astype(np.float32))
        
        tp = ((predicted == 1) & (target == 1)).sum().item()
        fp = ((predicted == 1) & (target == 0)).sum().item()
        fn = ((predicted == 0) & (target == 1)).sum().item()
        
        precision = tp / max(tp + fp, 1e-6)
        recall = tp / max(tp + fn, 1e-6)
        f1 = 2 * (precision * recall) / max(precision + recall, 1e-6)
        
    return float(f1)


def train_challenger(
    *,
    epochs: int = 5,
    num_workers: int = 2,
    smoke_test: bool = False,
) -> dict[str, float]:
    """Legacy entrypoint on 8-D synthetic data. Prefer ``train_with_gatekeeper``."""
    rng = np.random.default_rng(0)
    x = rng.normal(size=(2000, 8)).astype(np.float32)
    logits = x[:, 0] * 1.5 + x[:, 1] * 0.9 + rng.normal(0, 0.3, 2000)
    y = (logits > 0).astype(np.float32)
    return train_on_arrays(x, y, epochs=epochs, num_workers=num_workers, smoke_test=smoke_test)
