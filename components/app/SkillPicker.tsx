"use client";

import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export function SkillPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (skills: string[]) => void;
}) {
  const selectId = useId();
  const newSkillId = useId();
  const [catalog, setCatalog] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingSkill, setPendingSkill] = useState("");

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

  const availableSkills = catalog.filter((skill) => !value.includes(skill));

  function addSkill(skill: string) {
    if (!skill || value.includes(skill)) return;
    onChange([...value, skill]);
    setPendingSkill("");
  }

  function removeSkill(skill: string) {
    onChange(value.filter((s) => s !== skill));
  }

  async function addNewSkillToCatalog() {
    const name = newSkill.trim();
    if (!name) return;
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setCatalog((prev) => [...prev, name].sort());
      addSkill(name);
      setNewSkill("");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading skills...</p>;
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <label htmlFor={selectId} className="text-sm font-medium">
        Skills
      </label>
      <select
        id={selectId}
        value={pendingSkill}
        onChange={(e) => {
          const skill = e.target.value;
          setPendingSkill(skill);
          if (skill) addSkill(skill);
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        aria-label="Select skills"
      >
        <option value="">Select a skill...</option>
        {availableSkills.map((skill) => (
          <option key={skill} value={skill}>
            {skill}
          </option>
        ))}
      </select>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <Badge key={skill} variant="secondary" className="gap-1 pr-1">
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="rounded p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <label htmlFor={newSkillId} className="sr-only">
          Add new skill to catalog
        </label>
        <input
          id={newSkillId}
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add new skill to catalog"
          className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button
          type="button"
          onClick={() => void addNewSkillToCatalog()}
          className="rounded-md border px-3 text-sm hover:bg-muted"
        >
          Add
        </button>
      </div>
    </div>
  );
}
