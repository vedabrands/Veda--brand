import React from "react";
import { SingletonEditor } from "./_helpers";

export default function Settings() {
    return (
        <SingletonEditor eyebrow="Settings" title="Global Site Settings" subtitle="Brand, logo and SEO defaults."
            getUrl="/cms/settings" putUrl="/admin/settings"
            fields={[
                { key: "site_name", label: "Site Name" },
                { key: "tagline", label: "Tagline" },
                { key: "logo_url", label: "Logo URL", full: true },
                { key: "favicon_url", label: "Favicon URL", full: true },
                { key: "meta_title", label: "Default Meta Title", full: true },
                { key: "meta_description", label: "Default Meta Description", rows: 3, full: true },
            ]}
        />
    );
}
