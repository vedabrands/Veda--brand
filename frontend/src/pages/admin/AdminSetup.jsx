import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import PasswordInput from "@/components/site/PasswordInput";

export default function AdminSetup() {
    const nav = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [busy, setBusy] = useState(false);
    const [allowed, setAllowed] = useState(null);

    useEffect(() => {
        api.get("/setup/status").then(r => setAllowed(!r.data.admin_exists));
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post("/setup/admin", form);
            toast.success("Admin created. Welcome to the console.");
            window.location.href = "/admin";
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail));
        } finally { setBusy(false); }
    };

    if (allowed === null) return <div className="pt-48 text-center text-white/40 min-h-screen bg-veda-bg">Loading…</div>;
    if (!allowed) return <div className="min-h-screen bg-veda-bg flex items-center justify-center text-center p-6"><div><p className="text-white/70">Admin already exists. Use the login page.</p><Link to="/admin/login" className="btn-primary mt-6 inline-flex">Go to login</Link></div></div>;

    return (
        <div className="min-h-screen bg-veda-bg flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-veda-violet/20 blur-[140px]" />
            <div className="relative glass-strong rounded-[32px] p-10 w-full max-w-md">
                <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan">First-time setup</div>
                <h1 className="font-display text-3xl font-semibold mt-3 mb-1">Create admin account</h1>
                <p className="text-white/55 text-sm mb-6">This screen disables itself after the first admin is created.</p>
                <form onSubmit={submit} className="space-y-3">
                    <input placeholder="Full name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10" data-testid="setup-name" />
                    <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10" data-testid="setup-email" />
                    <PasswordInput testid="setup-password" placeholder="Password (min 8 chars)" minLength={8} required value={form.password} onChange={v => setForm({ ...form, password: v })} />
                    <button disabled={busy} className="btn-primary w-full justify-center" data-testid="setup-submit">{busy ? "Creating…" : "Create admin"}</button>
                </form>
            </div>
        </div>
    );
}
