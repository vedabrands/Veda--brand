import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "./_helpers";
import { Trash2 } from "lucide-react";

export default function Leads() {
    const [items, setItems] = useState([]);
    const load = () => api.get("/admin/leads").then(r => setItems(r.data));
    useEffect(() => { load(); }, []);
    const del = async (id) => { if (!window.confirm("Delete lead?")) return; await api.delete(`/admin/leads/${id}`); load(); };

    return (
        <div>
            <PageHeader eyebrow="Newsletter" title="Leads" subtitle="People who joined via the lead popup or newsletter form." />
            <div className="glass rounded-3xl p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.18em] text-white/50">
                        <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Source</th><th className="p-4">Date</th><th className="p-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-white/40">No leads yet.</td></tr>}
                        {items.map(l => (
                            <tr key={l.id} className="border-t border-white/[0.05]">
                                <td className="p-4">{l.first_name}</td>
                                <td className="p-4 text-white/70">{l.email}</td>
                                <td className="p-4 text-white/55 text-sm">{l.source}</td>
                                <td className="p-4 text-white/55 text-sm">{new Date(l.created_at).toLocaleString()}</td>
                                <td className="p-4 text-right"><button onClick={() => del(l.id)} className="h-8 w-8 rounded-full glass inline-flex items-center justify-center hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
