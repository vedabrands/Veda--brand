import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ value, onChange, placeholder = "Password", required, minLength, testid, className = "" }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                data-testid={testid}
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                minLength={minLength}
                className={`w-full pl-4 pr-12 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-veda-cyan/50 ${className}`}
            />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                data-testid={testid ? `${testid}-toggle` : "password-toggle"}
                tabIndex={-1}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition"
            >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
}
