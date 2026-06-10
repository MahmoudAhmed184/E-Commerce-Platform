from __future__ import annotations

from django.apps import apps


def test_admin_api_app_config_is_registered() -> None:
    app_config = apps.get_app_config("admin_api")

    assert app_config.name == "apps.admin_api"
