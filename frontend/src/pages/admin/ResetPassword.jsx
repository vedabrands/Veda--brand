import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import PasswordInput from "@/components/site/PasswordInput";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const nav = useNavigate();
    const token = params.get("token") || "";
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
        if (pw !== pw2) return toast.error("Passwords do not match.");
        setBusy(true);
        try {
            await api.post("/auth/reset-password", { token, password: pw });
            setDone(true);
            setTimeout(() => nav("/admin/login"), 1800);
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail) || "Reset failed.");
        } finally { setBusy(false); }
    };

    return (
        <div className="min-h-screen bg-veda-bg flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-veda-violet/20 blur-[140px]" />
            <div className="relative glass-strong rounded-[32px] p-10 w-full max-w-md">
                <Link to="/admin/login" className="text-xs uppercase tracking-[0.25em] text-veda-cyan">← Back to login</Link>
                <h1 className="font-display text-3xl font-semibold mt-3 mb-1">Set new password</h1>
                <p className="text-white/55 text-sm mb-6">Choose a strong password (minimum 8 characters).</p>
                {!token ? (
                    <div className="glass rounded-2xl p-5 text-sm text-white/70">This reset link is invalid. <Link to="/admin/forgot" className="text-veda-cyan">Request a new one</Link>.</div>
                ) : done ? (
                    <div className="glass rounded-2xl p-5 text-sm text-emerald-300">Password updated. Redirecting to login…</div>
                ) : (
                    <form onSubmit={submit} className="space-y-3">
                        <PasswordInput testid="reset-password" placeholder="New password" required minLength={8} value={pw} onChange={setPw} />
                        <PasswordInput testid="reset-confirm" placeholder="Confirm new password" required minLength={8} value={pw2} onChange={setPw2} />
                        <button data-testid="reset-submit" disabled={busy} className="btn-primary w-full justify-center">{busy ? "Updating…" : "Update password"}</button>
                    </form>
                )}
            </div>
        </div>
    );
}
