import React from "react";
import { SingletonEditor } from "./_helpers";

export default function AboutEditor() {
    return (
        <SingletonEditor eyebrow="About" title="About Page" subtitle="Story, mission, vision and core values."
            getUrl="/cms/about" putUrl="/admin/about"
            fields={[
                { key: "title", label: "Page Title", full: true },
                { key: "subtitle", label: "Subtitle", rows: 2, full: true },
                { key: "story", label: "Story", rows: 5, full: true },
                { key: "mission", label: "Mission", rows: 3, full: true },
                { key: "vision", label: "Vision", rows: 3, full: true },
            ]}
            arrayFields={[
                { key: "values", label: "Core Values", subtitle: "What the studio stands on", template: { title: "", description: "" },
                    fields: [{ key: "title", label: "Title", span: 4 }, { key: "description", label: "Description", rows: 2, span: 7 }] },
            ]}
        />
    );
}
