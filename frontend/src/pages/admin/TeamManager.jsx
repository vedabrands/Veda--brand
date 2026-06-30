import React from "react";
import { CollectionManager } from "./_helpers";

export default function TeamManager() {
    return (
        <CollectionManager eyebrow="Team" title="Team Members" subtitle="Shown on the About page." endpoint="team"
            defaultItem={{ name: "", position: "", bio: "", photo: "", email: "", linkedin: "", instagram: "", published: true, order: 0 }}
            fields={[
                { key: "name", label: "Name" },
                { key: "position", label: "Position" },
                { key: "photo", label: "Photo URL", full: true },
                { key: "bio", label: "Short Bio", rows: 3, full: true },
                { key: "email", label: "Email" },
                { key: "linkedin", label: "LinkedIn URL" },
                { key: "instagram", label: "Instagram URL" },
            ]}
        />
    );
}
