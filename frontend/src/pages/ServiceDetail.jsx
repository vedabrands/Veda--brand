import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import GradientBg from "@/components/site/GradientBg";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function ServiceDetail() {
    const { slug } = useParams();
    const [s, setS] = useState(null);
    const [err, setErr] = useState(false);

    useEffect(() => { api.get(`/cms/services/${slug}`).then(r => setS(r.data)).catch(() => setErr(true)); }, [slug]);

    if (err) return <div className="pt-48 text-center text-white/60">Service not found. <Link to="/services" className="text-veda-cyan">Back to services</Link></div>;
    if (!s) return <div className="pt-48 text-center text-white/40">Loading…</div>;

    const deliverables = Array.isArray(s.deliverables) ? s.deliverables : String(s.deliverables || "").split("\n").filter(Boolean);
    const benefits = Array.isArray(s.benefits) ? s.benefits : String(s.benefits || "").split("\n").filter(Boolean);

    return (
        <div>
            <section className="relative pt-40 pb-16 md:pt-48">
                <GradientBg />
                <div className="mx-auto max-w-5xl px-6 md:px-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">Service</div>
                    <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">{s.title}</h1>
                    {s.short_description && <p className="mt-6 text-lg md:text-xl text-white/65 max-w-3xl leading-relaxed">{s.short_description}</p>}
                </div>
            </section>

            {s.cover_image && <div className="mx-auto max-w-7xl px-6 md:px-10"><img src={s.cover_image} alt={s.title} className="w-full rounded-[32px] object-cover aspect-[16/8]" /></div>}

            <section className="relative py-20 md:py-28">
                <div className="mx-auto max-w-5xl px-6 md:px-10 space-y-6">
                    {s.description && <div className="glass rounded-3xl p-8 md:p-12"><p className="text-white/80 text-lg leading-relaxed whitespace-pre-wrap">{s.description}</p></div>}
                    {benefits.length > 0 && (
                        <div className="glass rounded-3xl p-8 md:p-12">
                            <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">Benefits</div>
                            <ul className="grid sm:grid-cols-2 gap-3">
                                {benefits.map((b, i) => <li key={i} className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-veda-cyan mt-0.5 shrink-0" /><span>{b}</span></li>)}
                            </ul>
                        </div>
                    )}
                    {deliverables.length > 0 && (
                        <div className="glass rounded-3xl p-8 md:p-12">
                            <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">Deliverables</div>
                            <ul className="grid sm:grid-cols-2 gap-3">
                                {deliverables.map((b, i) => <li key={i} className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" /><span>{b}</span></li>)}
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            <section className="py-20"><div className="mx-auto max-w-5xl px-6">
                <div className="glass-strong rounded-[32px] p-10 md:p-14 text-center">
                    <h3 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">Ready to start?</h3>
                    <Link to="/contact" className="btn-primary mt-6">Start Your Project <ArrowUpRight className="w-4 h-4" /></Link>
                </div>
            </div></section>
        </div>
    );
}
