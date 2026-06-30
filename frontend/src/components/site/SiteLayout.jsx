import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingConnect from "./FloatingConnect";
import LeadPopup from "./LeadPopup";

export default function SiteLayout() {
    const { pathname } = useLocation();
    const isLogin = pathname === "/login";
    return (
        <div className="min-h-screen flex flex-col bg-veda-bg text-white relative overflow-x-hidden">
            <Navbar />
            <main className="flex-1 relative">
                <Outlet />
            </main>
            <Footer />
            <FloatingConnect />
            {!isLogin && <LeadPopup />}
        </div>
    );
}
