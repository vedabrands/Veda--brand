"""
Backend tests for the two bug fixes in this iteration:
 1) Root-level GET /health endpoint (for k8s probes, NOT under /api)
 2) Auth cookie persistence: SameSite=Lax (not None) so cookies survive
    the immediate next request (login -> me, login -> admin/overview).
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://plan-to-web-3.preview.emergentagent.com").rstrip("/")

ADMIN_EMAIL = "owner@vedabrands.com"
ADMIN_PASSWORD = "OwnerPass123!"


# ---------- Module 1: Health endpoint ----------
# NOTE: Kubernetes liveness/readiness probes hit the backend pod directly
# at http://localhost:8001/health (not via the public ingress). The public
# ingress only routes /api/* to the backend; everything else goes to the
# React frontend served by Express. So we verify the probe URL the way k8s
# would actually call it.
LOCAL_BACKEND = "http://localhost:8001"


class TestHealthEndpoint:
    def test_root_health_returns_200_ok_on_backend_pod(self):
        # This is what k8s probes hit — the bug fix point.
        r = requests.get(f"{LOCAL_BACKEND}/health", timeout=10)
        assert r.status_code == 200, f"expected 200 got {r.status_code} body={r.text[:200]}"
        assert "application/json" in r.headers.get("content-type", "")
        data = r.json()
        assert data.get("status") == "ok", f"unexpected body: {data}"

    def test_api_root_still_works(self):
        r = requests.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert "Veda Brands" in data.get("name", "")

    def test_api_health_not_required(self):
        # Just confirming /api/health is not expected (k8s uses root /health).
        # We tolerate either 404 or 200 — only documenting behavior.
        r = requests.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code in (200, 404)


# ---------- Module 2: Auth cookie persistence ----------
def _ensure_admin(session: requests.Session) -> dict:
    """Ensure admin exists; create one via /api/setup/admin if not. Returns login info."""
    s = session.get(f"{BASE_URL}/api/setup/status", timeout=15)
    assert s.status_code == 200, f"setup/status failed: {s.status_code}"
    if not s.json().get("admin_exists", False):
        r = session.post(
            f"{BASE_URL}/api/setup/admin",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "name": "Owner"},
            timeout=15,
        )
        assert r.status_code in (200, 201), f"setup/admin failed: {r.status_code} {r.text[:200]}"
    return {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}


@pytest.fixture
def fresh_session():
    s = requests.Session()
    yield s
    s.close()


class TestAuthCookiePersistence:
    def test_setup_status_returns_200(self, fresh_session):
        r = fresh_session.get(f"{BASE_URL}/api/setup/status", timeout=15)
        assert r.status_code == 200
        assert "admin_exists" in r.json()

    def test_login_sets_samesite_lax_cookies(self, fresh_session):
        _ensure_admin(fresh_session)
        # fresh jar to inspect Set-Cookie cleanly
        s = requests.Session()
        r = s.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
        # Inspect raw Set-Cookie headers — but filter to only the APP cookies
        # (Cloudflare may inject its own __cf_bm cookie with SameSite=None
        # which is unrelated to our bug fix).
        raw_headers = r.raw.headers.getlist("Set-Cookie") if hasattr(r.raw.headers, "getlist") else [r.headers.get("Set-Cookie", "")]
        app_cookie_headers = [h for h in raw_headers if h.startswith("access_token=") or h.startswith("refresh_token=")]
        assert len(app_cookie_headers) >= 2, f"expected at least 2 app cookies, got: {raw_headers}"
        # Cookies present in jar
        cookie_names = {c.name for c in s.cookies}
        assert "access_token" in cookie_names, f"access_token cookie missing; got {cookie_names}"
        assert "refresh_token" in cookie_names, f"refresh_token cookie missing; got {cookie_names}"
        # Validate flags on EACH app cookie individually
        for hdr in app_cookie_headers:
            low = hdr.lower()
            assert "samesite=none" not in low, f"SameSite=None still on app cookie (bug not fixed): {hdr}"
            assert "samesite=lax" in low, f"Expected SameSite=Lax on app cookie, got: {hdr}"
            assert "secure" in low, f"Secure flag missing: {hdr}"
            assert "httponly" in low, f"HttpOnly flag missing: {hdr}"

    def test_login_then_me_persists_cookies(self, fresh_session):
        """THE CORE BUG: login 200 then /me must return 200 (NOT 401)."""
        _ensure_admin(fresh_session)
        s = requests.Session()
        login = s.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert login.status_code == 200, f"login failed: {login.status_code} {login.text[:200]}"
        # Immediate next call using same cookie jar
        me = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert me.status_code == 200, (
            f"BUG: /api/auth/me returned {me.status_code} immediately after successful login. "
            f"Cookies in jar: {[c.name for c in s.cookies]}. body={me.text[:200]}"
        )
        data = me.json()
        assert data.get("email") == ADMIN_EMAIL
        assert data.get("role") == "admin"

    def test_login_then_admin_overview(self, fresh_session):
        _ensure_admin(fresh_session)
        s = requests.Session()
        login = s.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert login.status_code == 200
        ov = s.get(f"{BASE_URL}/api/admin/overview", timeout=15)
        assert ov.status_code == 200, f"admin/overview failed with same session: {ov.status_code} {ov.text[:200]}"
        body = ov.json()
        # Should be a dict of counts
        assert isinstance(body, dict)
        # At least one expected key should be present
        expected_any = {"inquiries_total", "leads_total", "services", "portfolio"}
        assert expected_any.intersection(body.keys()), f"unexpected overview body: {body}"

    def test_logout_clears_cookies_and_me_returns_401(self, fresh_session):
        _ensure_admin(fresh_session)
        s = requests.Session()
        login = s.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert login.status_code == 200
        # Sanity: /me works before logout
        me1 = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert me1.status_code == 200
        # Logout
        lo = s.post(f"{BASE_URL}/api/auth/logout", timeout=15)
        assert lo.status_code in (200, 204), f"logout failed: {lo.status_code} {lo.text[:200]}"
        # After logout, /me should be 401
        me2 = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert me2.status_code == 401, f"expected 401 after logout, got {me2.status_code} body={me2.text[:200]}"
