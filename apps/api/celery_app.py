import asyncio
import os
from celery import Celery

# Configure Celery
# We use Redis as the broker and backend
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "project_phoenix_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="tasks.run_training")
def run_training_task(epochs: int, num_workers: int):
    """
    Background Celery task to run Challenger Retraining.
    """
    from ml_core.challenger.trainer import metrics_summary, train_with_gatekeeper

    path, signal, result = train_with_gatekeeper(
        None,
        epochs=epochs,
        num_workers=num_workers,
        smoke_test=False,
    )
    summary = metrics_summary(result)
    if signal is not None:
        summary["signal"] = signal.value
    if path is not None:
        summary["model_path"] = str(path)
    return summary
