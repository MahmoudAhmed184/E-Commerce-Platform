from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
from pathlib import Path

from config.logging import JsonFormatter


SERVER_DIR = Path(__file__).resolve().parents[2]


def test_json_formatter_emits_structured_log() -> None:
    record = logging.LogRecord(
        name="apps.orders",
        level=logging.INFO,
        pathname=__file__,
        lineno=12,
        msg="checkout summary loaded",
        args=(),
        exc_info=None,
    )

    payload = json.loads(JsonFormatter().format(record))

    assert payload["level"] == "INFO"
    assert payload["logger"] == "apps.orders"
    assert payload["message"] == "checkout summary loaded"
    assert "timestamp" in payload


def test_production_logging_configures_json_console_and_admin_alerts() -> None:
    env = {
        **os.environ,
        "DJANGO_SECRET_KEY": "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6",
        "DJANGO_ALLOWED_HOSTS": "example.com",
        "PAYMENT_WEBHOOK_SECRET": "WebhookCheckValueA1b2C3d4E5f6G7h8I9j0K1l2",
        "DJANGO_ADMINS": "Ops:ops@example.com",
    }

    result = subprocess.run(
        [
            sys.executable,
            "-c",
            (
                "import json;"
                "from config.settings import production;"
                "print(json.dumps({"
                "'formatter': production.LOGGING['handlers']['console']['formatter'],"
                "'request_handlers': production.LOGGING['loggers']['django.request']['handlers'],"
                "'admins': production.ADMINS"
                "}))"
            ),
        ],
        cwd=SERVER_DIR,
        env=env,
        capture_output=True,
        check=True,
        text=True,
    )

    payload = json.loads(result.stdout)

    assert payload["formatter"] == "json"
    assert payload["request_handlers"] == ["console", "mail_admins"]
    assert payload["admins"] == [["Ops", "ops@example.com"]]
