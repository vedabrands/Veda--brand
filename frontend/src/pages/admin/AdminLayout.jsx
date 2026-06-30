import React from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, User2, Briefcase, Star, HelpCircle, Users, MessageSquare, Inbox, Sparkles, Phone, Settings as SettingsIcon, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const items = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/homepage", label: "Homepage", icon: FileText },
    { to: "/admin/about", label: "About", icon: User2 },
    { to: "/admin/services", label: "Services", icon: Sparkles },
    { to: "/admin/portfolio", label: "Portfolio", icon: Briefcase },
    { to: "/admin/testimonials", label: "Testimonials", icon: Star },
    { to: "/admin/faq", label: "FAQ", icon: HelpCircle },
    { to: "/admin/team", label: "Team", icon: Users },
    { to: "/admin/contact", label: "Contact Info", icon: Phone },
    { to: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
    { to: "/admin/leads", label: "Leads", icon: Inbox },
    { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    return (
        <div className="min-h-screen bg-veda-bg text-white flex">
            <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-[#0A0A0C] sticky top-0 h-screen overflow-y-auto">
                <div className="p-5 border-b border-white/[0.06]">
                    <Link to="/admin" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-veda-violet to-veda-cyan" />
                        <div>
                            <div className="font-display font-semibold leading-tight">Veda Brands</div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-veda-cyan">Console</div>
                        </div>
                    </Link>
                </div>
                <nav className="p-3 space-y-1">
                    {items.map(it => (
                        <NavLink key={it.to} to={it.to} end={it.end} data-testid={`admin-nav-${it.label.toLowerCase().replace(/\s+/g, "-")}`}
                            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${isActive ? "bg-white/[0.06] text-white border border-white/10" : "text-white/55 hover:text-white hover:bg-white/[0.04]"}`}>
                            <it.icon className="w-4 h-4" /> {it.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/[0.06] bg-[#0A0A0C]">
                    <div className="px-3 py-2 text-xs text-white/40 truncate">{user?.email}</div>
                    <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/55 hover:text-white hover:bg-white/[0.04]"><ExternalLink className="w-4 h-4" /> View site</a>
                    <button onClick={async () => { await logout(); nav("/admin/login"); }} className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/55 hover:text-white hover:bg-white/[0.04]" data-testid="admin-logout"><LogOut className="w-4 h-4" /> Logout</button>
                </div>
            </aside>
            <main className="flex-1 min-w-0"><div className="p-8 md:p-10"><Outlet /></div></main>
        </div>
    );
}
