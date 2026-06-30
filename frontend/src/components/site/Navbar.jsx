import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";

const navItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/services", label: "Services" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/contact", label: "Contact" },
    { to: "/connect", label: "Connect" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const [logo, setLogo] = useState("");
    const { pathname } = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener("scroll", onScroll);
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => { setOpen(false); }, [pathname]);

    useEffect(() => {
        api.get("/cms/settings").then(r => setLogo(r.data.logo_url || "")).catch(() => {});
    }, []);

    return (
        <header
            data-testid="site-navbar"
            className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
                scrolled ? "py-3" : "py-5"
            }`}
        >
            <div className={`mx-auto max-w-7xl px-5 md:px-8`}>
                <div className={`flex items-center justify-between rounded-full px-4 md:px-6 py-2.5 transition-all duration-500 ${
                    scrolled ? "glass-strong shadow-[0_8px_32px_rgba(0,0,0,0.35)]" : "bg-transparent"
                }`}>
                    <Link to="/" data-testid="logo-link" className="flex items-center gap-2.5 group">
                        {logo ? (
                            <img src={logo} alt="Veda Brands" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10" />
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-veda-violet to-veda-cyan" />
                        )}
                        <span className="font-display text-base md:text-lg font-semibold tracking-tight">Veda Brands</span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map(n => (
                            <NavLink
                                key={n.to}
                                to={n.to}
                                end={n.to === "/"}
                                data-testid={`nav-${n.label.toLowerCase()}`}
                                className={({ isActive }) => `relative px-4 py-2 text-sm font-medium rounded-full transition ${
                                    isActive ? "text-white" : "text-white/60 hover:text-white"
                                }`}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && <span className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/10" />}
                                        <span className="relative">{n.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <Link to="/login" data-testid="nav-login" className="hidden md:inline-block text-sm font-medium text-white/70 hover:text-white px-3 py-2">Login</Link>
                        <Link to="/contact" data-testid="nav-cta" className="hidden md:inline-flex items-center gap-1.5 bg-white text-veda-bg text-sm font-semibold px-5 py-2.5 rounded-full hover:scale-[1.03] transition">
                            Start Your Project
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                        <button
                            data-testid="mobile-menu-toggle"
                            onClick={() => setOpen(v => !v)}
                            className="lg:hidden h-10 w-10 rounded-full glass flex items-center justify-center"
                            aria-label="Toggle menu"
                        >
                            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`lg:hidden fixed inset-0 z-30 transition-all duration-500 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
                <div className="absolute inset-0 bg-veda-bg/95 backdrop-blur-2xl" onClick={() => setOpen(false)} />
                <div className="relative pt-24 px-6 flex flex-col gap-2">
                    {navItems.map(n => (
                        <Link key={n.to} to={n.to} data-testid={`mobile-nav-${n.label.toLowerCase()}`} className="font-display text-4xl font-semibold py-3 border-b border-white/5">
                            {n.label}
                        </Link>
                    ))}
                    <Link to="/login" className="font-display text-4xl font-semibold py-3 border-b border-white/5 text-white/70">Login</Link>
                    <Link to="/contact" className="mt-6 btn-primary self-start">Start Your Project</Link>
                </div>
            </div>
        </header>
    );
}
