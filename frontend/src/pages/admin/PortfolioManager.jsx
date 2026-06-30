import React from "react";
import { CollectionManager } from "./_helpers";

export default function PortfolioManager() {
    return (
        <CollectionManager eyebrow="Portfolio" title="Portfolio Projects" subtitle="Each project lives at /portfolio/{slug}." endpoint="portfolio"
            defaultItem={{ title: "", slug: "", client: "", category: "", industry: "", year: "", summary: "", challenge: "", strategy: "", execution: "", results: "", cover_image: "", gallery: "", published: true, featured: false, order: 0 }}
            fields={[
                { key: "title", label: "Title" },
                { key: "slug", label: "Slug" },
                { key: "client", label: "Client" },
                { key: "category", label: "Category", hint: "e.g. Brand Identity, Website Design" },
                { key: "industry", label: "Industry" },
                { key: "year", label: "Year" },
                { key: "summary", label: "Summary", rows: 2, full: true },
                { key: "cover_image", label: "Cover Image URL", full: true },
                { key: "challenge", label: "Challenge", rows: 4, full: true },
                { key: "strategy", label: "Strategy", rows: 4, full: true },
                { key: "execution", label: "Execution", rows: 4, full: true },
                { key: "results", label: "Results", rows: 3, full: true },
                { key: "gallery", label: "Gallery URLs (one per line)", rows: 5, full: true },
            ]}
        />
    );
}
