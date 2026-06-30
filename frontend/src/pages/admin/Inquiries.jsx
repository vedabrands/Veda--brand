import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "./_helpers";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const STATUSES = ["new", "contacted", "in_progress", "closed", "archived", "spam"];

export default function Inquiries() {
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(null);
    const load = () => api.get("/admin/inquiries").then(r => setItems(r.data));
    useEffect(() => { load(); }, []);

    const update = async (id, status, notes) => {
        await api.put(`/admin/inquiries/${id}`, { status, notes });
        toast.success("Updated."); load();
    };
    const del = async (id) => { if (!window.confirm("Delete this inquiry?")) return; await api.delete(`/admin/inquiries/${id}`); load(); setOpen(null); };

    return (
        <div>
            <PageHeader eyebrow="Leads & Sales" title="Inquiries" subtitle="Project inquiries from the website's contact forms." />
            <div className="grid gap-3">
                {items.length === 0 && <div className="glass rounded-3xl p-8 text-center text-white/50">No inquiries yet.</div>}
                {items.map(it => (
                    <div key={it.id} className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="min-w-0">
                                <div className="font-display text-lg">{it.name} <span className="text-white/40 text-sm">· {it.email}</span></div>
                                <div className="text-sm text-white/55">{it.service || "General"} · {new Date(it.created_at).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <select value={it.status} onChange={e => update(it.id, e.target.value, it.notes || "")} className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm">
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button onClick={() => setOpen(open?.id === it.id ? null : it)} className="btn-secondary text-sm">{open?.id === it.id ? "Hide" : "View"}</button>
                                <button onClick={() => del(it.id)} className="h-9 w-9 rounded-full glass flex items-center justify-center hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        {open?.id === it.id && (
                            <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                                <div className="text-sm text-white/80 whitespace-pre-wrap">{it.message}</div>
                                {it.phone && <div className="text-sm text-white/55">Phone: {it.phone}</div>}
                                <textarea placeholder="Internal notes…" defaultValue={it.notes || ""} onBlur={(e) => update(it.id, it.status, e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
