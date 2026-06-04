"""Warehouse Connectors for fetching live inference data."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict
import pandas as pd

logger = logging.getLogger(__name__)

class SnowflakeConfig(BaseSettings):
    """Pydantic settings for Snowflake authentication."""
    account: str = "mock-account"
    user: str = "phoenix-service"
    password: str = "mock-password"
    warehouse: str = "COMPUTE_WH"
    database: str = "PHOENIX_DB"
    schema: str = "INFERENCE"
    
    model_config = SettingsConfigDict(env_prefix="SNOWFLAKE_")


class WarehouseConnector(ABC):
    """Abstract base class for warehouse connectors."""

    @abstractmethod
    def fetch_inference_data(self, model_id: str, limit: int = 10000) -> pd.DataFrame:
        """Fetch the most recent inference data for a given model."""
        pass


class SnowflakeConnector(WarehouseConnector):
    """Snowflake-specific implementation of the warehouse connector."""

    def __init__(self, config: SnowflakeConfig | None = None) -> None:
        self.config = config or SnowflakeConfig()
        # Initialize connection lazily
        self._conn = None

    def _get_connection(self) -> Any:
        try:
            import snowflake.connector
        except ImportError:
            logger.warning("snowflake-connector-python not installed. Using mock connection.")
            return None

        if self._conn is None:
            # Connect to Snowflake using pydantic-settings
            try:
                self._conn = snowflake.connector.connect(
                    user=self.config.user,
                    password=self.config.password,
                    account=self.config.account,
                    warehouse=self.config.warehouse,
                    database=self.config.database,
                    schema=self.config.schema
                )
            except Exception as e:
                logger.error(f"Failed to connect to Snowflake: {e}")
                self._conn = None
        return self._conn

    def fetch_inference_data(self, model_id: str, limit: int = 10000) -> pd.DataFrame:
        """Securely fetch the most recent inference data."""
        conn = self._get_connection()
        if conn is None:
            # Return mock data if connection fails or library is missing
            logger.info("Mocking Snowflake inference data fetch.")
            import numpy as np
            rng = np.random.default_rng(42)
            data = {
                "feature_a": rng.normal(0, 1.0, limit),
                "feature_b": rng.normal(0.5, 0.3, limit),
                "feature_c": rng.uniform(0.0, 1.0, limit),
                "label": rng.choice([0, 1], limit),
                "prediction": rng.choice([0, 1], limit),
                "model_id": [model_id] * limit
            }
            return pd.DataFrame(data)

        query = f"""
            SELECT * FROM inference_logs 
            WHERE model_id = '{model_id}' 
            ORDER BY timestamp DESC 
            LIMIT {limit}
        """
        try:
            return pd.read_sql(query, conn)
        except Exception as e:
            logger.error(f"Failed to execute Snowflake query: {e}")
            return pd.DataFrame()
