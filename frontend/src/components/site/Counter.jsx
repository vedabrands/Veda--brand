import React, { useEffect, useRef, useState } from "react";

export default function Counter({ value, suffix = "", duration = 1600 }) {
    const ref = useRef(null);
    const [n, setN] = useState(0);
    const numeric = parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
    const trailing = String(value).replace(/[0-9.]/g, "");

    useEffect(() => {
        if (!ref.current) return;
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                const start = performance.now();
                const tick = (t) => {
                    const p = Math.min((t - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    setN(numeric * eased);
                    if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
                io.disconnect();
            }
        }, { threshold: 0.4 });
        io.observe(ref.current);
        return () => io.disconnect();
    }, [numeric, duration]);

    const display = Number.isInteger(numeric) ? Math.floor(n) : n.toFixed(1);
    return <span ref={ref}>{display}{trailing}{suffix}</span>;
}
