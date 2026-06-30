import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Portfolio from "@/pages/Portfolio";
import ProjectDetail from "@/pages/ProjectDetail";
import Contact from "@/pages/Contact";
import Connect from "@/pages/Connect";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminSetup from "@/pages/admin/AdminSetup";
import AdminLayout from "@/pages/admin/AdminLayout";
import Overview from "@/pages/admin/Overview";
import HomepageEditor from "@/pages/admin/HomepageEditor";
import AboutEditor from "@/pages/admin/AboutEditor";
import ServicesManager from "@/pages/admin/ServicesManager";
import PortfolioManager from "@/pages/admin/PortfolioManager";
import TestimonialsManager from "@/pages/admin/TestimonialsManager";
import FAQManager from "@/pages/admin/FAQManager";
import TeamManager from "@/pages/admin/TeamManager";
import ContactSettings from "@/pages/admin/ContactSettings";
import Inquiries from "@/pages/admin/Inquiries";
import Leads from "@/pages/admin/Leads";
import Settings from "@/pages/admin/Settings";
import "./App.css";

function RequireAdmin({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-veda-bg text-white/60">Loading…</div>;
    if (!user || user.role !== "admin") return <Navigate to="/admin/login" replace />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster theme="dark" position="bottom-right" richColors />
                <Routes>
                    <Route element={<SiteLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/services/:slug" element={<ServiceDetail />} />
                        <Route path="/portfolio" element={<Portfolio />} />
                        <Route path="/portfolio/:slug" element={<ProjectDetail />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/connect" element={<Connect />} />
                        <Route path="/login" element={<Login />} />
                    </Route>
                    <Route path="/admin/setup" element={<AdminSetup />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                        <Route index element={<Overview />} />
                        <Route path="homepage" element={<HomepageEditor />} />
                        <Route path="about" element={<AboutEditor />} />
                        <Route path="services" element={<ServicesManager />} />
                        <Route path="portfolio" element={<PortfolioManager />} />
                        <Route path="testimonials" element={<TestimonialsManager />} />
                        <Route path="faq" element={<FAQManager />} />
                        <Route path="team" element={<TeamManager />} />
                        <Route path="contact" element={<ContactSettings />} />
                        <Route path="inquiries" element={<Inquiries />} />
                        <Route path="leads" element={<Leads />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
