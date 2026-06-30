import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Sparkles, Zap, Layers, Target, Quote, Plus, Minus } from "lucide-react";
import { api } from "@/lib/api";
import GradientBg from "@/components/site/GradientBg";
import Counter from "@/components/site/Counter";

function useCMS(path, fallback) {
    const [d, setD] = useState(fallback);
    useEffect(() => { api.get(path).then(r => setD(r.data)).catch(() => setD(fallback)); /* eslint-disable-next-line */ }, [path]);
    return d;
}

export default function Home() {
    const hp = useCMS("/cms/homepage", null);
    const [services, setServices] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [faq, setFaq] = useState([]);
    const [openFaq, setOpenFaq] = useState(0);

    useEffect(() => {
        api.get("/cms/services").then(r => setServices(r.data)).catch(() => {});
        api.get("/cms/portfolio").then(r => setPortfolio(r.data)).catch(() => {});
        api.get("/cms/testimonials").then(r => setTestimonials(r.data)).catch(() => {});
        api.get("/cms/faq").then(r => setFaq(r.data)).catch(() => {});
    }, []);

    return (
        <div data-testid="home-page">
            {/* HERO */}
            <section className="relative pt-40 md:pt-48 pb-24 md:pb-32 overflow-hidden">
                <GradientBg />
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs tracking-[0.2em] uppercase text-white/80 mb-8">
                        <span className="h-1.5 w-1.5 rounded-full bg-veda-cyan animate-pulse" />
                        {hp?.hero_eyebrow || "Premium Branding & Marketing Agency"}
                    </div>
                    <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-semibold leading-[1.02] tracking-tight max-w-5xl">
                        <span className="text-white">{(hp?.hero_title || "We build brands that people remember.").split(" ").slice(0, -2).join(" ")} </span>
                        <span className="text-gradient-cv">{(hp?.hero_title || "We build brands that people remember.").split(" ").slice(-2).join(" ")}</span>
                    </h1>
                    <p className="mt-8 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed">
                        {hp?.hero_subtitle || "Veda Brands crafts strategy, design and digital experiences for ambitious businesses ready to lead their category."}
                    </p>
                    <div className="mt-10 flex flex-wrap items-center gap-4">
                        <Link to="/contact" data-testid="hero-cta-primary" className="btn-primary">
                            {hp?.hero_cta_primary || "Start Your Project"} <ArrowUpRight className="w-4 h-4" />
                        </Link>
                        <Link to="/portfolio" data-testid="hero-cta-secondary" className="btn-secondary">
                            {hp?.hero_cta_secondary || "View Portfolio"} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Floating decorative glass cards */}
                    <div className="hidden md:block absolute top-32 right-10 lg:right-24 w-72 h-44 glass rounded-3xl rotate-6 animate-float opacity-80" style={{ animationDelay: "-2s" }}>
                        <div className="p-5">
                            <div className="text-xs tracking-[0.2em] uppercase text-veda-cyan">Brand System</div>
                            <div className="mt-3 flex gap-2">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-veda-violet to-veda-violet2" />
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-veda-cyan to-blue-500" />
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400" />
                            </div>
                            <div className="mt-3 h-2 w-2/3 bg-white/10 rounded-full" />
                            <div className="mt-2 h-2 w-1/2 bg-white/10 rounded-full" />
                        </div>
                    </div>
                    <div className="hidden lg:block absolute top-72 right-44 w-56 h-32 glass rounded-3xl -rotate-3 animate-float opacity-70" style={{ animationDelay: "-5s" }}>
                        <div className="p-5">
                            <div className="text-xs tracking-[0.2em] uppercase text-amber-300/80">+ 240% Growth</div>
                            <div className="mt-2 h-8 w-full bg-gradient-to-r from-veda-cyan/60 to-transparent rounded" />
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section className="relative py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {(hp?.stats || []).map((s, i) => (
                            <div key={i} data-testid={`stat-${i}`} className="glass glass-hover rounded-3xl p-6 md:p-8">
                                <div className="font-display text-4xl md:text-5xl font-semibold text-gradient-cv">
                                    <Counter value={s.value} />
                                </div>
                                <div className="mt-2 text-sm text-white/50 tracking-wide">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SERVICES PREVIEW */}
            <section className="relative py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
                        <div>
                            <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">What We Do</div>
                            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight max-w-2xl">A full studio under one roof.</h2>
                        </div>
                        <Link to="/services" className="text-white/70 hover:text-white inline-flex items-center gap-2 text-sm">All services <ArrowUpRight className="w-4 h-4" /></Link>
                    </div>

                    {services.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                { icon: Sparkles, title: "Brand Identity", desc: "Naming, logo systems, visual language and verbal identity." },
                                { icon: Layers, title: "Website Design", desc: "Editorial, immersive web experiences engineered to convert." },
                                { icon: Target, title: "Performance Marketing", desc: "Paid media, creative testing and CRO that compounds." },
                                { icon: Zap, title: "Social Media", desc: "Always-on content systems built for owned audience growth." },
                                { icon: Sparkles, title: "Packaging Design", desc: "Shelf-ready packaging that lifts brand and basket size." },
                                { icon: Layers, title: "Creative Direction", desc: "Campaign concepts, art direction and brand storytelling." },
                            ].map((s, i) => (
                                <div key={i} data-testid={`service-card-${i}`} className="group glass glass-hover rounded-3xl p-7 relative overflow-hidden">
                                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-veda-violet/20 blur-3xl group-hover:bg-veda-violet/30 transition" />
                                    <s.icon className="w-7 h-7 text-veda-cyan" />
                                    <div className="mt-5 font-display text-2xl font-semibold">{s.title}</div>
                                    <p className="mt-2 text-white/55 text-[15px] leading-relaxed">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {services.slice(0, 6).map((s, i) => (
                                <Link key={s.id} to={`/services/${s.slug || ""}`} data-testid={`service-card-${i}`} className="group glass glass-hover rounded-3xl p-7 relative overflow-hidden">
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

            {/* WHY US */}
            <section className="relative py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-12 gap-10">
                    <div className="md:col-span-5">
                        <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">Why Veda Brands</div>
                        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">Built like a studio. Operated like a product team.</h2>
                        <p className="mt-5 text-white/60 text-lg leading-relaxed">We pair the taste of a boutique studio with the discipline of a high-velocity product team. No layers. No drift. Just craft, on a clock.</p>
                    </div>
                    <div className="md:col-span-7 grid sm:grid-cols-2 gap-4">
                        {(hp?.why_points || []).map((p, i) => (
                            <div key={i} className="glass rounded-3xl p-6">
                                <div className="text-veda-cyan text-xs tracking-[0.2em] uppercase">0{i + 1}</div>
                                <div className="mt-3 font-display text-xl font-semibold">{p.title}</div>
                                <p className="mt-2 text-white/55 text-[15px] leading-relaxed">{p.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURED PORTFOLIO */}
            <section className="relative py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">Selected Work</div>
                            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight">Recent obsessions.</h2>
                        </div>
                        <Link to="/portfolio" className="text-white/70 hover:text-white inline-flex items-center gap-2 text-sm">View all <ArrowUpRight className="w-4 h-4" /></Link>
                    </div>
                    {portfolio.length === 0 ? (
                        <div className="glass rounded-3xl p-12 text-center text-white/50">
                            Portfolio projects will appear here once added in the CMS.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-5">
                            {portfolio.slice(0, 4).map((p, i) => (
                                <Link key={p.id} to={`/portfolio/${p.slug}`} className={`group relative glass rounded-3xl overflow-hidden ${i % 3 === 0 ? "md:col-span-2" : ""}`} data-testid={`portfolio-card-${i}`}>
                                    <div className="aspect-[16/10] overflow-hidden">
                                        {p.cover_image ? (
                                            <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-veda-violet/30 via-veda-bg2 to-veda-cyan/20" />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-veda-bg via-veda-bg/30 to-transparent opacity-90" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                        <div className="text-xs tracking-[0.2em] uppercase text-veda-cyan">{p.category || p.industry}</div>
                                        <div className="mt-1 font-display text-2xl md:text-3xl font-semibold">{p.title}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* PROCESS */}
            <section className="relative py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">How We Work</div>
                    <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl mb-14">A five-stage system, refined over hundreds of brands.</h2>
                    <div className="grid md:grid-cols-5 gap-4">
                        {(hp?.process || []).map((s, i) => (
                            <div key={i} className="glass rounded-3xl p-6 relative">
                                <div className="font-mono text-xs text-veda-cyan">{s.step}</div>
                                <div className="mt-4 font-display text-xl font-semibold">{s.title}</div>
                                <p className="mt-2 text-sm text-white/55 leading-relaxed">{s.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            {testimonials.length > 0 && (
                <section className="relative py-24 md:py-32">
                    <div className="mx-auto max-w-7xl px-6 md:px-10">
                        <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">Client Words</div>
                        <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-14">Trusted by founders.</h2>
                        <div className="grid md:grid-cols-3 gap-5">
                            {testimonials.slice(0, 6).map(t => (
                                <div key={t.id} className="glass rounded-3xl p-7">
                                    <Quote className="w-8 h-8 text-veda-cyan/60" />
                                    <p className="mt-4 text-white/80 text-[15px] leading-relaxed">"{t.quote}"</p>
                                    <div className="mt-5 flex items-center gap-3">
                                        {t.photo && <img src={t.photo} alt={t.name} className="w-10 h-10 rounded-full object-cover" />}
                                        <div>
                                            <div className="font-medium text-sm">{t.name}</div>
                                            <div className="text-xs text-white/50">{t.role}{t.company ? ` · ${t.company}` : ""}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FAQ */}
            {faq.length > 0 && (
                <section className="relative py-24 md:py-32">
                    <div className="mx-auto max-w-3xl px-6">
                        <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3 text-center">Questions</div>
                        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-center mb-12">Everything you might ask.</h2>
                        <div className="space-y-3">
                            {faq.map((q, i) => (
                                <div key={q.id} className="glass rounded-2xl overflow-hidden">
                                    <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} data-testid={`faq-toggle-${i}`} className="w-full flex items-center justify-between p-6 text-left">
                                        <span className="font-medium">{q.question}</span>
                                        {openFaq === i ? <Minus className="w-4 h-4 text-veda-cyan" /> : <Plus className="w-4 h-4 text-veda-cyan" />}
                                    </button>
                                    {openFaq === i && <div className="px-6 pb-6 text-white/60 leading-relaxed">{q.answer}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FINAL CTA */}
            <section className="relative py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="relative overflow-hidden rounded-[36px] glass-strong p-10 md:p-20 noise">
                        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-veda-violet/30 blur-[140px]" />
                        <div className="absolute -bottom-32 -right-10 w-[420px] h-[420px] rounded-full bg-veda-cyan/25 blur-[140px]" />
                        <div className="relative max-w-3xl">
                            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                                Let's build the brand <span className="text-gradient-warm">your future self</span> will be proud of.
                            </h2>
                            <p className="mt-6 text-white/65 text-lg max-w-xl">Share your vision. We'll come back within one business day with a thoughtful response.</p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link to="/contact" className="btn-primary">Start Your Project <ArrowUpRight className="w-4 h-4" /></Link>
                                <Link to="/connect" className="btn-secondary">Talk to us</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
