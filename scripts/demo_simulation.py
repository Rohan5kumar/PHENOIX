"""
Project Phoenix Demo Simulation Speed Run.

Automates the 3-minute lifecycle:
0s: Green status.
30s: Inject 20% drift into the Snowflake mock data.
60s: Dashboard turns Red, Alchemist generates data.
90s: Challenger Lab starts training.
150s: System heals, Dashboard turns Green, and a 'Compliance PDF' is generated.
"""

import asyncio
import httpx
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
API_URL = "http://127.0.0.1:8000"


async def main():
    logging.info("🚀 Starting Phoenix Lifecycle Speed Run (3 minutes)...")
    
    async with httpx.AsyncClient() as client:
        # T=0: Green Status
        logging.info("[T=0s] Setting system to Green / Healthy status.")
        await client.post(
            f"{API_URL}/governance/pipeline-event", 
            json={"signal": "HEALTHY", "baseline_f1": 0.95, "challenger_f1": None}
        )
        
        # T=30s: Inject Drift
        logging.info("[T=30s] Waiting to inject drift...")
        await asyncio.sleep(30)
        logging.info("🚨 Injecting 20% drift into Snowflake mock data stream.")
        # We simulate this by posting a drift event to the pipeline status
        await client.post(
            f"{API_URL}/governance/pipeline-event", 
            json={"signal": "DRIFT_DETECTED", "baseline_f1": 0.88, "challenger_f1": None}
        )
        
        # T=60s: Alchemist triggers
        logging.info("[T=60s] Waiting for Alchemist...")
        await asyncio.sleep(30)
        logging.info("🔮 Alchemist generating synthetic data...")
        await client.post(
            f"{API_URL}/governance/alchemist-actions",
            json={
                "diversity_score": 0.92,
                "bias_check_result": "PASS",
                "drifted_features": ["feature_a"],
                "row_count": 5000,
                "estimated_cost": 0.35,
                "batch_path": "data/patches/demo.csv"
            }
        )
        
        # T=90s: Challenger Lab starts training
        logging.info("[T=90s] Waiting for Challenger Lab...")
        await asyncio.sleep(30)
        logging.info("🔬 Challenger Lab starting Ray Train job...")
        await client.post(
            f"{API_URL}/governance/pipeline-event", 
            json={"signal": "TRAINING", "baseline_f1": 0.88, "challenger_f1": None}
        )
        
        # T=120s: Training finishes
        logging.info("[T=120s] Training...")
        await asyncio.sleep(30)
        logging.info("✅ Training complete. Challenger F1: 0.97")
        await client.post(
            f"{API_URL}/governance/pipeline-event", 
            json={"signal": "READY_FOR_RETRAINING", "baseline_f1": 0.88, "challenger_f1": 0.97}
        )
        
        # T=150s: Promotion and Compliance
        logging.info("[T=150s] System healing and generating PDF...")
        await asyncio.sleep(30)
        # Assuming Istio promotion hits here
        logging.info("🛡️ Istio Canary Promotion Successful. System Green.")
        await client.post(
            f"{API_URL}/governance/pipeline-event", 
            json={"signal": "HEALTHY", "baseline_f1": 0.97, "challenger_f1": None}
        )
        
        # Trigger PDF generation
        logging.info("📄 Requesting Compliance Audit PDF...")
        try:
            r = await client.get(f"{API_URL}/governance/export-audit?model_id=phoenix-demo-run")
            if r.status_code == 200:
                with open("data/exports/phoenix-demo-run_audit_trail.pdf", "wb") as f:
                    f.write(r.content)
                logging.info("✅ PDF Generated successfully at data/exports/phoenix-demo-run_audit_trail.pdf")
            else:
                logging.error(f"Failed to generate PDF. Status: {r.status_code}")
        except Exception as e:
            logging.error(f"Failed to request PDF: {e}")

    logging.info("🏁 Speed Run Complete!")

if __name__ == "__main__":
    asyncio.run(main())
