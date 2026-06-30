// Generic editor utilities for admin pages
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

export function PageHeader({ eyebrow, title, subtitle, actions }) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
                <div className="text-xs uppercase tracking-[0.25em] text-veda-cyan">{eyebrow}</div>
                <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2">{title}</h1>
                {subtitle && <p className="text-white/55 mt-2">{subtitle}</p>}
            </div>
            <div className="flex gap-2">{actions}</div>
        </div>
    );
}

export function Field({ label, value, onChange, type = "text", placeholder, rows, hint }) {
    return (
        <div>
            <label className="text-xs uppercase tracking-[0.18em] text-white/50 mb-2 block">{label}</label>
            {rows ? (
                <textarea rows={rows} value={value ?? ""} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50" />
            ) : (
                <input type={type} value={value ?? ""} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50" />
            )}
            {hint && <div className="text-xs text-white/40 mt-1">{hint}</div>}
        </div>
    );
}

export function SingletonEditor({ eyebrow, title, subtitle, getUrl, putUrl, fields, arrayFields = [] }) {
    const [d, setD] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { api.get(getUrl).then(r => setD(r.data)); }, [getUrl]);

    if (!d) return <div className="text-white/40">Loading…</div>;

    const save = async () => {
        setSaving(true);
        try { const { data } = await api.put(putUrl, d); setD(data); toast.success("Saved."); }
        catch { toast.error("Save failed."); } finally { setSaving(false); }
    };

    return (
        <div>
            <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actions={<button onClick={save} disabled={saving} className="btn-primary"><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}</button>} />
            <div className="glass rounded-3xl p-6 md:p-8 grid md:grid-cols-2 gap-5">
                {fields.map(f => (
                    <div key={f.key} className={f.full ? "md:col-span-2" : ""}>
                        <Field label={f.label} value={d[f.key]} rows={f.rows} placeholder={f.placeholder} onChange={v => setD({ ...d, [f.key]: v })} />
                    </div>
                ))}
            </div>
            {arrayFields.map(af => (
                <div key={af.key} className="glass rounded-3xl p-6 md:p-8 mt-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-veda-cyan">{af.label}</div>
                            <div className="text-sm text-white/55">{af.subtitle}</div>
                        </div>
                        <button onClick={() => setD({ ...d, [af.key]: [...(d[af.key] || []), af.template] })} className="btn-secondary text-sm"><Plus className="w-4 h-4" /> Add</button>
                    </div>
                    <div className="space-y-3">
                        {(d[af.key] || []).map((row, idx) => (
                            <div key={idx} className="grid md:grid-cols-12 gap-3 items-start bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                {af.fields.map(rf => (
                                    <div key={rf.key} className={`md:col-span-${rf.span || 4}`}>
                                        <Field label={rf.label} value={row[rf.key]} rows={rf.rows} placeholder={rf.placeholder} onChange={v => {
                                            const arr = [...d[af.key]]; arr[idx] = { ...arr[idx], [rf.key]: v }; setD({ ...d, [af.key]: arr });
                                        }} />
                                    </div>
                                ))}
                                <div className="md:col-span-1 flex md:justify-end pt-7">
                                    <button onClick={() => setD({ ...d, [af.key]: d[af.key].filter((_, i) => i !== idx) })} className="h-9 w-9 rounded-full glass flex items-center justify-center hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function CollectionManager({ eyebrow, title, subtitle, endpoint, fields, defaultItem }) {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState(null);

    const load = () => api.get(`/admin/${endpoint}`).then(r => setItems(r.data));
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [endpoint]);

    const create = () => setEditing({ ...defaultItem });
    const save = async () => {
        try {
            if (editing.id) {
                await api.put(`/admin/${endpoint}/${editing.id}`, editing);
            } else {
                await api.post(`/admin/${endpoint}`, editing);
            }
            setEditing(null); load(); toast.success("Saved.");
        } catch { toast.error("Save failed."); }
    };
    const del = async (id) => { if (!window.confirm("Delete?")) return; await api.delete(`/admin/${endpoint}/${id}`); load(); };

    return (
        <div>
            <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actions={<button onClick={create} className="btn-primary"><Plus className="w-4 h-4" /> Add new</button>} />
            <div className="grid gap-3">
                {items.length === 0 && <div className="glass rounded-3xl p-8 text-white/50 text-center">No items yet. Click "Add new" to create one.</div>}
                {items.map(it => (
                    <div key={it.id} className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="font-display text-lg truncate">{it.title || it.question || it.name || it.quote || "Untitled"}</div>
                            <div className="text-sm text-white/50 truncate">{it.slug || it.role || it.category || ""}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${it.published ? "bg-emerald-500/10 text-emerald-300" : "bg-white/[0.04] text-white/50"}`}>{it.published ? "Published" : "Hidden"}</span>
                            <button onClick={() => setEditing(it)} className="btn-secondary text-sm">Edit</button>
                            <button onClick={() => del(it.id)} className="h-9 w-9 rounded-full glass flex items-center justify-center hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditing(null)} />
                    <div className="relative glass-strong rounded-3xl w-full max-w-3xl max-h-[88vh] overflow-y-auto p-8">
                        <div className="font-display text-2xl font-semibold mb-6">{editing.id ? "Edit" : "Create"}</div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {fields.map(f => (
                                <div key={f.key} className={f.full ? "md:col-span-2" : ""}>
                                    <Field label={f.label} value={editing[f.key]} rows={f.rows} placeholder={f.placeholder} type={f.type} onChange={v => setEditing({ ...editing, [f.key]: v })} hint={f.hint} />
                                </div>
                            ))}
                            <div className="md:col-span-2 flex items-center gap-3">
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /> Published</label>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.featured} onChange={e => setEditing({ ...editing, featured: e.target.checked })} /> Featured</label>
                                <Field label="Order" type="number" value={editing.order ?? 0} onChange={v => setEditing({ ...editing, order: Number(v) })} />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
                            <button onClick={save} className="btn-primary"><Save className="w-4 h-4" /> Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
