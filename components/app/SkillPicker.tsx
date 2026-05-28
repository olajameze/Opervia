"use client";

import { useEffect, useState } from "react";

export function SkillPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (skills: string[]) => void;
}) {
  const [catalog, setCatalog] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCatalog(
            data.map((item) => (typeof item === "string" ? item : item.name)).filter(Boolean)
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleSkill(skill: string) {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill));
    } else {
      onChange([...value, skill]);
    }
  }

  async function addSkill() {
    const name = newSkill.trim();
    if (!name) return;
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setCatalog((prev) => [...prev, name].sort());
      onChange([...value, name]);
      setNewSkill("");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading skills...</p>;
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <span className="text-sm font-medium">Skills</span>
      <div className="flex flex-wrap gap-2 rounded-md border p-3">
        {catalog.map((skill) => (
          <label key={skill} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(skill)}
              onChange={() => toggleSkill(skill)}
              className="rounded border-input"
            />
            {skill}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add new skill to catalog"
          className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button
          type="button"
          onClick={() => void addSkill()}
          className="rounded-md border px-3 text-sm hover:bg-muted"
        >
          Add
        </button>
      </div>
    </div>
  );
}
