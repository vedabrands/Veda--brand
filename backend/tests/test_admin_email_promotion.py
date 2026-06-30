"""Backend tests for the ADMIN_EMAIL auto-promote feature + regression coverage.

Covers:
 - Login with promoted user returns role=admin
 - Admin endpoint accessible after promotion
 - Existing flows still pass (health, setup/status, cms reads, inquiries, logout)
 - Full forgot/reset recovery flow ends with admin role
 - Startup branch logs are asserted by reading the backend log file (controlled via test_startup_branches.py separately)
"""
import os
import re
import time
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
ADMIN_EMAIL = "vedabrandssupport@gmail.com"
ADMIN_PASSWORD = "CustomerPass123!"
BACKEND_LOG = "/var/log/supervisor/backend.err.log"


@pytest.fixture
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- 1. Existing flows ----------
class TestExistingFlows:
    def test_health(self, session):
        r = session.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_setup_status(self, session):
        r = session.get(f"{BASE_URL}/api/setup/status")
        assert r.status_code == 200
        body = r.json()
        assert "admin_exists" in body
        assert body["admin_exists"] is True  # because vedabrandssupport was promoted

    def test_cms_reads(self, session):
        for path in ["/api/cms/homepage", "/api/cms/about", "/api/cms/contact",
                     "/api/cms/settings", "/api/cms/services", "/api/cms/portfolio",
                     "/api/cms/testimonials", "/api/cms/faq", "/api/cms/team"]:
            r = session.get(f"{BASE_URL}{path}")
            assert r.status_code == 200, f"{path} -> {r.status_code}"

    def test_create_inquiry(self, session):
        payload = {
            "name": "TEST_AutoPromote QA",
            "email": "test_autopromote@example.com",
            "phone": "+910000000000",
            "service": "Branding",
            "message": "TEST inquiry from admin-email-promotion test",
            "consent": True,
            "source": "test",
        }
        r = session.post(f"{BASE_URL}/api/inquiries", json=payload)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True
        assert "id" in body

    def test_logout_clears_cookies(self, session):
        # login first
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        # logout
        r = session.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code == 200
        assert r.json().get("ok") is True
        # me should now 401
        r = session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


# ---------- 2. Promoted-user login ----------
class TestPromotedAdminLogin:
    def test_login_returns_admin_role(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["email"] == ADMIN_EMAIL
        assert body["role"] == "admin", (
            f"Expected role='admin' after ADMIN_EMAIL promotion, got {body!r}"
        )
        # access_token cookie should be set
        assert "access_token" in session.cookies

    def test_admin_overview_accessible(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        r = session.get(f"{BASE_URL}/api/admin/overview")
        assert r.status_code == 200, r.text
        body = r.json()
        for k in ["inquiries_total", "inquiries_new", "leads_total",
                  "leads_today", "services", "portfolio"]:
            assert k in body

    def test_me_returns_admin(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        r = session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == ADMIN_EMAIL
        assert body["role"] == "admin"


# ---------- 3. Full recovery scenario ----------
class TestRecoveryFlow:
    """Full end-to-end: forgot -> reset -> login -> admin overview."""

    def test_full_recovery_pipeline(self, session):
        # 1. forgot-password -> always 200
        r = session.post(f"{BASE_URL}/api/auth/forgot-password",
                         json={"email": ADMIN_EMAIL})
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # 2. Grab token directly from DB (we can't read email)
        import pymongo
        mongo_url = "mongodb://localhost:27017"
        db_name = "test_database"
        cli = pymongo.MongoClient(mongo_url)
        db = cli[db_name]
        rec = db.password_resets.find_one(
            {"email": ADMIN_EMAIL, "used": False},
            sort=[("created_at", -1)],
        )
        assert rec is not None, "No active reset token found in DB"
        token = rec["token"]

        # 3. reset-password with a new password
        new_pw = "NewAdminPass456!"
        r = session.post(f"{BASE_URL}/api/auth/reset-password",
                         json={"token": token, "password": new_pw})
        assert r.status_code == 200, r.text

        # 4. login with new password -> role admin
        s2 = requests.Session()
        s2.headers.update({"Content-Type": "application/json"})
        r = s2.post(f"{BASE_URL}/api/auth/login",
                    json={"email": ADMIN_EMAIL, "password": new_pw})
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "admin"

        # 5. admin overview reachable
        r = s2.get(f"{BASE_URL}/api/admin/overview")
        assert r.status_code == 200

        # 6. Restore original password so other tests / users still work
        r = s2.post(f"{BASE_URL}/api/auth/forgot-password",
                    json={"email": ADMIN_EMAIL})
        assert r.status_code == 200
        rec2 = db.password_resets.find_one(
            {"email": ADMIN_EMAIL, "used": False},
            sort=[("created_at", -1)],
        )
        r = s2.post(f"{BASE_URL}/api/auth/reset-password",
                    json={"token": rec2["token"], "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        cli.close()


# ---------- 4. Startup branch verification via logs ----------
def _tail_log_after(marker_ts: float) -> str:
    """Return log content after marker_ts (epoch seconds)."""
    with open(BACKEND_LOG, "r") as f:
        return f.read()


class TestStartupBranches:
    """These tests restart the backend with different ADMIN_EMAIL values
    and assert the correct startup log line appears. Cleanly restores .env at the end.
    """

    ENV_PATH = "/app/backend/.env"

    def _read_env(self):
        with open(self.ENV_PATH, "r") as f:
            return f.read()

    def _write_env(self, content):
        with open(self.ENV_PATH, "w") as f:
            f.write(content)

    def _set_admin_email(self, value):
        original = self._read_env()
        if re.search(r"^ADMIN_EMAIL=.*$", original, flags=re.MULTILINE):
            new = re.sub(r"^ADMIN_EMAIL=.*$",
                         f'ADMIN_EMAIL="{value}"', original, flags=re.MULTILINE)
        else:
            new = original.rstrip() + f'\nADMIN_EMAIL="{value}"\n'
        self._write_env(new)

    def _restart_and_capture(self, timeout=20):
        os.system("sudo supervisorctl restart backend >/dev/null 2>&1")
        # Wait until log has a new "Veda Brands API ready" line
        start = time.time()
        last_ready_count = 0
        while time.time() - start < timeout:
            with open(BACKEND_LOG, "r") as f:
                content = f.read()
            ready_count = content.count("Veda Brands API ready")
            if last_ready_count == 0:
                last_ready_count = ready_count
            time.sleep(0.5)
            with open(BACKEND_LOG, "r") as f:
                content = f.read()
            new_ready = content.count("Veda Brands API ready")
            if new_ready > last_ready_count:
                # Wait briefly to ensure full startup block flushed
                time.sleep(1.0)
                with open(BACKEND_LOG, "r") as f:
                    return f.read()
        with open(BACKEND_LOG, "r") as f:
            return f.read()

    @pytest.fixture(autouse=True)
    def _restore_env(self):
        original = self._read_env()
        yield
        self._write_env(original)
        os.system("sudo supervisorctl restart backend >/dev/null 2>&1")
        # Wait for backend to be up before next test class
        for _ in range(30):
            try:
                if requests.get(f"{BASE_URL}/api/", timeout=2).status_code == 200:
                    break
            except Exception:
                pass
            time.sleep(0.5)

    def _last_block(self, content):
        """Return the part of log after the second-to-last 'Veda Brands API ready'."""
        idxs = [m.start() for m in re.finditer(r"Veda Brands API ready", content)]
        if len(idxs) < 2:
            return content
        return content[idxs[-2]:]

    def test_already_admin_branch(self):
        # current state: user is already admin (from previous promotion)
        self._set_admin_email(ADMIN_EMAIL)
        content = self._restart_and_capture()
        last = self._last_block(content)
        assert "already has admin role" in last, (
            f"Expected 'already has admin role' log; got tail:\n{last[-2000:]}"
        )

    def test_user_not_found_branch(self):
        self._set_admin_email("nonexistent_user_xyz@example.com")
        content = self._restart_and_capture()
        last = self._last_block(content)
        assert "not found in users" in last, (
            f"Expected 'not found in users' log; got tail:\n{last[-2000:]}"
        )
        # Backend should still be up
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200

    def test_empty_admin_email_branch(self):
        # Set to empty string
        self._set_admin_email("")
        content = self._restart_and_capture()
        last = self._last_block(content)
        assert "Promoted existing user" not in last
        assert "already has admin role" not in last
        assert "not found in users" not in last
        # No crash
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200

    def test_promotion_branch(self):
        """Demote the admin to customer, then restart to verify the promote path logs."""
        import pymongo
        cli = pymongo.MongoClient("mongodb://localhost:27017")
        db = cli["test_database"]
        # Demote
        db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"role": "customer"}})
        cli.close()

        self._set_admin_email(ADMIN_EMAIL)
        content = self._restart_and_capture()
        last = self._last_block(content)
        assert "Promoted existing user vedabrandssupport@gmail.com to admin via ADMIN_EMAIL env" in last, (
            f"Expected promotion log; got tail:\n{last[-2000:]}"
        )
        # Verify DB role updated
        cli = pymongo.MongoClient("mongodb://localhost:27017")
        db = cli["test_database"]
        u = db.users.find_one({"email": ADMIN_EMAIL})
        assert u["role"] == "admin"
        cli.close()
