from ml_core.sentinel import HealthPipeline, InferenceStream


def test_inference_stream_accumulates_window():
    stream = InferenceStream(window_size=50, batch_size=10, reference_size=100)
    for _ in range(5):
        stream.ingest_batch()
    assert len(stream.current_window) == 50


def test_health_pipeline_returns_accuracy_and_drift_keys():
    pipeline = HealthPipeline(seed=0)
    for _ in range(15):
        result = pipeline.step()
    assert "accuracy" in result
    assert "drift_detected" in result
    assert "drifted_features" in result
    assert 0.0 <= float(result["accuracy"]) <= 1.0
