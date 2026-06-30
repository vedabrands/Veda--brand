import React from "react";
import { CollectionManager } from "./_helpers";

export default function TestimonialsManager() {
    return (
        <CollectionManager eyebrow="Testimonials" title="Testimonials" subtitle="Quotes from clients displayed across the site." endpoint="testimonials"
            defaultItem={{ name: "", role: "", company: "", quote: "", photo: "", rating: 5, published: true, order: 0 }}
            fields={[
                { key: "name", label: "Client Name" },
                { key: "role", label: "Role" },
                { key: "company", label: "Company" },
                { key: "rating", label: "Rating (1-5)", type: "number" },
                { key: "photo", label: "Photo URL", full: true },
                { key: "quote", label: "Quote", rows: 4, full: true },
            ]}
        />
    );
}
