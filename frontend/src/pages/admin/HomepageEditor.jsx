import React from "react";
import { SingletonEditor } from "./_helpers";

export default function HomepageEditor() {
    return (
        <SingletonEditor eyebrow="Homepage" title="Homepage Editor" subtitle="Hero, statistics, why-points and process steps."
            getUrl="/cms/homepage" putUrl="/admin/homepage"
            fields={[
                { key: "hero_eyebrow", label: "Hero Eyebrow", full: true },
                { key: "hero_title", label: "Hero Title", full: true },
                { key: "hero_subtitle", label: "Hero Subtitle", rows: 3, full: true },
                { key: "hero_cta_primary", label: "Primary CTA" },
                { key: "hero_cta_secondary", label: "Secondary CTA" },
            ]}
            arrayFields={[
                { key: "stats", label: "Statistics", subtitle: "Animated counters under the hero", template: { label: "", value: "" },
                    fields: [{ key: "value", label: "Value (e.g. 240+ or 98%)", span: 4 }, { key: "label", label: "Label", span: 7 }] },
                { key: "why_points", label: "Why Choose Us", subtitle: "Trust-building points", template: { title: "", description: "" },
                    fields: [{ key: "title", label: "Title", span: 4 }, { key: "description", label: "Description", rows: 2, span: 7 }] },
                { key: "process", label: "Process", subtitle: "Five-stage workflow", template: { step: "", title: "", description: "" },
                    fields: [{ key: "step", label: "Step", span: 2 }, { key: "title", label: "Title", span: 3 }, { key: "description", label: "Description", rows: 2, span: 6 }] },
            ]}
        />
    );
}
