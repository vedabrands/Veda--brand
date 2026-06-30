import React from "react";

export default function GradientBg({ variant = "default" }) {
    return (
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-15%] left-[-10%] w-[640px] h-[640px] rounded-full bg-veda-violet/25 blur-[140px] animate-float-slow" />
            <div className="absolute top-[20%] right-[-15%] w-[560px] h-[560px] rounded-full bg-veda-cyan/20 blur-[160px] animate-float-slow" style={{ animationDelay: "-4s" }} />
            <div className="absolute bottom-[-10%] left-[20%] w-[520px] h-[520px] rounded-full bg-amber-500/10 blur-[170px] animate-float-slow" style={{ animationDelay: "-8s" }} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_50%)]" />
            {variant === "subtle" && <div className="absolute inset-0 bg-veda-bg/40" />}
        </div>
    );
}
