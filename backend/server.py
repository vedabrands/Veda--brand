from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import asyncio
import logging
import uuid
import secrets
import bcrypt
import jwt
import resend
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ---------------- Config ----------------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_NOTIFY_EMAIL = os.environ.get('ADMIN_NOTIFY_EMAIL', 'vedabrandssupport@gmail.com')
JWT_ALGORITHM = "HS256"

resend.api_key = RESEND_API_KEY

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(name)s %(levelname)s %(message)s')
logger = logging.getLogger("veda")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Veda Brands API")
api = APIRouter(prefix="/api")

# ---------------- Helpers ----------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    # SameSite=Lax works for same-origin deployments (frontend + backend on same domain via k8s ingress).
    # Secure=True is required on HTTPS production; harmless under HTTPS preview as well.
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="lax", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user

async def send_email_async(to: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY missing; skipping email")
        return
    try:
        params = {"from": f"Veda Brands <{SENDER_EMAIL}>", "to": [to], "subject": subject, "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error(f"Email send failed: {e}")

def email_shell(content_html: str) -> str:
    return f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#09090B;font-family:'Helvetica Neue',Arial,sans-serif;color:#ffffff">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090B;padding:40px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden">
      <tr><td style="padding:40px 40px 24px;text-align:center;background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(34,211,238,0.15))">
        <div style="font-size:28px;font-weight:700;letter-spacing:0.15em;color:#ffffff">VEDA BRANDS</div>
        <div style="font-size:11px;letter-spacing:0.3em;color:#22D3EE;margin-top:6px">BRANDING · STRATEGY · GROWTH</div>
      </td></tr>
      <tr><td style="padding:32px 40px;color:#E4E4E7;font-size:15px;line-height:1.7">{content_html}</td></tr>
      <tr><td style="padding:24px 40px 32px;border-top:1px solid rgba(255,255,255,0.08);color:#A1A1AA;font-size:13px">
        <div><strong style="color:#fff">Veda Brands</strong></div>
        <div>Faridabad, Haryana, India · 7:00 AM – 8:00 PM (Daily)</div>
        <div style="margin-top:6px">Phone / WhatsApp: +91 8368124957</div>
        <div>Email: vedabrandssupport@gmail.com</div>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>"""

# ---------------- Models ----------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class SetupAdminIn(BaseModel):
    email: EmailStr
    password: str
    name: str

class LeadIn(BaseModel):
    first_name: str
    email: EmailStr
    consent: bool = True
    source: Optional[str] = "popup"

class InquiryIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    service: Optional[str] = ""
    message: str
    consent: bool = True
    source: Optional[str] = "contact"

class StatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = ""

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    token: str
    password: str

class GenericDoc(BaseModel):
    model_config = ConfigDict(extra="allow")

# ---------------- Auth Endpoints ----------------
@api.get("/setup/status")
async def setup_status():
    exists = await db.users.find_one({"role": "admin"})
    return {"admin_exists": bool(exists)}

@api.post("/setup/admin")
async def setup_admin(body: SetupAdminIn, response: Response):
    if await db.users.find_one({"role": "admin"}):
        raise HTTPException(400, "Admin already exists")
    uid = str(uuid.uuid4())
    doc = {"id": uid, "email": body.email.lower(), "name": body.name,
           "password_hash": hash_password(body.password), "role": "admin", "created_at": now_iso()}
    await db.users.insert_one(doc)
    access = create_access_token(uid, body.email.lower(), "admin")
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": body.email.lower(), "name": body.name, "role": "admin"}

@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    doc = {"id": uid, "email": email, "name": body.name,
           "password_hash": hash_password(body.password), "role": "customer", "created_at": now_iso()}
    await db.users.insert_one(doc)
    access = create_access_token(uid, email, "customer")
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": body.name, "role": "customer"}

@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    access = create_access_token(user["id"], email, user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": email, "name": user["name"], "role": user["role"]}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordIn, request: Request):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    # Always succeed (don't leak whether the email exists)
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        await db.password_resets.insert_one({
            "token": token, "user_id": user["id"], "email": email,
            "expires_at": expires_at, "used": False, "created_at": now_iso(),
        })
        origin = request.headers.get("origin") or request.headers.get("referer", "").rstrip("/") or ""
        # Strip trailing path from referer if needed
        if origin and "://" in origin:
            origin = "/".join(origin.split("/", 3)[:3])
        reset_url = f"{origin}/admin/reset?token={token}" if origin else f"/admin/reset?token={token}"
        is_admin = user.get("role") == "admin"
        portal = "admin console" if is_admin else "account"
        html = email_shell(f"""
            <h2 style="margin:0 0 12px;color:#fff;font-weight:600">Reset your password</h2>
            <p>Hi {user.get('name','there').split(' ')[0]}, we received a request to reset the password for your Veda Brands {portal}.</p>
            <p style="margin:24px 0">
              <a href="{reset_url}" style="display:inline-block;padding:14px 28px;background:#ffffff;color:#09090B;border-radius:9999px;font-weight:600;text-decoration:none">Reset password →</a>
            </p>
            <p style="font-size:13px;color:#A1A1AA">Or paste this link into your browser:<br/><span style="color:#22D3EE;word-break:break-all">{reset_url}</span></p>
            <p style="font-size:13px;color:#A1A1AA">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>
        """)
        asyncio.create_task(send_email_async(email, "Reset your Veda Brands password", html))
    return {"ok": True}

@api.post("/auth/reset-password")
async def reset_password(body: ResetPasswordIn):
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    rec = await db.password_resets.find_one({"token": body.token})
    if not rec or rec.get("used"):
        raise HTTPException(400, "Invalid or expired reset link")
    try:
        exp = datetime.fromisoformat(rec["expires_at"])
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise HTTPException(400, "Reset link has expired. Please request a new one.")
    except (ValueError, KeyError):
        raise HTTPException(400, "Invalid reset link")
    user = await db.users.find_one({"id": rec["user_id"]})
    if not user:
        raise HTTPException(400, "User not found")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(body.password)}})
    await db.password_resets.update_one({"token": body.token}, {"$set": {"used": True, "used_at": now_iso()}})
    # Invalidate other unused tokens for this user
    await db.password_resets.update_many(
        {"user_id": user["id"], "used": False, "token": {"$ne": body.token}},
        {"$set": {"used": True, "used_at": now_iso()}},
    )
    return {"ok": True}

# ---------------- Public Content (read) ----------------
async def find_one_doc(collection: str, default: dict) -> dict:
    doc = await db[collection].find_one({"id": "singleton"}, {"_id": 0})
    return doc or default

async def upsert_doc(collection: str, data: dict) -> dict:
    data["id"] = "singleton"
    data["updated_at"] = now_iso()
    await db[collection].update_one({"id": "singleton"}, {"$set": data}, upsert=True)
    out = await db[collection].find_one({"id": "singleton"}, {"_id": 0})
    return out

DEFAULT_HOMEPAGE = {
    "id": "singleton",
    "hero_eyebrow": "Premium Branding & Marketing Agency",
    "hero_title": "We build brands that people remember.",
    "hero_subtitle": "Veda Brands crafts strategy, design and digital experiences for ambitious businesses ready to lead their category.",
    "hero_cta_primary": "Start Your Project",
    "hero_cta_secondary": "View Portfolio",
    "stats": [
        {"label": "Brands Built", "value": "120+"},
        {"label": "Projects Delivered", "value": "240+"},
        {"label": "Happy Clients", "value": "98%"},
        {"label": "Years Experience", "value": "8+"},
    ],
    "why_points": [
        {"title": "Strategy First", "description": "Every brand begins with insight, positioning and a clear point of view."},
        {"title": "Design That Sells", "description": "Beautiful is not enough. Our work converts attention into trust into revenue."},
        {"title": "Always-On Growth", "description": "From launch to scale, we partner long-term to compound your brand equity."},
        {"title": "Transparent Process", "description": "Clear timelines, weekly updates, no surprises. Premium without the mystery."},
    ],
    "process": [
        {"step": "01", "title": "Discovery", "description": "We immerse ourselves in your market, audience and ambition."},
        {"step": "02", "title": "Strategy", "description": "Positioning, messaging and a roadmap aligned to business goals."},
        {"step": "03", "title": "Design", "description": "Identity, web and assets engineered to feel inevitable."},
        {"step": "04", "title": "Execution", "description": "Launch campaigns, content engines and product surfaces."},
        {"step": "05", "title": "Growth", "description": "Measure, refine and compound — month after month."},
    ],
}

DEFAULT_ABOUT = {
    "id": "singleton",
    "title": "We build brands the world wants to believe in.",
    "subtitle": "An independent studio of strategists, designers and marketers based in Faridabad, working with founders across the world.",
    "story": "Veda Brands was founded on a simple belief: every business deserves a brand as ambitious as its founder. We exist to translate vision into identity, identity into experience, and experience into growth.",
    "mission": "To craft brands that move culture forward — beautifully, strategically, profitably.",
    "vision": "A world where every founder has access to agency-grade craft, without the agency-grade friction.",
    "values": [
        {"title": "Craft", "description": "We obsess over typography, motion, copy, code — the details that compound."},
        {"title": "Candor", "description": "We tell clients the truth, especially when it is inconvenient."},
        {"title": "Partnership", "description": "We do our best work when we feel part of your team."},
        {"title": "Outcomes", "description": "Beautiful work that does not move the business is decoration. We ship results."},
    ],
}

DEFAULT_CONTACT = {
    "id": "singleton",
    "phone": "+91 8368124957",
    "whatsapp": "+91 8368124957",
    "whatsapp_link": "https://wa.me/918368124957",
    "email": "vedabrandssupport@gmail.com",
    "instagram": "Coming Soon",
    "instagram_url": "",
    "linkedin": "Coming Soon",
    "linkedin_url": "",
    "address": "Faridabad, Haryana, India",
    "hours": "7:00 AM – 8:00 PM · Every day",
    "map_embed": "https://www.google.com/maps?q=Faridabad,Haryana,India&output=embed",
}

DEFAULT_SETTINGS = {
    "id": "singleton",
    "site_name": "Veda Brands",
    "tagline": "Branding · Strategy · Growth",
    "logo_url": "https://customer-assets.emergentagent.com/job_plan-to-web-3/artifacts/qbcwotqv_file_000000004c4c71faacfe1a270ae532d7.png",
    "favicon_url": "",
    "meta_title": "Veda Brands — Premium Branding & Marketing Agency",
    "meta_description": "Veda Brands helps ambitious businesses build unforgettable brands through strategy, design, marketing and digital experiences.",
    "social": {"instagram": "", "linkedin": "", "twitter": ""},
}

@api.get("/cms/homepage")
async def get_homepage():
    return await find_one_doc("homepage_content", DEFAULT_HOMEPAGE)

@api.get("/cms/about")
async def get_about():
    return await find_one_doc("about_content", DEFAULT_ABOUT)

@api.get("/cms/contact")
async def get_contact():
    return await find_one_doc("contact_settings", DEFAULT_CONTACT)

@api.get("/cms/settings")
async def get_settings():
    return await find_one_doc("website_settings", DEFAULT_SETTINGS)

# Collections (services, portfolio, testimonials, faq, team)
async def list_items(collection: str, only_published: bool = False) -> List[dict]:
    q = {"published": True} if only_published else {}
    items = await db[collection].find(q, {"_id": 0}).sort("order", 1).to_list(500)
    return items

@api.get("/cms/services")
async def list_services_public():
    return await list_items("services", only_published=True)

@api.get("/cms/services/{slug}")
async def get_service(slug: str):
    item = await db.services.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Service not found")
    return item

@api.get("/cms/portfolio")
async def list_portfolio_public():
    return await list_items("portfolio", only_published=True)

@api.get("/cms/portfolio/{slug}")
async def get_portfolio(slug: str):
    item = await db.portfolio.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Project not found")
    return item

@api.get("/cms/testimonials")
async def list_testimonials_public():
    return await list_items("testimonials", only_published=True)

@api.get("/cms/faq")
async def list_faq_public():
    return await list_items("faq", only_published=True)

@api.get("/cms/team")
async def list_team_public():
    return await list_items("team", only_published=True)

# ---------------- Inquiries & Leads ----------------
@api.post("/inquiries")
async def create_inquiry(body: InquiryIn):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "new"
    doc["notes"] = ""
    doc["created_at"] = now_iso()
    await db.inquiries.insert_one(doc)
    contact = await find_one_doc("contact_settings", DEFAULT_CONTACT)
    # Customer confirmation
    cust_html = email_shell(f"""
        <h2 style="margin:0 0 12px;color:#fff;font-weight:600">Thank you, {body.name.split(' ')[0]}.</h2>
        <p>We received your inquiry and our team will respond within one business day.</p>
        <div style="margin:20px 0;padding:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px">
          <div><strong style="color:#22D3EE">Service:</strong> {body.service or 'General Inquiry'}</div>
          <div style="margin-top:8px"><strong style="color:#22D3EE">Message:</strong> {body.message}</div>
        </div>
        <p>Prefer to chat now? WhatsApp us at <a href="{contact.get('whatsapp_link','')}" style="color:#22D3EE">+91 8368124957</a>.</p>
    """)
    asyncio.create_task(send_email_async(body.email, "We've received your inquiry — Veda Brands", cust_html))
    # Admin notify
    admin_html = email_shell(f"""
        <h2 style="margin:0 0 12px;color:#fff;font-weight:600">New Inquiry</h2>
        <p><strong>Name:</strong> {body.name}<br/>
        <strong>Email:</strong> {body.email}<br/>
        <strong>Phone:</strong> {body.phone or '-'}<br/>
        <strong>Service:</strong> {body.service or '-'}</p>
        <div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px">{body.message}</div>
    """)
    asyncio.create_task(send_email_async(ADMIN_NOTIFY_EMAIL, f"New Inquiry · {body.name}", admin_html))
    return {"ok": True, "id": doc["id"]}

@api.post("/leads")
async def create_lead(body: LeadIn):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "new"
    doc["created_at"] = now_iso()
    await db.leads.insert_one(doc)
    welcome = email_shell(f"""
        <h2 style="margin:0 0 12px;color:#fff;font-weight:600">Welcome to Veda Brands, {body.first_name}. 🚀</h2>
        <p>Thank you for connecting with us. We're excited to be part of your branding journey.</p>
        <p>Our mission is to help businesses build memorable brands through strategy, creativity, design and marketing.</p>
        <p>We'll occasionally share branding insights, useful resources and important updates.</p>
        <p style="margin-top:24px">If you're ready to discuss a project, we'd love to hear from you.</p>
        <p style="margin-top:24px;color:#A1A1AA">— Team Veda Brands</p>
    """)
    asyncio.create_task(send_email_async(body.email, "Welcome to Veda Brands 🚀", welcome))
    admin_html = email_shell(f"<h2>New Lead</h2><p><strong>{body.first_name}</strong> · {body.email}<br/>Source: {body.source}</p>")
    asyncio.create_task(send_email_async(ADMIN_NOTIFY_EMAIL, f"New Lead · {body.first_name}", admin_html))
    return {"ok": True}

# ---------------- Admin Endpoints (protected) ----------------
def _crud_router(collection: str, item_name: str):
    r = APIRouter()

    @r.get("")
    async def list_all(_: dict = Depends(require_admin)):
        return await db[collection].find({}, {"_id": 0}).sort("order", 1).to_list(1000)

    @r.post("")
    async def create_item(body: dict, _: dict = Depends(require_admin)):
        body["id"] = str(uuid.uuid4())
        body.setdefault("published", True)
        body.setdefault("order", 0)
        body["created_at"] = now_iso()
        body["updated_at"] = now_iso()
        await db[collection].insert_one(body)
        body.pop("_id", None)
        return body

    @r.put("/{item_id}")
    async def update_item(item_id: str, body: dict, _: dict = Depends(require_admin)):
        body.pop("id", None)
        body.pop("_id", None)
        body["updated_at"] = now_iso()
        res = await db[collection].update_one({"id": item_id}, {"$set": body})
        if res.matched_count == 0:
            raise HTTPException(404, f"{item_name} not found")
        out = await db[collection].find_one({"id": item_id}, {"_id": 0})
        return out

    @r.delete("/{item_id}")
    async def delete_item(item_id: str, _: dict = Depends(require_admin)):
        await db[collection].delete_one({"id": item_id})
        return {"ok": True}

    return r

api.include_router(_crud_router("services", "Service"), prefix="/admin/services")
api.include_router(_crud_router("portfolio", "Project"), prefix="/admin/portfolio")
api.include_router(_crud_router("testimonials", "Testimonial"), prefix="/admin/testimonials")
api.include_router(_crud_router("faq", "FAQ"), prefix="/admin/faq")
api.include_router(_crud_router("team", "Team Member"), prefix="/admin/team")

@api.put("/admin/homepage")
async def update_homepage(body: dict, _: dict = Depends(require_admin)):
    body.pop("_id", None)
    return await upsert_doc("homepage_content", body)

@api.put("/admin/about")
async def update_about(body: dict, _: dict = Depends(require_admin)):
    body.pop("_id", None)
    return await upsert_doc("about_content", body)

@api.put("/admin/contact")
async def update_contact(body: dict, _: dict = Depends(require_admin)):
    body.pop("_id", None)
    return await upsert_doc("contact_settings", body)

@api.put("/admin/settings")
async def update_settings(body: dict, _: dict = Depends(require_admin)):
    body.pop("_id", None)
    return await upsert_doc("website_settings", body)

@api.get("/admin/inquiries")
async def list_inquiries(_: dict = Depends(require_admin)):
    return await db.inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)

@api.put("/admin/inquiries/{iid}")
async def update_inquiry(iid: str, body: StatusUpdate, _: dict = Depends(require_admin)):
    await db.inquiries.update_one({"id": iid}, {"$set": {"status": body.status, "notes": body.notes}})
    return await db.inquiries.find_one({"id": iid}, {"_id": 0})

@api.delete("/admin/inquiries/{iid}")
async def delete_inquiry(iid: str, _: dict = Depends(require_admin)):
    await db.inquiries.delete_one({"id": iid})
    return {"ok": True}

@api.get("/admin/leads")
async def list_leads(_: dict = Depends(require_admin)):
    return await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)

@api.delete("/admin/leads/{lid}")
async def delete_lead(lid: str, _: dict = Depends(require_admin)):
    await db.leads.delete_one({"id": lid})
    return {"ok": True}

@api.get("/admin/overview")
async def admin_overview(_: dict = Depends(require_admin)):
    today = datetime.now(timezone.utc).date().isoformat()
    inquiries_total = await db.inquiries.count_documents({})
    inquiries_new = await db.inquiries.count_documents({"status": "new"})
    leads_total = await db.leads.count_documents({})
    leads_today = await db.leads.count_documents({"created_at": {"$gte": today}})
    services = await db.services.count_documents({})
    portfolio = await db.portfolio.count_documents({})
    return {
        "inquiries_total": inquiries_total,
        "inquiries_new": inquiries_new,
        "leads_total": leads_total,
        "leads_today": leads_today,
        "services": services,
        "portfolio": portfolio,
    }

# ---------------- App wiring ----------------
@app.get("/health")
async def health():
    """Kubernetes liveness/readiness probe endpoint (root-level, NOT /api/health)."""
    return {"status": "ok"}

@api.get("/")
async def root():
    return {"name": "Veda Brands API", "status": "ok"}

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.password_resets.create_index("token", unique=True)
    await db.password_resets.create_index("user_id")
    for col in ["services", "portfolio", "testimonials", "faq", "team"]:
        await db[col].create_index("id", unique=True)
    # --- Admin recovery via env var ---
    # If ADMIN_EMAIL is set, ensure that user is promoted to admin role on every boot.
    # Lets the owner regain admin access on production by setting one env var + redeploying.
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    if admin_email:
        existing = await db.users.find_one({"email": admin_email})
        if existing:
            if existing.get("role") != "admin":
                await db.users.update_one({"email": admin_email}, {"$set": {"role": "admin"}})
                logger.info(f"Promoted existing user {admin_email} to admin via ADMIN_EMAIL env")
            else:
                logger.info(f"ADMIN_EMAIL user {admin_email} already has admin role")
        else:
            logger.info(f"ADMIN_EMAIL {admin_email} not found in users; will be created when user first registers or uses /admin/setup")
    logger.info("Veda Brands API ready")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()
