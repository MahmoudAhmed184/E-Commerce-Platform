from io import StringIO

from django.core.management import call_command


def test_check_auth_security_prints_active_settings() -> None:
    output = StringIO()

    call_command("check_auth_security", stdout=output)

    value = output.getvalue()
    assert "Auth security checklist" in value
    assert "CORS_ALLOWED_ORIGINS" in value
    assert "ACCESS_TOKEN_LIFETIME" in value
    assert "DEFAULT_THROTTLE_RATES" in value
