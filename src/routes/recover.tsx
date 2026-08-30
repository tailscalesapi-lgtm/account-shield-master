import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Upload, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { MAX_UPLOAD_BYTES, SERVICE_TYPES } from "@/lib/recovery-shared";
import { submitRecoveryRequest } from "@/lib/recovery.functions";

export const Route = createFileRoute("/recover")({
  head: () => ({
    meta: [
      { title: "Submit a Locked File — passwordrecovery.io" },
      {
        name: "description",
        content:
          "Upload a password-protected Office, LibreOffice, PDF or archive file and receive a tracking code to follow your recovery request.",
      },
      { property: "og:title", content: "Submit a Locked File for Recovery" },
      {
        property: "og:description",
        content:
          "Upload your protected document and track the recovery with a private tracking code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecoverPage,
});

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

function RecoverPage() {
  const submit = useServerFn(submitRecoveryRequest);
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[0].value);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      toast.error("Choose a file to upload.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Files must be 50MB or smaller.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const path = `uploads/${crypto.randomUUID()}/${sanitizeName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("recovery-uploads")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const result = await submit({
        data: {
          email: email.trim(),
          serviceType,
          fileName: file.name.slice(0, 255),
          filePath: path,
          userNotes: notes.trim() || undefined,
        },
      });
      setCode(result.trackingCode);
      toast.success("Request submitted.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-foreground">
            password<span className="text-primary">recovery</span>
            <span className="text-primary">.io</span>
          </Link>
          <Link to="/track" className="text-sm text-muted-foreground hover:text-foreground">
            Track a request
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Submit a locked file
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Upload the protected document. Our analysts process it manually and publish
          the result — including the unlocked file — against your private tracking code.
        </p>

        {code ? (
          <div className="mt-10 rounded-xl border border-border bg-card p-8">
            <div className="flex size-11 items-center justify-center rounded-md bg-accent">
              <CheckCircle2 className="size-5 text-accent-foreground" />
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold text-foreground">
              Request received
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save this tracking code — it is the only way to retrieve your result.
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-md border border-border bg-muted px-4 py-3">
              <span className="font-mono text-lg font-semibold tracking-widest text-foreground">
                {code}
              </span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(code);
                  toast.success("Copied");
                }}
                className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Copy className="size-3.5" /> Copy
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/track" search={{ code }} className="btn-primary">
                Track this request
              </Link>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setCode(null);
                  setFile(null);
                  setNotes("");
                }}
              >
                Submit another file
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-6 rounded-xl border border-border bg-card p-8">
            <div>
              <label htmlFor="file" className="text-sm font-medium text-foreground">
                Protected file
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-md border border-dashed border-border bg-muted px-4 py-6">
                <Upload className="size-5 text-muted-foreground" />
                <input
                  id="file"
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                />
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">MAX 50MB</p>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="service" className="text-sm font-medium text-foreground">
                File type
              </label>
              <select
                id="service"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                {SERVICE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="text-sm font-medium text-foreground">
                Notes <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="notes"
                rows={4}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you remember about the password, software version, etc."
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
              <Lock className="size-4" />
              {busy ? "Uploading…" : "Submit for recovery"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
