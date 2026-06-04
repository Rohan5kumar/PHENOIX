"""AI Auditor for Governance Checks using a reasoning LLM."""

from __future__ import annotations

import json
import os
from enum import Enum
from typing import Any

try:
    from openai import OpenAI as _OpenAI
except ImportError:
    _OpenAI = None  # type: ignore[misc, assignment]


class GovernanceStatus(Enum):
    PASS = "GOVERNANCE_PASS"
    FAIL = "GOVERNANCE_FAIL"


class AIAuditor:
    """Uses a reasoning-heavy LLM to verify model healing safety and quality."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else os.environ.get("DEEPSEEK_API_KEY")
        # For auditing/reasoning, deepseek-v4-pro works well. Can be overridden for explicit reasoning models.
        self.model = model or os.environ.get("DEEPSEEK_AUDITOR_MODEL", "deepseek-v4-pro")
        self.base_url = base_url or os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    def evaluate(
        self,
        training_report: dict[str, Any],
        synthetic_data_sample: list[dict[str, Any]],
        company_policy: str = "Models must show F1 improvement and synthetic data must not introduce new bias.",
    ) -> GovernanceStatus:
        """
        Evaluate the Challenger model's training report and synthetic data.
        Returns GOVERNANCE_PASS or GOVERNANCE_FAIL.
        """
        if _OpenAI is None:
            raise RuntimeError("openai required; install ml-core[alchemist]")

        client = _OpenAI(api_key=self.api_key, base_url=self.base_url)

        system_prompt = (
            "You are the AI Auditor for Project Phoenix.\n"
            "Your job is to review the Challenger model's training report and a sample of the synthetic data used for healing.\n"
            "You must answer three questions:\n"
            "1. Is the new model actually better? (Look at F1 scores, baseline vs challenger)\n"
            "2. Is there any hidden bias in the synthetic data? (Look at the data sample provided)\n"
            "3. Does the healing process follow our company's safety policy?\n\n"
            "You must return ONLY a JSON object with the following structure:\n"
            "{\n"
            '  "reasoning": "your detailed step-by-step reasoning here",\n'
            '  "status": "GOVERNANCE_PASS" or "GOVERNANCE_FAIL"\n'
            "}"
        )

        user_content = json.dumps(
            {
                "training_report": training_report,
                "synthetic_data_sample": synthetic_data_sample,
                "company_policy": company_policy,
            },
            indent=2,
        )

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,  # Low temperature for highly deterministic auditing
            )

            content = response.choices[0].message.content or "{}"
            result = json.loads(content)
            
            status_str = result.get("status", "GOVERNANCE_FAIL")
            if status_str == "GOVERNANCE_PASS":
                return GovernanceStatus.PASS
            else:
                return GovernanceStatus.FAIL

        except Exception as e:
            print(f"AI Auditor encountered an error: {e}")
            return GovernanceStatus.FAIL
