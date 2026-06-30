import React, { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import GradientBg from "@/components/site/GradientBg";
import { Send } from "lucide-react";

const SERVICES = ["Brand Identity", "Brand Strategy", "Website Design", "Website Development", "Digital Marketing", "Social Media", "Performance Marketing", "Packaging Design", "Other"];

export default function Contact() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "", consent: true });
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message || !form.consent) return toast.error("Please complete required fields.");
        setBusy(true);
        try {
            await api.post("/inquiries", form);
            toast.success("Inquiry sent. We'll respond within one business day.");
            setForm({ name: "", email: "", phone: "", service: "", message: "", consent: true });
        } catch (e) {
            toast.error("Couldn't send. Please try again or WhatsApp us.");
        } finally { setBusy(false); }
    };

    return (
        <div data-testid="contact-page">
            <section className="relative pt-40 pb-16 md:pt-48">
                <GradientBg />
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">Contact</div>
                    <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] max-w-4xl">Let's talk about <span className="text-gradient-cv">your brand.</span></h1>
                    <p className="mt-6 text-lg text-white/60 max-w-2xl">Share a few details — we'll respond within one business day with a thoughtful next step.</p>
                </div>
            </section>

            <section className="relative pb-24">
                <div className="mx-auto max-w-3xl px-6 md:px-10">
                    <form onSubmit={submit} className="glass-strong rounded-[32px] p-8 md:p-12 space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Field label="Your Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} testid="contact-name" />
                            <Field label="Email *" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} testid="contact-email" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Field label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} testid="contact-phone" />
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2 block">Service</label>
                                <select data-testid="contact-service" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50">
                                    <option value="">Select a service</option>
                                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2 block">Your Message *</label>
                            <textarea data-testid="contact-message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50" />
                        </div>
                        <label className="flex items-start gap-2 text-xs text-white/50">
                            <input type="checkbox" checked={form.consent} onChange={e => setForm({ ...form, consent: e.target.checked })} className="mt-0.5" data-testid="contact-consent" />
                            <span>I agree to be contacted by Veda Brands about my inquiry.</span>
                        </label>
                        <button disabled={busy} data-testid="contact-submit" className="btn-primary w-full justify-center">{busy ? "Sending…" : <>Send Inquiry <Send className="w-4 h-4" /></>}</button>
                    </form>
                </div>
            </section>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", testid }) {
    return (
        <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2 block">{label}</label>
            <input data-testid={testid} type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50" />
        </div>
    );
}
