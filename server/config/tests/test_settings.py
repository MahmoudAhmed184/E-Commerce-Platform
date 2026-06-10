from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


SERVER_DIR = Path(__file__).resolve().parents[2]


def test_csrf_trusted_origins_are_loaded_from_environment() -> None:
    env = {
        **os.environ,
        "CSRF_TRUSTED_ORIGINS": "https://shop.example.com, https://admin.example.com ,",
    }

    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "from config.settings import base; print('\\n'.join(base.CSRF_TRUSTED_ORIGINS))",
        ],
        cwd=SERVER_DIR,
        env=env,
        capture_output=True,
        check=True,
        text=True,
    )

    assert result.stdout.splitlines() == [
        "https://shop.example.com",
        "https://admin.example.com",
    ]
