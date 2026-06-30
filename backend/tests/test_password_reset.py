"""
Backend tests for the Forgot Password / Reset Password flow.

Covers:
 - POST /api/auth/forgot-password (existing + non-existing email, no enumeration)
 - DB row created in `password_resets` with correct shape
 - POST /api/auth/reset-password (invalid token, short password, valid token)
 - Token marked used after successful reset
 - Other unused tokens for the same user are invalidated
 - Expired token returns 400
 - Login works with new password / fails with old
 - Existing flows: GET /health, GET /api/setup/status, GET /api/auth/me

Uses direct MongoDB inspection (pymongo) to read tokens since Resend emails
are sandboxed and not deliverable to arbitrary test addresses.

NOTE: Tests MUTATE the admin's password. At the end of the suite the password
is restored to the value documented in /app/memory/test_credentials.md so the
admin remains in a known state.
"""
import os
import time
from datetime import datetime, timezone, timedelta

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

ADMIN_EMAIL = "owner@vedabrands.com"
ORIGINAL_PASSWORD = "OwnerPass123!"

# Local-only health probe (k8s ingress only routes /api/*)
LOCAL_BACKEND = "http://localhost:8001"


@pytest.fixture(scope="module")
def mongo_db():
    cli = MongoClient(MONGO_URL)
    db = cli[DB_NAME]
    yield db
    cli.close()


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    yield s
    s.close()


def _ensure_admin(session):
    st = session.get(f"{BASE_URL}/api/setup/status", timeout=15)
    assert st.status_code == 200
    if not st.json().get("admin_exists"):
        r = session.post(
            f"{BASE_URL}/api/setup/admin",
            json={"email": ADMIN_EMAIL, "password": ORIGINAL_PASSWORD, "name": "Owner"},
            timeout=15,
        )
        assert r.status_code in (200, 201), r.text


def _login(session, email, password):
    return session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=15,
    )


# ---------------- Existing flow sanity ----------------
class TestExistingFlowsStillWork:
    def test_root_health(self):
        r = requests.get(f"{LOCAL_BACKEND}/health", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_setup_status(self, session):
        r = session.get(f"{BASE_URL}/api/setup/status", timeout=15)
        assert r.status_code == 200
        assert "admin_exists" in r.json()

    def test_login_with_current_password_and_me(self, session):
        _ensure_admin(session)
        s = requests.Session()
        r = _login(s, ADMIN_EMAIL, ORIGINAL_PASSWORD)
        assert r.status_code == 200, r.text
        me = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert me.status_code == 200
        assert me.json().get("email") == ADMIN_EMAIL
        assert me.json().get("role") == "admin"


# ---------------- Forgot password ----------------
class TestForgotPassword:
    def test_non_existing_email_returns_ok_no_row(self, session, mongo_db):
        bogus = "TEST_does-not-exist-xyz@example.com"
        before = mongo_db.password_resets.count_documents({"email": bogus})
        r = session.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": bogus},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json() == {"ok": True}
        after = mongo_db.password_resets.count_documents({"email": bogus})
        assert after == before, "No reset row should be created for non-existing email"

    def test_existing_email_creates_reset_row(self, session, mongo_db):
        _ensure_admin(session)
        # Clean any prior tokens to make assertion deterministic
        mongo_db.password_resets.delete_many({"email": ADMIN_EMAIL})
        r = session.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": ADMIN_EMAIL},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json() == {"ok": True}

        # The endpoint creates the row synchronously and only the email is async,
        # so the row should exist right away. Tiny sleep just in case.
        time.sleep(0.2)
        rows = list(mongo_db.password_resets.find({"email": ADMIN_EMAIL}))
        assert len(rows) == 1, f"expected exactly 1 row, got {len(rows)}"
        row = rows[0]
        assert isinstance(row.get("token"), str) and len(row["token"]) >= 32
        # url-safe charset
        assert all(c.isalnum() or c in "-_" for c in row["token"]), row["token"]
        assert row.get("used") is False
        assert row.get("user_id")
        user = mongo_db.users.find_one({"email": ADMIN_EMAIL})
        assert user is not None and row["user_id"] == user["id"]
        # expires_at ~1h in the future
        exp = datetime.fromisoformat(row["expires_at"])
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        delta = exp - datetime.now(timezone.utc)
        assert timedelta(minutes=50) < delta < timedelta(minutes=70), f"expires_at not ~1h: {delta}"


# ---------------- Reset password ----------------
class TestResetPassword:
    def test_invalid_token_returns_400(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "totally-not-a-real-token-xxxxxxxxxxxxxxxxxxxxx", "password": "NewPass123!"},
            timeout=15,
        )
        assert r.status_code == 400, r.text
        detail = (r.json().get("detail") or "").lower()
        assert "invalid" in detail or "expired" in detail, detail

    def test_short_password_returns_400(self, session, mongo_db):
        # Need a valid token to ensure we're hitting the password-length branch
        _ensure_admin(session)
        mongo_db.password_resets.delete_many({"email": ADMIN_EMAIL})
        r = session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=15)
        assert r.status_code == 200
        token = mongo_db.password_resets.find_one({"email": ADMIN_EMAIL})["token"]
        r = session.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": token, "password": "short"},
            timeout=15,
        )
        assert r.status_code == 400, r.text
        detail = (r.json().get("detail") or "").lower()
        assert "8" in detail or "characters" in detail, detail

    def test_expired_token_returns_400(self, session, mongo_db):
        _ensure_admin(session)
        mongo_db.password_resets.delete_many({"email": ADMIN_EMAIL})
        r = session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=15)
        assert r.status_code == 200
        row = mongo_db.password_resets.find_one({"email": ADMIN_EMAIL})
        token = row["token"]
        past = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        mongo_db.password_resets.update_one({"token": token}, {"$set": {"expires_at": past}})
        r = session.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": token, "password": "ValidPass123!"},
            timeout=15,
        )
        assert r.status_code == 400, r.text
        detail = (r.json().get("detail") or "").lower()
        assert "expired" in detail, f"expected 'expired' in detail, got {detail}"

    def test_full_reset_flow_and_invalidations(self, session, mongo_db):
        """Valid token resets password; old password fails; new password works;
        same token cannot be reused; other unused tokens for user are invalidated."""
        _ensure_admin(session)
        mongo_db.password_resets.delete_many({"email": ADMIN_EMAIL})

        # Create TWO outstanding tokens
        r1 = session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=15)
        assert r1.status_code == 200
        r2 = session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=15)
        assert r2.status_code == 200

        rows = list(mongo_db.password_resets.find({"email": ADMIN_EMAIL}).sort("created_at", 1))
        assert len(rows) == 2, f"expected 2 reset rows, got {len(rows)}"
        token_a, token_b = rows[0]["token"], rows[1]["token"]

        new_password = "BrandNewPass456!"
        # Use token_a to reset
        r = session.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": token_a, "password": new_password},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json() == {"ok": True}

        # token_a marked used
        ra = mongo_db.password_resets.find_one({"token": token_a})
        assert ra["used"] is True
        # token_b also invalidated (used=true)
        rb = mongo_db.password_resets.find_one({"token": token_b})
        assert rb["used"] is True, "Other unused tokens for the same user must be invalidated"

        # Reusing token_a -> 400
        r = session.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": token_a, "password": "AnotherPass789!"},
            timeout=15,
        )
        assert r.status_code == 400, r.text

        # Reusing token_b -> 400 too
        r = session.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": token_b, "password": "AnotherPass789!"},
            timeout=15,
        )
        assert r.status_code == 400, r.text

        # Old password must fail
        s_old = requests.Session()
        r = _login(s_old, ADMIN_EMAIL, ORIGINAL_PASSWORD)
        assert r.status_code == 401, f"old password should be rejected, got {r.status_code}"

        # New password works
        s_new = requests.Session()
        r = _login(s_new, ADMIN_EMAIL, new_password)
        assert r.status_code == 200, r.text
        me = s_new.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert me.status_code == 200
        assert me.json().get("email") == ADMIN_EMAIL

        # ---- Restore admin to ORIGINAL_PASSWORD so credentials file stays accurate ----
        mongo_db.password_resets.delete_many({"email": ADMIN_EMAIL})
        rr = session.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=15)
        assert rr.status_code == 200
        restore_token = mongo_db.password_resets.find_one({"email": ADMIN_EMAIL})["token"]
        rr = session.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": restore_token, "password": ORIGINAL_PASSWORD},
            timeout=15,
        )
        assert rr.status_code == 200, rr.text
        # Verify restoration
        s_chk = requests.Session()
        chk = _login(s_chk, ADMIN_EMAIL, ORIGINAL_PASSWORD)
        assert chk.status_code == 200, f"restore failed: {chk.status_code} {chk.text[:200]}"
        # Cleanup any reset rows left behind
        mongo_db.password_resets.delete_many({"email": ADMIN_EMAIL})
