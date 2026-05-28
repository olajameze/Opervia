"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SkillItem = { id: string; name: string };

export function SkillsConfigPanel() {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSkills() {
    const res = await fetch("/api/skills");
    const data = await res.json();
    if (Array.isArray(data)) setSkills(data);
  }

  useEffect(() => {
    void loadSkills().finally(() => setLoading(false));
  }, []);

  async function addSkill() {
    const name = newSkill.trim();
    if (!name) return;
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setNewSkill("");
      await loadSkills();
      router.refresh();
    }
  }

  async function removeSkill(id: string) {
    const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadSkills();
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills catalog</CardTitle>
        <CardDescription>
          Configure fixed skills that staff and freelancers can select when building profiles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading skills...</p>
        ) : (
          <ul className="space-y-2">
            {skills.map((skill) => (
              <li key={skill.id} className="flex items-center justify-between text-sm border-b pb-2">
                <span>{skill.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => void removeSkill(skill.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="New skill name"
            className="flex h-10 flex-1 rounded-md border px-3 text-sm"
          />
          <Button type="button" onClick={() => void addSkill()}>Add skill</Button>
        </div>
      </CardContent>
    </Card>
  );
}
