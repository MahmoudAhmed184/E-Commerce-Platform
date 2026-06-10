from __future__ import annotations

from typing import NoReturn, cast

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomUser
from .selectors import get_current_user_data
from .serializers import (
    ChangePasswordSerializer,
    ConfirmEmailSerializer,
    CurrentUserSerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UpdateCurrentUserSerializer,
)
from .services import (
    AuthBlockedError,
    authenticate_user,
    blacklist_refresh_token,
    change_password,
    confirm_email,
    create_user,
    issue_auth_tokens,
    request_password_reset,
    reset_password,
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


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_password_reset(serializer.validated_data["email"])

        return Response(
            {"message": "If an account exists for this email, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reset_password(
                uid=serializer.validated_data["uid"],
                token=serializer.validated_data["token"],
                new_password=serializer.validated_data["new_password"],
            )
        except DjangoValidationError as exc:
            _raise_serializer_error(exc)

        return Response({"message": "Password has been reset."}, status=status.HTTP_200_OK)


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
        return Response(
            {
                **tokens,
                "user": CurrentUserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            blacklist_refresh_token(serializer.validated_data["refresh"])
        except DjangoValidationError as exc:
            _raise_serializer_error(exc)

        return Response({"message": "Logged out."}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

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


class CurrentUserPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        user = cast(CustomUser, request.user)
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            change_password(
                user=user,
                current_password=serializer.validated_data["current_password"],
                new_password=serializer.validated_data["new_password"],
            )
        except DjangoValidationError as exc:
            _raise_serializer_error(exc)

        return Response({"message": "Password has been changed."}, status=status.HTTP_200_OK)
