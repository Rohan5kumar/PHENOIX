from routes.deployment import router as deployment_router
from routes.governance import router as governance_router
from routes.health import router as health_router
from routes.stats import router as stats_router

__all__ = ["deployment_router", "governance_router", "health_router", "stats_router"]
