import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Phone, MessageCircle, Mail, MapPin, Clock, Instagram, Linkedin, ArrowUpRight } from "lucide-react";
import GradientBg from "@/components/site/GradientBg";

export default function Connect() {
    const [c, setC] = useState(null);
    useEffect(() => { api.get("/cms/contact").then(r => setC(r.data)); }, []);

    return (
        <div data-testid="connect-page">
            <section className="relative pt-40 pb-16 md:pt-48">
                <GradientBg />
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">Connect</div>
                    <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">Five ways <span className="text-gradient-cv">to reach us.</span></h1>
                </div>
            </section>

            <section className="relative pb-16">
                <div className="mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <ContactCard icon={Phone} label="Phone" value={c?.phone} href={c?.phone ? `tel:${c.phone}` : "#"} cta="Call now" testid="connect-phone" />
                    <ContactCard icon={MessageCircle} label="WhatsApp" value={c?.whatsapp} href={c?.whatsapp_link || (c?.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` : "#")} cta="Open chat" external testid="connect-whatsapp" highlight />
                    <ContactCard icon={Mail} label="Email" value={c?.email} href={c?.email ? `mailto:${c.email}` : "#"} cta="Send email" testid="connect-email" />
                    <ContactCard icon={Instagram} label="Instagram" value={c?.instagram || "Coming Soon"} href={c?.instagram_url || "#"} cta={c?.instagram_url ? "Visit" : "Coming Soon"} external testid="connect-instagram" disabled={!c?.instagram_url} />
                    <ContactCard icon={Linkedin} label="LinkedIn" value={c?.linkedin || "Coming Soon"} href={c?.linkedin_url || "#"} cta={c?.linkedin_url ? "Visit" : "Coming Soon"} external testid="connect-linkedin" disabled={!c?.linkedin_url} />
                    <div className="glass rounded-3xl p-7">
                        <Clock className="w-7 h-7 text-veda-cyan" />
                        <div className="mt-4 text-xs uppercase tracking-[0.2em] text-white/50">Business Hours</div>
                        <div className="mt-2 font-display text-xl font-semibold">{c?.hours || "7:00 AM – 8:00 PM"}</div>
                        <div className="mt-1 text-sm text-white/55">Open every day · IST</div>
                    </div>
                </div>
            </section>

            <section className="relative pb-24">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="glass rounded-[32px] overflow-hidden">
                        <div className="grid lg:grid-cols-5">
                            <div className="p-8 md:p-12 lg:col-span-2">
                                <MapPin className="w-7 h-7 text-veda-cyan" />
                                <div className="mt-4 text-xs uppercase tracking-[0.2em] text-white/50">Studio</div>
                                <div className="mt-2 font-display text-2xl md:text-3xl font-semibold">{c?.address || "Faridabad, Haryana, India"}</div>
                                <p className="mt-3 text-white/55">Visits by appointment. Drop us a line first.</p>
                            </div>
                            <div className="lg:col-span-3 min-h-[320px]">
                                {c?.map_embed && <iframe title="map" src={c.map_embed} className="w-full h-full min-h-[320px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ContactCard({ icon: Icon, label, value, href, cta, external, testid, disabled, highlight }) {
    const Tag = disabled ? "div" : "a";
    return (
        <Tag data-testid={testid} href={disabled ? undefined : href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className={`relative group glass rounded-3xl p-7 overflow-hidden ${disabled ? "opacity-60" : "glass-hover"}`}>
            {highlight && <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-emerald-500/30 blur-3xl" />}
            <Icon className={`w-7 h-7 ${highlight ? "text-emerald-300" : "text-veda-cyan"}`} />
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-white/50">{label}</div>
            <div className="mt-2 font-display text-xl md:text-2xl font-semibold">{value}</div>
            <div className="mt-4 text-sm text-white/70 inline-flex items-center gap-1">{cta}{!disabled && <ArrowUpRight className="w-4 h-4" />}</div>
        </Tag>
    );
}
