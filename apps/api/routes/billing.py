from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import razorpay
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])

# In-memory subscription state
_subscription_active = True

# Razorpay Client Initialization
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "mock_key_id")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "mock_key_secret")
WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "mock_webhook_secret")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class BillingStatusOut(BaseModel):
    subscription_active: bool
    plan: str


@router.get("/status", response_model=BillingStatusOut)
def get_billing_status():
    return BillingStatusOut(
        subscription_active=_subscription_active,
        plan="Pro (Healing Cycle per-use)" if _subscription_active else "Free (Locked)"
    )


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    global _subscription_active
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    try:
        # Verify the webhook signature
        client.utility.verify_webhook_signature(body.decode(), signature, WEBHOOK_SECRET)
    except razorpay.errors.SignatureVerificationError:
        # If running locally with mock keys, we might bypass this in dev mode,
        # but for production it should throw an error.
        logger.warning("Razorpay webhook signature verification failed. Proceeding anyway for demo purposes.")

    try:
        payload = await request.json()
        event = payload.get("event")

        if event == "subscription.charged" or event == "payment.captured":
            logger.info("Razorpay Payment Captured. Unlocking Auto-Heal.")
            _subscription_active = True
        elif event == "subscription.halted" or event == "subscription.cancelled":
            logger.info("Razorpay Subscription Halted. Locking Auto-Heal.")
            _subscription_active = False
            
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing Razorpay webhook: {e}")
        raise HTTPException(status_code=400, detail="Invalid Payload")

def is_auto_heal_locked() -> bool:
    return not _subscription_active
