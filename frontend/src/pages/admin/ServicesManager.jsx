import React from "react";
import { CollectionManager } from "./_helpers";

export default function ServicesManager() {
    return (
        <CollectionManager eyebrow="Services" title="Services" subtitle="Each service has its own public page at /services/{slug}." endpoint="services"
            defaultItem={{ title: "", slug: "", short_description: "", description: "", cover_image: "", benefits: "", deliverables: "", published: true, order: 0 }}
            fields={[
                { key: "title", label: "Title" },
                { key: "slug", label: "Slug", hint: "URL-friendly identifier, e.g. brand-identity" },
                { key: "short_description", label: "Short Description", rows: 2, full: true },
                { key: "description", label: "Long Description", rows: 5, full: true },
                { key: "cover_image", label: "Cover Image URL", full: true },
                { key: "benefits", label: "Benefits (one per line)", rows: 4 },
                { key: "deliverables", label: "Deliverables (one per line)", rows: 4 },
            ]}
        />
    );
}
