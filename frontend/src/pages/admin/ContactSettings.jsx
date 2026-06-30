import React from "react";
import { SingletonEditor } from "./_helpers";

export default function ContactSettings() {
    return (
        <SingletonEditor eyebrow="Connect & Contact" title="Contact Information" subtitle="Used across Connect page, footer and emails."
            getUrl="/cms/contact" putUrl="/admin/contact"
            fields={[
                { key: "phone", label: "Phone" },
                { key: "whatsapp", label: "WhatsApp Number (display)" },
                { key: "whatsapp_link", label: "WhatsApp Deep Link", full: true, placeholder: "https://wa.me/918368124957" },
                { key: "email", label: "Email" },
                { key: "address", label: "Address" },
                { key: "hours", label: "Business Hours" },
                { key: "instagram", label: "Instagram Handle / Status" },
                { key: "instagram_url", label: "Instagram URL" },
                { key: "linkedin", label: "LinkedIn / Status" },
                { key: "linkedin_url", label: "LinkedIn URL" },
                { key: "map_embed", label: "Google Maps Embed URL", full: true },
            ]}
        />
    );
}
