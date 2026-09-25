from datetime import timedelta

import pytest
from fastapi import HTTPException

from src.services.auth_service import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hashing_produces_argon2_hash():
    """Unit Test 1: Verify argon2 password hashing produces unique salted hash."""
    raw_password = "SecurePassword123!"
    hash1 = hash_password(raw_password)
    hash2 = hash_password(raw_password)

    # Hashes must not equal plain password
    assert hash1 != raw_password
    assert hash2 != raw_password
    # Hashes must be unique due to random salt
    assert hash1 != hash2
    assert hash1.startswith("$argon2")



def test_password_verification_success_and_failure():
    """Unit Test 2: Verify password check returns True for match and False for mismatch."""
    raw_password = "MySecretPass_456"
    hashed = hash_password(raw_password)

    # Correct password succeeds
    assert verify_password(raw_password, hashed) is True

    # Incorrect password fails
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


def test_create_and_decode_jwt_token_success():
    """Unit Test 3: Verify JWT creation encodes payload and decodes properly."""
    payload_data = {
        "sub": "42",
        "username": "coder_bob",
        "role": "admin",
    }
    token = create_access_token(data=payload_data, expires_delta=timedelta(minutes=30))
    decoded = decode_access_token(token)

    assert decoded["sub"] == "42"
    assert decoded["username"] == "coder_bob"
    assert decoded["role"] == "admin"
    assert "exp" in decoded
    assert "iat" in decoded


def test_jwt_expired_token_raises_401():
    """Unit Test 4: Verify expired JWT token raises 401 Unauthorized exception."""
    payload_data = {"sub": "10", "username": "expired_user"}
    # Create token that expired 5 minutes ago
    expired_token = create_access_token(
        data=payload_data,
        expires_delta=timedelta(minutes=-5),
    )

    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(expired_token)

    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


def test_jwt_tampered_or_invalid_token_raises_401():
    """Unit Test 5: Verify invalid/tampered token raises 401 Unauthorized exception."""
    invalid_token = (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature"
    )

    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(invalid_token)

    assert exc_info.value.status_code == 401
    assert "invalid" in exc_info.value.detail.lower()
