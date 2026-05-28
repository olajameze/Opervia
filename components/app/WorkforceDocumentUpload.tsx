"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type DocumentItem = {
  id: string;
  label: string;
  fileName: string;
  blobUrl: string;
};

export function WorkforceDocumentUpload({
  staffProfileId,
  freelancerProfileId,
  documents = [],
}: {
  staffProfileId?: string;
  freelancerProfileId?: string;
  documents?: DocumentItem[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState("CV");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upload() {
    if (!file) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("label", label);
    if (staffProfileId) formData.append("staffProfileId", staffProfileId);
    if (freelancerProfileId) formData.append("freelancerProfileId", freelancerProfileId);

    const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Upload failed");
      return;
    }
    setFile(null);
    router.refresh();
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-sm font-medium">Documents</p>
      {documents.length > 0 && (
        <ul className="space-y-1 text-sm">
          {documents.map((doc) => (
            <li key={doc.id}>
              <a href={doc.blobUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {doc.label}: {doc.fileName}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-9 rounded-md border px-2 text-sm"
          aria-label="Document type"
        >
          <option value="CV">CV</option>
          <option value="Insurance">Insurance</option>
          <option value="Passport">Passport</option>
          <option value="Other">Other</option>
        </select>
        <label htmlFor="workforce-document-file" className="sr-only">
          Document file
        </label>
        <input
          id="workforce-document-file"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-label="Document file"
        />
        <Button type="button" size="sm" onClick={() => void upload()} disabled={!file || loading}>
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
