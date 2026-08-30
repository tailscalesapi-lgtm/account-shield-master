import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2, Download, KeyRound, FileCheck2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { STATUS_LABELS } from "@/lib/recovery-shared";
import { getRecoveryStatus } from "@/lib/recovery.functions";

const searchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Track a Recovery Request — passwordrecovery.io" },
      {
        name: "description",
        content:
          "Enter your private tracking code to check the status of your password recovery request and download the unlocked file.",
      },
      { property: "og:title", content: "Track a Recovery Request" },
      {
        property: "og:description",
        content: "Check recovery status and retrieve your unlocked file with your tracking code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

type RecoveryResult = Awaited<ReturnType<typeof getRecoveryStatus>>;

function TrackPage() {
  const { code: initialCode } = Route.useSearch();
  const lookup = useServerFn(getRecoveryStatus);
  const [code, setCode] = useState(initialCode ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);
  const [searched, setSearched] = useState(false);

  async function runLookup(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 4) {
      toast.error("Enter your full tracking code.");
      return;
    }
    setBusy(true);
    try {
      const data = await lookup({ data: { trackingCode: trimmed } });
      setResult(data);
      setSearched(true);
      if (!data) toast.error("No request found for that code.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialCode) void runLookup(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-foreground">
            password<span className="text-primary">recovery</span>
            <span className="text-primary">.io</span>
          </Link>
          <Link to="/recover" className="text-sm text-muted-foreground hover:text-foreground">
            Submit a file
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Track your request
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Enter the tracking code you received when submitting your file.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runLookup(code);
          }}
          className="mt-8 flex gap-3"
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="PR-XXXX-XXXX"
            maxLength={40}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm tracking-widest text-foreground outline-none focus:border-primary"
          />
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Look up
          </button>
        </form>

        {searched && result && (
          <div className="mt-10 rounded-xl border border-border bg-card p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {result.trackingCode}
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
                  {result.fileName}
                </h2>
              </div>
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {STATUS_LABELS[result.status] ?? result.status}
              </span>
            </div>

            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="mt-0.5 text-foreground">
                  {new Date(result.createdAt).toLocaleString()}
                </dd>
              </div>
              {result.completedAt && (
                <div>
                  <dt className="text-muted-foreground">Completed</dt>
                  <dd className="mt-0.5 text-foreground">
                    {new Date(result.completedAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>

            {result.adminNotes && (
              <div className="mt-6 rounded-md border border-border bg-muted px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Analyst notes
                </p>
                <p className="mt-1.5 text-sm text-foreground">{result.adminNotes}</p>
              </div>
            )}

            {result.status === "completed" && (
              <div className="mt-6 space-y-4">
                {result.recoveredPassword && (
                  <div className="flex items-center gap-3 rounded-md border border-border bg-muted px-4 py-3">
                    <KeyRound className="size-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Recovered password
                      </p>
                      <p className="font-mono text-sm font-semibold text-foreground">
                        {result.recoveredPassword}
                      </p>
                    </div>
                  </div>
                )}
                {result.resultUrl && (
                  <a
                    href={result.resultUrl}
                    download={result.resultFileName ?? true}
                    className="btn-primary"
                  >
                    <Download className="size-4" />
                    Download unlocked file
                    {result.resultFileName ? ` (${result.resultFileName})` : ""}
                  </a>
                )}
              </div>
            )}

            {result.status === "failed" && (
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <FileCheck2 className="size-4" />
                This file could not be recovered with the available methods.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
