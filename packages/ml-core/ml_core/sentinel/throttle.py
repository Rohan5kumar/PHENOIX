import time
from typing import Dict, Any

class FinOpsThrottle:
    def __init__(self, max_usd_per_minute: float = 50.0):
        self.capacity = max_usd_per_minute
        self.tokens = max_usd_per_minute
        self.last_leak_time = time.time()
        # Cost mapping based on current server infrastructure costs
        self.leak_rate = max_usd_per_minute / 60.0 

    def allow_inference_compute(self, estimated_token_cost: float) -> Dict[str, Any]:
        """
        Implements a classic mathematical Token Bucket algorithm to protect enterprise wallet layers.
        """
        now = time.time()
        elapsed = now - self.last_leak_time
        self.last_leak_time = now
        
        # Replenish available budget tokens over time
        self.tokens = min(self.capacity, self.tokens + elapsed * self.leak_rate)
        
        if self.tokens >= estimated_token_cost:
            self.tokens -= estimated_token_cost
            return {
                "allowed": True, 
                "remaining_credit_window": round(self.tokens, 4),
                "action": "PROCEED_WITH_COMPUTE"
            }
        
        return {
            "allowed": False, 
            "remaining_credit_window": round(self.tokens, 4),
            "action": "TERMINATE_RUNAWAY_AGENT_LOOP",
            "alert_signature": "CRITICAL_FINOPS_LIMIT_BREACHED"
        }
