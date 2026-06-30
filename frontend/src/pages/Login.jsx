import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError, api } from "@/lib/api";
import { toast } from "sonner";
import GradientBg from "@/components/site/GradientBg";
import PasswordInput from "@/components/site/PasswordInput";

export default function Login() {
    const { login } = useAuth();
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [busy, setBusy] = useState(false);
    const nav = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (mode === "login") {
                await login(form.email, form.password);
                toast.success("Welcome back.");
            } else {
                await api.post("/auth/register", form);
                toast.success("Account created.");
            }
            nav("/");
        } catch (err) {
            toast.error(formatApiError(err.response?.data?.detail) || "Failed");
        } finally { setBusy(false); }
    };

    return (
        <div className="relative min-h-[80vh] pt-40 pb-24">
            <GradientBg />
            <div className="mx-auto max-w-md px-6">
                <div className="glass-strong rounded-[32px] p-8 md:p-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-2">Customer Portal</div>
                    <h1 className="font-display text-3xl font-semibold mb-2">{mode === "login" ? "Welcome back." : "Create account."}</h1>
                    <p className="text-white/55 text-sm mb-6">{mode === "login" ? "Log in to your Veda Brands account." : "Get notified about your project."}</p>
                    <form onSubmit={submit} className="space-y-3">
                        {mode === "register" && (
                            <input data-testid="login-name" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50" />
                        )}
                        <input data-testid="login-email" type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50" />
                        <PasswordInput testid="login-password" placeholder="Password" required value={form.password} onChange={v => setForm({ ...form, password: v })} />
                        <button data-testid="login-submit" disabled={busy} className="btn-primary w-full justify-center">{busy ? "Working…" : mode === "login" ? "Login" : "Create account"}</button>
                    </form>
                    <div className="mt-5 text-sm text-white/50 text-center">
                        {mode === "login" ? "New to Veda Brands?" : "Already have an account?"}
                        <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="ml-2 text-veda-cyan hover:underline">{mode === "login" ? "Create one" : "Login"}</button>
                    </div>
                    <div className="mt-3 text-center"><Link to="/admin/login" className="text-xs text-white/40 hover:text-white/70">Admin login →</Link></div>
                </div>
            </div>
        </div>
    );
}
