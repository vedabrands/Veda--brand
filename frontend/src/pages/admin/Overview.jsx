import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MessageSquare, Inbox, Briefcase, Sparkles, ArrowUp } from "lucide-react";

export default function Overview() {
    const [s, setS] = useState(null);
    useEffect(() => { api.get("/admin/overview").then(r => setS(r.data)); }, []);
    const cards = s ? [
        { label: "New Inquiries", value: s.inquiries_new, total: s.inquiries_total, icon: MessageSquare, color: "from-veda-violet to-veda-cyan" },
        { label: "Leads Today", value: s.leads_today, total: s.leads_total, icon: Inbox, color: "from-amber-400 to-rose-400" },
        { label: "Services", value: s.services, icon: Sparkles, color: "from-emerald-400 to-cyan-400" },
        { label: "Portfolio", value: s.portfolio, icon: Briefcase, color: "from-blue-400 to-veda-violet" },
    ] : [];

    return (
        <div>
            <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan">Dashboard</div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-2">Studio Overview</h1>
            <p className="text-white/55 mt-2">A snapshot of leads, inquiries and content health.</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
                {cards.map((c, i) => (
                    <div key={i} className="glass rounded-3xl p-6 relative overflow-hidden">
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${c.color} opacity-20 blur-2xl`} />
                        <c.icon className="w-5 h-5 text-veda-cyan" />
                        <div className="mt-4 font-display text-4xl font-semibold">{c.value}</div>
                        <div className="mt-1 text-sm text-white/55">{c.label}</div>
                        {typeof c.total === "number" && <div className="text-xs text-white/40 mt-1">of {c.total} total</div>}
                    </div>
                ))}
            </div>

            <div className="mt-10 glass rounded-3xl p-8">
                <h2 className="font-display text-xl mb-2">Welcome to the Veda Brands CMS</h2>
                <p className="text-white/60 text-sm leading-relaxed">Use the sidebar to manage homepage content, services, portfolio projects, testimonials, FAQ and team. Inquiries and leads collected from the website appear in real time.</p>
            </div>
        </div>
    );
}
