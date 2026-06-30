import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function AdminLogin() {
    const nav = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [busy, setBusy] = useState(false);
    const [needsSetup, setNeedsSetup] = useState(false);

    useEffect(() => {
        api.get("/setup/status").then(r => { if (!r.data.admin_exists) setNeedsSetup(true); });
        api.get("/auth/me").then(r => { if (r.data?.role === "admin") nav("/admin"); }).catch(() => {});
    }, [nav]);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.post("/auth/login", form);
            if (data.role !== "admin") {
                toast.error("This account is not an admin.");
                await api.post("/auth/logout").catch(() => {});
                return;
            }
            window.location.href = "/admin";
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail));
        } finally { setBusy(false); }
    };

    return (
        <div className="min-h-screen bg-veda-bg flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-veda-violet/20 blur-[140px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-veda-cyan/15 blur-[140px]" />
            <div className="relative glass-strong rounded-[32px] p-10 w-full max-w-md">
                <Link to="/" className="text-xs uppercase tracking-[0.25em] text-veda-cyan">← Veda Brands</Link>
                <h1 className="font-display text-3xl font-semibold mt-3 mb-1">Admin Console</h1>
                <p className="text-white/55 text-sm mb-6">Secure access for the studio team.</p>
                {needsSetup ? (
                    <div className="space-y-3">
                        <p className="text-white/70 text-sm">No admin found. Set up the first administrator account.</p>
                        <Link to="/admin/setup" className="btn-primary w-full justify-center">Set up admin →</Link>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-3">
                        <input data-testid="admin-email" type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50" />
                        <input data-testid="admin-password" type="password" placeholder="Password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50" />
                        <button data-testid="admin-submit" disabled={busy} className="btn-primary w-full justify-center">{busy ? "Authenticating…" : "Login"}</button>
                        <div className="text-center pt-1">
                            <Link to="/admin/forgot" data-testid="admin-forgot-link" className="text-xs text-white/50 hover:text-veda-cyan">Forgot password?</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
