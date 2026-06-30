import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import GradientBg from "@/components/site/GradientBg";
import { Search } from "lucide-react";

export default function Portfolio() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("All");
    useEffect(() => { api.get("/cms/portfolio").then(r => setItems(r.data)).catch(() => {}); }, []);

    const cats = useMemo(() => ["All", ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))], [items]);
    const filtered = items.filter(i => (cat === "All" || i.category === cat) && (q === "" || [i.title, i.client, i.category, i.industry].some(v => String(v || "").toLowerCase().includes(q.toLowerCase()))));

    return (
        <div data-testid="portfolio-page">
            <section className="relative pt-40 pb-12 md:pt-48">
                <GradientBg />
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan mb-4">Portfolio</div>
                    <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] max-w-4xl">Work that earns <span className="text-gradient-cv">attention.</span></h1>
                </div>
            </section>

            <section className="relative py-8">
                <div className="mx-auto max-w-7xl px-6 md:px-10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {cats.map(c => (
                            <button key={c} onClick={() => setCat(c)} data-testid={`portfolio-filter-${c}`} className={`px-4 py-2 text-sm rounded-full transition ${cat === c ? "bg-white text-veda-bg" : "glass text-white/70 hover:text-white"}`}>{c}</button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input data-testid="portfolio-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects" className="pl-10 pr-4 py-2.5 rounded-full glass text-sm w-full md:w-72 placeholder:text-white/30" />
                    </div>
                </div>
            </section>

            <section className="relative py-12">
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    {filtered.length === 0 ? (
                        <div className="glass rounded-3xl p-12 text-center text-white/50">No projects to display yet.</div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map((p, i) => (
                                <Link key={p.id} to={`/portfolio/${p.slug}`} className="group glass rounded-3xl overflow-hidden glass-hover" data-testid={`portfolio-item-${i}`}>
                                    <div className="aspect-[4/3] overflow-hidden bg-veda-bg2">
                                        {p.cover_image ? <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" /> : <div className="w-full h-full bg-gradient-to-br from-veda-violet/30 to-veda-cyan/20" />}
                                    </div>
                                    <div className="p-5">
                                        <div className="text-xs tracking-[0.2em] uppercase text-veda-cyan">{p.category}</div>
                                        <div className="mt-1 font-display text-xl font-semibold">{p.title}</div>
                                        <div className="text-sm text-white/50 mt-1">{p.client}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
