import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import GradientBg from "@/components/site/GradientBg";
import { ArrowUpRight } from "lucide-react";

export default function About() {
    const [a, setA] = useState(null);
    const [team, setTeam] = useState([]);
    useEffect(() => {
        api.get("/cms/about").then(r => setA(r.data));
        api.get("/cms/team").then(r => setTeam(r.data)).catch(() => {});
    }, []);

    return (
        <div data-testid="about-page">
            <section className="relative pt-40 pb-20 md:pt-48">
                <GradientBg />
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">About Veda Brands</div>
                    <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight max-w-4xl leading-[1.05]">{a?.title || "We build brands the world wants to believe in."}</h1>
                    <p className="mt-8 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed">{a?.subtitle}</p>
                </div>
            </section>

            <section className="relative py-20 md:py-28">
                <div className="mx-auto max-w-5xl px-6 md:px-10">
                    <div className="glass rounded-3xl p-8 md:p-14">
                        <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">Our Story</div>
                        <p className="font-display text-2xl md:text-3xl leading-relaxed text-white/90">{a?.story}</p>
                    </div>
                </div>
            </section>

            <section className="relative py-20 md:py-28">
                <div className="mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-2 gap-5">
                    <div className="glass rounded-3xl p-8 md:p-12">
                        <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">Mission</div>
                        <p className="font-display text-2xl md:text-3xl leading-tight">{a?.mission}</p>
                    </div>
                    <div className="glass rounded-3xl p-8 md:p-12">
                        <div className="text-xs uppercase tracking-[0.25em] text-amber-300/90 mb-3">Vision</div>
                        <p className="font-display text-2xl md:text-3xl leading-tight">{a?.vision}</p>
                    </div>
                </div>
            </section>

            <section className="relative py-20 md:py-28">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">Core Values</div>
                    <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-12">What we stand on.</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(a?.values || []).map((v, i) => (
                            <div key={i} className="glass glass-hover rounded-3xl p-6">
                                <div className="font-mono text-xs text-veda-cyan">0{i + 1}</div>
                                <div className="mt-4 font-display text-xl font-semibold">{v.title}</div>
                                <p className="mt-2 text-white/55 text-[15px] leading-relaxed">{v.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {team.length > 0 && (
                <section className="relative py-20 md:py-28">
                    <div className="mx-auto max-w-7xl px-6 md:px-10">
                        <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">The Studio</div>
                        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-12">People behind the work.</h2>
                        <div className="grid md:grid-cols-3 gap-5">
                            {team.map(m => (
                                <div key={m.id} className="glass rounded-3xl overflow-hidden">
                                    {m.photo && <img src={m.photo} alt={m.name} className="w-full aspect-square object-cover" />}
                                    <div className="p-5">
                                        <div className="font-display text-lg font-semibold">{m.name}</div>
                                        <div className="text-sm text-white/50">{m.position}</div>
                                        {m.bio && <p className="mt-2 text-sm text-white/60">{m.bio}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="relative py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="glass-strong rounded-[32px] p-10 md:p-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                        <div>
                            <h3 className="font-display text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl">Ready to build something worth remembering?</h3>
                        </div>
                        <Link to="/contact" className="btn-primary self-start md:self-auto">Start Your Project <ArrowUpRight className="w-4 h-4" /></Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
