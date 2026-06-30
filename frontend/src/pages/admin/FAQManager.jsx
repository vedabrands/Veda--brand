import React from "react";
import { CollectionManager } from "./_helpers";

export default function FAQManager() {
    return (
        <CollectionManager eyebrow="FAQ" title="Frequently Asked Questions" subtitle="Shown on the homepage and service pages." endpoint="faq"
            defaultItem={{ question: "", answer: "", category: "", published: true, order: 0 }}
            fields={[
                { key: "question", label: "Question", full: true },
                { key: "answer", label: "Answer", rows: 5, full: true },
                { key: "category", label: "Category (optional)" },
            ]}
        />
    );
}
