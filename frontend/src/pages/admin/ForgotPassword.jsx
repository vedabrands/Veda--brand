import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail) || "Couldn't send reset email.");
        } finally { setBusy(false); }
    };

    return (
        <div className="min-h-screen bg-veda-bg flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-veda-violet/20 blur-[140px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-veda-cyan/15 blur-[140px]" />
            <div className="relative glass-strong rounded-[32px] p-10 w-full max-w-md">
                <Link to="/admin/login" className="text-xs uppercase tracking-[0.25em] text-veda-cyan">← Back to login</Link>
                <h1 className="font-display text-3xl font-semibold mt-3 mb-1">Forgot password?</h1>
                <p className="text-white/55 text-sm mb-6">Enter your account email and we'll send a reset link.</p>
                {sent ? (
                    <div className="space-y-4">
                        <div className="glass rounded-2xl p-5 text-sm text-white/80">
                            If an account exists for <span className="text-veda-cyan font-medium">{email}</span>, a reset link is on its way. Check your inbox (and spam folder). The link expires in 1 hour.
                        </div>
                        <Link to="/admin/login" className="btn-secondary w-full justify-center">Return to login</Link>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-3">
                        <input data-testid="forgot-email" type="email" required placeholder="Account email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50" />
                        <button data-testid="forgot-submit" disabled={busy} className="btn-primary w-full justify-center">{busy ? "Sending…" : "Send reset link"}</button>
                    </form>
                )}
            </div>
        </div>
    );
}
