import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import GradientBg from "@/components/site/GradientBg";
import { ArrowUpRight, Sparkles } from "lucide-react";

export default function Services() {
    const [services, setServices] = useState([]);
    useEffect(() => { api.get("/cms/services").then(r => setServices(r.data)).catch(() => {}); }, []);

    return (
        <div data-testid="services-page">
            <section className="relative pt-40 pb-20 md:pt-48">
                <GradientBg />
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">Services</div>
                    <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight max-w-4xl leading-[1.05]">A full studio. <span className="text-gradient-cv">Many disciplines.</span></h1>
                    <p className="mt-8 text-lg text-white/60 max-w-2xl leading-relaxed">From identity systems to digital products and growth campaigns — every discipline calibrated to lift one outcome: your brand's market position.</p>
                </div>
            </section>

            <section className="relative py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    {services.length === 0 ? (
                        <div className="glass rounded-3xl p-12 text-center text-white/55">Services will appear here once added in the CMS.</div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {services.map((s, i) => (
                                <Link key={s.id} to={`/services/${s.slug}`} className="group glass glass-hover rounded-3xl p-7 relative overflow-hidden" data-testid={`service-${i}`}>
                                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-veda-violet/20 blur-3xl" />
                                    <Sparkles className="w-7 h-7 text-veda-cyan" />
                                    <div className="mt-5 font-display text-2xl font-semibold">{s.title}</div>
                                    <p className="mt-2 text-white/55 text-[15px] leading-relaxed line-clamp-3">{s.short_description || s.description}</p>
                                    <div className="mt-5 text-sm text-white/70 inline-flex items-center gap-1">Learn more <ArrowUpRight className="w-4 h-4" /></div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
