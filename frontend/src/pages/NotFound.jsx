import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-veda-bg flex items-center justify-center px-6">
            <div className="text-center">
                <div className="font-display text-[120px] md:text-[200px] font-semibold text-gradient-cv leading-none">404</div>
                <div className="mt-2 text-white/60">This page wandered off.</div>
                <Link to="/" className="btn-primary mt-8 inline-flex">Return Home</Link>
            </div>
        </div>
    );
}
