"""
PDF Report Route
─────────────────
GET /reports/model-history/{model_id}
  → Downloads a full Model History PDF report.
"""

from __future__ import annotations

import io
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from routes.governance import _alchemist_log, _pipeline_state
from services.pdf_report import generate_model_history_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get(
    "/model-history/{model_id}",
    summary="Download Model History PDF Report",
    response_description="PDF file with Bias Check, Accuracy Gains, and Financial Impact",
)
async def download_model_history_report(model_id: str) -> StreamingResponse:
    """
    Generate and stream a PDF report for the given model_id.
    Pulls live data from the in-memory Alchemist log and pipeline state.
    """
    log_list = list(_alchemist_log)
    pdf_bytes = generate_model_history_pdf(
        model_id=model_id,
        alchemist_log=log_list,
        pipeline_state=_pipeline_state,
    )

    filename = f"phoenix_{model_id}_history_{__import__('datetime').datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
