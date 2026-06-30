import React, { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const KEY = "veda_lead_popup_v1";

export default function LeadPopup() {
    const [show, setShow] = useState(false);
    const [first_name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [consent, setConsent] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (localStorage.getItem(KEY)) return;
        const t = setTimeout(() => {
            const scrollPct = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
            if (scrollPct > 0.35 || true) setShow(true);
        }, 22000);
        return () => clearTimeout(t);
    }, []);

    const close = () => {
        localStorage.setItem(KEY, "1");
        setShow(false);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!first_name || !email || !consent) return;
        setSubmitting(true);
        try {
            await api.post("/leads", { first_name, email, consent, source: "popup" });
            toast.success("You're in. Watch your inbox.");
            localStorage.setItem(KEY, "1");
            setShow(false);
        } catch (e) {
            toast.error("Couldn't subscribe. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div data-testid="lead-popup" className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-6 md:pb-0">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
            <div className="relative w-full max-w-md glass-strong rounded-3xl p-8 shadow-2xl">
                <button data-testid="lead-popup-close" onClick={close} className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60">
                    <X className="w-4 h-4" />
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-veda-cyan/10 text-veda-cyan text-xs tracking-[0.2em] uppercase mb-4">
                    <Sparkles className="w-3.5 h-3.5" /> Insider Notes
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-semibold leading-tight mb-2">Stay close to the studio.</h3>
                <p className="text-white/60 text-sm mb-6">Occasional notes on brand, design and growth — written for founders who lead with taste.</p>
                <form onSubmit={submit} className="space-y-3">
                    <input data-testid="lead-name" value={first_name} onChange={e => setName(e.target.value)} placeholder="First name" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50 text-white placeholder:text-white/30" required />
                    <input data-testid="lead-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@brand.com" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50 text-white placeholder:text-white/30" required />
                    <label className="flex items-start gap-2 text-xs text-white/50">
                        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" data-testid="lead-consent" />
                        <span>I agree to receive emails from Veda Brands. Unsubscribe any time.</span>
                    </label>
                    <button data-testid="lead-submit" disabled={submitting} className="btn-primary w-full justify-center">
                        {submitting ? "Sending…" : "Stay Connected"}
                    </button>
                </form>
            </div>
        </div>
    );
}
