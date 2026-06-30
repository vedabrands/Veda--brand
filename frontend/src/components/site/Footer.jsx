import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Phone, Mail, MapPin, Clock, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
    const [contact, setContact] = useState(null);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        api.get("/cms/contact").then(r => setContact(r.data)).catch(() => {});
        api.get("/cms/settings").then(r => setSettings(r.data)).catch(() => {});
    }, []);

    return (
        <footer data-testid="site-footer" className="relative mt-32 border-t border-white/[0.06] bg-veda-bg">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-veda-cyan/40 to-transparent" />
            <div className="absolute -top-40 left-1/4 w-[480px] h-[480px] rounded-full bg-veda-violet/10 blur-[160px] pointer-events-none" />

            <div className="relative mx-auto max-w-7xl px-6 md:px-10 py-20">
                <div className="grid grid-cols-2 md:grid-cols-12 gap-10">
                    <div className="col-span-2 md:col-span-5">
                        <div className="flex items-center gap-3 mb-5">
                            {settings?.logo_url && <img src={settings.logo_url} alt="logo" className="h-10 w-10 rounded-full ring-1 ring-white/10" />}
                            <div className="font-display text-2xl font-semibold">Veda Brands</div>
                        </div>
                        <p className="text-white/60 max-w-md text-[15px] leading-relaxed">
                            Building brands the world wants to believe in. Strategy, design and growth — crafted for ambitious founders.
                        </p>
                        <div className="mt-6 flex items-center gap-3">
                            {contact?.instagram_url && <a href={contact.instagram_url} target="_blank" rel="noreferrer" className="h-10 w-10 glass rounded-full flex items-center justify-center hover:bg-white/10"><Instagram className="w-4 h-4" /></a>}
                            {contact?.linkedin_url && <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="h-10 w-10 glass rounded-full flex items-center justify-center hover:bg-white/10"><Linkedin className="w-4 h-4" /></a>}
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-veda-cyan mb-4">Explore</div>
                        <ul className="space-y-2.5 text-white/70 text-[15px]">
                            <li><Link to="/" className="hover:text-white">Home</Link></li>
                            <li><Link to="/about" className="hover:text-white">About</Link></li>
                            <li><Link to="/services" className="hover:text-white">Services</Link></li>
                            <li><Link to="/portfolio" className="hover:text-white">Portfolio</Link></li>
                            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                            <li><Link to="/connect" className="hover:text-white">Connect</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-veda-cyan mb-4">Contact</div>
                        <ul className="space-y-3 text-white/70 text-[15px]">
                            {contact?.phone && <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-white/40" /><a href={`tel:${contact.phone}`}>{contact.phone}</a></li>}
                            {contact?.email && <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-white/40" /><a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
                            {contact?.address && <li className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-1 text-white/40" /><span>{contact.address}</span></li>}
                            {contact?.hours && <li className="flex items-start gap-3"><Clock className="w-4 h-4 mt-1 text-white/40" /><span>{contact.hours}</span></li>}
                        </ul>
                    </div>
                </div>

                <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-white/40">
                    <div>© {new Date().getFullYear()} Veda Brands. All rights reserved.</div>
                    <div className="flex items-center gap-5">
                        <a href="#" className="hover:text-white/80">Privacy</a>
                        <a href="#" className="hover:text-white/80">Terms</a>
                        <Link to="/admin/login" data-testid="footer-admin-link" className="hover:text-white/80">Admin</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
