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
from .serializers import ConfirmEmailSerializer, CurrentUserSerializer, LoginSerializer, LogoutSerializer, RegisterSerializer
from .services import AuthBlockedError, authenticate_user, blacklist_refresh_token, confirm_email, create_user, issue_auth_tokens


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
