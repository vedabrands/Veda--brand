import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { ArrowUpRight } from "lucide-react";

export default function ProjectDetail() {
    const { slug } = useParams();
    const [p, setP] = useState(null);
    const [err, setErr] = useState(false);
    useEffect(() => { api.get(`/cms/portfolio/${slug}`).then(r => setP(r.data)).catch(() => setErr(true)); }, [slug]);

    if (err) return <div className="pt-48 text-center text-white/60">Project not found. <Link to="/portfolio" className="text-veda-cyan">Back to portfolio</Link></div>;
    if (!p) return <div className="pt-48 text-center text-white/40">Loading…</div>;

    const gallery = Array.isArray(p.gallery) ? p.gallery : String(p.gallery || "").split("\n").filter(Boolean);

    return (
        <div>
            <section className="pt-40 md:pt-48 pb-12">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">{p.category || "Project"}</div>
                    <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] max-w-4xl">{p.title}</h1>
                    {p.summary && <p className="mt-6 text-lg text-white/65 max-w-3xl">{p.summary}</p>}
                </div>
            </section>

            {p.cover_image && <div className="mx-auto max-w-7xl px-6 md:px-10 mb-16"><img src={p.cover_image} alt={p.title} className="w-full rounded-[32px] aspect-[16/9] object-cover" /></div>}

            <section className="py-12">
                <div className="mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-3 gap-5">
                    <div className="glass rounded-3xl p-6"><div className="text-xs uppercase tracking-[0.2em] text-veda-cyan">Client</div><div className="mt-2 font-display text-lg">{p.client || "—"}</div></div>
                    <div className="glass rounded-3xl p-6"><div className="text-xs uppercase tracking-[0.2em] text-veda-cyan">Industry</div><div className="mt-2 font-display text-lg">{p.industry || "—"}</div></div>
                    <div className="glass rounded-3xl p-6"><div className="text-xs uppercase tracking-[0.2em] text-veda-cyan">Year</div><div className="mt-2 font-display text-lg">{p.year || p.completion_date || "—"}</div></div>
                </div>
            </section>

            <section className="py-12">
                <div className="mx-auto max-w-4xl px-6 md:px-10 space-y-6">
                    {p.challenge && <div className="glass rounded-3xl p-8"><div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">Challenge</div><p className="text-white/80 leading-relaxed whitespace-pre-wrap">{p.challenge}</p></div>}
                    {p.strategy && <div className="glass rounded-3xl p-8"><div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">Strategy</div><p className="text-white/80 leading-relaxed whitespace-pre-wrap">{p.strategy}</p></div>}
                    {p.execution && <div className="glass rounded-3xl p-8"><div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-3">Execution</div><p className="text-white/80 leading-relaxed whitespace-pre-wrap">{p.execution}</p></div>}
                    {p.results && <div className="glass rounded-3xl p-8"><div className="text-xs uppercase tracking-[0.25em] text-amber-300/90 mb-3">Results</div><p className="text-white/90 text-xl font-display leading-relaxed whitespace-pre-wrap">{p.results}</p></div>}
                </div>
            </section>

            {gallery.length > 0 && (
                <section className="py-12">
                    <div className="mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-2 gap-4">
                        {gallery.map((g, i) => <img key={i} src={g} alt={`gallery ${i}`} className="w-full rounded-3xl object-cover aspect-[16/10]" />)}
                    </div>
                </section>
            )}

            <section className="py-20"><div className="mx-auto max-w-5xl px-6">
                <div className="glass-strong rounded-[32px] p-10 md:p-14 text-center">
                    <h3 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">Have a project like this?</h3>
                    <Link to="/contact" className="btn-primary mt-6">Start Your Project <ArrowUpRight className="w-4 h-4" /></Link>
                </div>
            </div></section>
        </div>
    );
}
