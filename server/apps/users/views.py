from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ConfirmEmailSerializer, RegisterSerializer
from .services import confirm_email, create_user


def _raise_serializer_error(error: DjangoValidationError) -> None:
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
