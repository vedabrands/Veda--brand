import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

export default function FloatingConnect() {
    return (
        <Link
            to="/connect"
            data-testid="floating-connect-button"
            aria-label="Connect with Veda Brands"
            className="fixed z-40 bottom-6 right-6 group"
        >
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-veda-violet to-veda-cyan blur-xl opacity-60 group-hover:opacity-90 animate-pulse-glow" />
            <span className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-veda-violet via-veda-violet2 to-veda-cyan text-white shadow-[0_10px_40px_rgba(124,58,237,0.45)] hover:scale-110 transition-transform animate-float">
                <MessageCircle className="w-6 h-6" />
            </span>
        </Link>
    );
}
