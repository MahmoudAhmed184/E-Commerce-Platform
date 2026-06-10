from __future__ import annotations

from typing import Any, NoReturn, cast

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .jwt_cookies import clear_auth_cookies, set_auth_cookies
from .models import CustomUser
from .permissions import IsActiveAccount, enforce_active_account
from .selectors import get_current_user_data
from .serializers import (
    ConfirmEmailSerializer,
    CurrentUserSerializer,
    LoginSerializer,
    RegisterSerializer,
    UpdateCurrentUserSerializer,
)
from .services import (
    AuthBlockedError,
    authenticate_user,
    blacklist_refresh_token,
    confirm_email,
    create_user,
    issue_auth_tokens,
    update_user_profile,
)


def _raise_serializer_error(error: DjangoValidationError) -> NoReturn:
    if hasattr(error, "message_dict"):
        raise serializers.ValidationError(error.message_dict)
    raise serializers.ValidationError(error.messages)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            create_user(**serializer.validated_data)
        except DjangoValidationError as exc:
            _raise_serializer_error(exc)

        return Response({"message": "Confirmation email sent."}, status=status.HTTP_201_CREATED)


class ConfirmEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = ConfirmEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            confirm_email(serializer.validated_data["token"])
        except DjangoValidationError as exc:
            _raise_serializer_error(exc)

        return Response({"message": "Email confirmed."}, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = authenticate_user(**serializer.validated_data)
        except DjangoValidationError as exc:
            _raise_serializer_error(exc)
        except AuthBlockedError as exc:
            return Response(
                {
                    "detail": exc.detail,
                    "code": exc.code,
                    "account_status": exc.account_status,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = issue_auth_tokens(user)
        response = Response({"user": CurrentUserSerializer(user).data}, status=status.HTTP_200_OK)
        set_auth_cookies(response, access=tokens["access"], refresh=tokens["refresh"])
        return response


class CookieTokenRefreshView(TokenRefreshView):
    serializer_class = TokenRefreshSerializer

    def post(self, request: Request, *args: object, **kwargs: object) -> Response:
        refresh_cookie = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
        if not refresh_cookie:
            raise InvalidToken(
                {
                    "detail": "No valid session refresh cookie was provided.",
                    "code": "token_not_valid",
                },
            )

        try:
            refresh = RefreshToken(cast(Any, refresh_cookie))
        except TokenError as exc:
            raise InvalidToken(exc.args[0]) from exc

        user_id = refresh.get(api_settings.USER_ID_CLAIM)
        if user_id is None:
            raise InvalidToken({"detail": "Token contained no recognizable user identification."})

        try:
            token_user = CustomUser.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except CustomUser.DoesNotExist as exc:
            raise InvalidToken({"detail": "User not found.", "code": "user_not_found"}) from exc

        enforce_active_account(token_user)

        serializer = self.get_serializer(data={"refresh": refresh_cookie})

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(exc.args[0]) from exc

        response = Response({"message": "Session refreshed."}, status=status.HTTP_200_OK)
        set_auth_cookies(
            response,
            access=serializer.validated_data["access"],
            refresh=serializer.validated_data.get("refresh"),
        )
        return response


class LogoutView(APIView):
    authentication_classes: list[type] = []
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        response = Response({"message": "Logged out."}, status=status.HTTP_200_OK)
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)

        if refresh_token:
            try:
                blacklist_refresh_token(str(refresh_token))
            except DjangoValidationError:
                pass

        clear_auth_cookies(response)
        return response


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated, IsActiveAccount]

    def get(self, request: Request) -> Response:
        user = cast(CustomUser, request.user)
        return Response(get_current_user_data(user), status=status.HTTP_200_OK)

    def patch(self, request: Request) -> Response:
        user = cast(CustomUser, request.user)
        serializer = UpdateCurrentUserSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            update_user_profile(user, **serializer.validated_data)
        except DjangoValidationError as exc:
            _raise_serializer_error(exc)

        return Response(get_current_user_data(user), status=status.HTTP_200_OK)
