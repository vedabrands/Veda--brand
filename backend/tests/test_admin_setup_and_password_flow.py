"""
Iteration 5: Tests for fresh admin setup, idempotency lock, login, and forgot/reset password flow.
"""
import os
import time
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://plan-to-web-3.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@vedabrands.in"
ADMIN_PASSWORD = "Vedaadmin123!"
ADMIN_NAME = "Veda Admin"


@pytest.fixture(scope="module")
def mongo():
    client = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.environ.get("DB_NAME", "test_database")]
    yield db
    client.close()


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Setup status & admin creation ---

def test_01_setup_status_before_admin_is_false(session, mongo):
    # Defensive: ensure DB is clean
    mongo.users.delete_many({"email": ADMIN_EMAIL})
    mongo.password_resets.delete_many({})

    r = session.get(f"{API}/setup/status")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "admin_exists" in body
    # Pre-condition for this iteration: no admin
    assert body["admin_exists"] is False, f"Expected admin_exists False, got {body}"


def test_02_create_admin_via_setup(session):
    payload = {"name": ADMIN_NAME, "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    r = session.post(f"{API}/setup/admin", json=payload)
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert data.get("email") == ADMIN_EMAIL
    assert data.get("role") == "admin"
    assert "id" in data
    # Cookies should be set (httpOnly access_token/refresh_token)
    cookie_names = {c.name for c in session.cookies}
    assert "access_token" in cookie_names, f"access_token cookie missing; got {cookie_names}"


def test_03_setup_status_after_creation_is_true(session):
    # Use a fresh session so we look at server state, not cookies
    fresh = requests.Session()
    r = fresh.get(f"{API}/setup/status")
    assert r.status_code == 200
    assert r.json().get("admin_exists") is True


def test_04_setup_admin_second_call_returns_400(session):
    fresh = requests.Session()
    payload = {"name": "Hacker", "email": "hacker@evil.com", "password": "Hackpass1!"}
    r = fresh.post(f"{API}/setup/admin", json=payload)
    assert r.status_code == 400, f"Expected 400, got {r.status_code} {r.text}"
    detail = (r.json().get("detail") or "").lower()
    assert "already" in detail or "admin" in detail, r.text


def test_05_bcrypt_hash_in_db(mongo):
    user = mongo.users.find_one({"email": ADMIN_EMAIL})
    assert user is not None, "Admin not persisted"
    assert user.get("role") == "admin"
    pwd_hash = user.get("password") or user.get("password_hash") or user.get("hashed_password")
    assert pwd_hash, f"Password hash field missing in user doc keys={list(user.keys())}"
    assert pwd_hash.startswith("$2b$") or pwd_hash.startswith("$2a$"), f"Unexpected hash format: {pwd_hash[:6]}"


# --- Login + /me ---

def test_06_login_with_new_admin(session):
    fresh = requests.Session()
    fresh.headers.update({"Content-Type": "application/json"})
    r = fresh.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("email") == ADMIN_EMAIL
    assert data.get("role") == "admin"

    # /me on same session
    me = fresh.get(f"{API}/auth/me")
    assert me.status_code == 200, me.text
    assert me.json().get("email") == ADMIN_EMAIL
    assert me.json().get("role") == "admin"


# --- Forgot / Reset password ---

def test_07_forgot_password_creates_reset_row(mongo):
    fresh = requests.Session()
    fresh.headers.update({"Content-Type": "application/json"})
    # Clean slate
    mongo.password_resets.delete_many({})
    r = fresh.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL})
    assert r.status_code == 200, r.text

    # A row in password_resets with token+expires_at should exist
    rows = list(mongo.password_resets.find({}))
    assert len(rows) >= 1, "No password_resets row created"
    row = rows[-1]
    assert row.get("token"), "token missing"
    expires_at = row.get("expires_at")
    assert expires_at is not None, "expires_at missing"
    # Allow datetime or timestamp; if datetime, check ~1h ahead
    import datetime as dt
    if isinstance(expires_at, dt.datetime):
        delta = (expires_at - dt.datetime.utcnow()).total_seconds()
        assert 1800 < delta < 7200, f"expires_at not ~1h ahead: {delta}s"


def test_08_reset_password_and_relogin(mongo):
    fresh = requests.Session()
    fresh.headers.update({"Content-Type": "application/json"})
    row = mongo.password_resets.find_one(sort=[("expires_at", -1)])
    assert row and row.get("token"), "No reset token available"
    token = row["token"]
    new_password = "VedaNew456!"

    r = fresh.post(f"{API}/auth/reset-password", json={"token": token, "password": new_password})
    assert r.status_code == 200, r.text

    # Old password should fail
    r_old = fresh.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r_old.status_code in (400, 401, 403), f"Old password unexpectedly accepted: {r_old.status_code}"

    # New password should work
    fresh2 = requests.Session()
    fresh2.headers.update({"Content-Type": "application/json"})
    r_new = fresh2.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": new_password})
    assert r_new.status_code == 200, r_new.text
    assert r_new.json().get("role") == "admin"

    # Restore original password for cleanup so test_credentials.md stays valid
    # Trigger another forgot/reset back to ADMIN_PASSWORD
    f3 = requests.Session()
    f3.headers.update({"Content-Type": "application/json"})
    f3.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL})
    row2 = mongo.password_resets.find_one(sort=[("expires_at", -1)])
    assert row2 and row2.get("token")
    f3.post(f"{API}/auth/reset-password", json={"token": row2["token"], "password": ADMIN_PASSWORD})
    # Confirm restored
    confirm = requests.Session()
    confirm.headers.update({"Content-Type": "application/json"})
    rc = confirm.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert rc.status_code == 200, f"Failed to restore original password: {rc.text}"
