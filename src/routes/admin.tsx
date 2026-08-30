import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldCheck,
  Loader2,
  LogOut,
  RefreshCw,
  Download,
  Upload,
  Lock,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { RECOVERY_STATUSES, STATUS_LABELS } from "@/lib/recovery-shared";
import {
  checkIsAdmin,
  listRecoveryRequests,
  updateRecoveryRequest,
  getUploadDownloadUrl,
} from "@/lib/recovery.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — passwordrecovery.io" },
      { name: "description", content: "Administrative console for managing recovery requests." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type RecoveryRow = Awaited<ReturnType<typeof listRecoveryRequests>>[number];

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

function AdminPage() {
  const checkAdmin = useServerFn(checkIsAdmin);
  const listRequests = useServerFn(listRecoveryRequests);
  const updateRequest = useServerFn(updateRecoveryRequest);
  const getDownloadUrl = useServerFn(getUploadDownloadUrl);

  const [authState, setAuthState] = useState<"loading" | "signed-out" | "denied" | "admin">(
    "loading",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<RecoveryRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [recoveredPassword, setRecoveredPassword] = useState("");
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const loadRows = useCallback(async () => {
    try {
      const data = await listRequests();
      setRows(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load requests.");
    }
  }, [listRequests]);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) setAuthState("signed-out");
        return;
      }
      try {
        const res = await checkAdmin();
        if (cancelled) return;
        setAuthState(res.isAdmin ? "admin" : "denied");
        if (res.isAdmin) void loadRows();
      } catch {
        if (!cancelled) setAuthState("signed-out");
      }
    }
    void verify();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void verify());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [checkAdmin, loadRows]);

  function selectRow(row: RecoveryRow) {
    setSelectedId(row.id);
    setStatus(row.status);
    setAdminNotes(row.admin_notes ?? "");
    setRecoveredPassword(row.recovered_password ?? "");
    setResultFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else toast.success("Account created. Check your email to confirm, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) toast.error(error.message);
    }
    setBusy(false);
  }

  async function handleDownloadUpload(filePath: string) {
    try {
      const { url } = await getDownloadUrl({ data: { filePath } });
      window.open(url, "_blank", "noopener");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    }
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      let resultFilePath: string | undefined;
      let resultFileName: string | undefined;
      if (resultFile) {
        resultFilePath = `results/${selected.tracking_code}/${crypto.randomUUID()}/${sanitizeName(resultFile.name)}`;
        resultFileName = resultFile.name.slice(0, 255);
        const { error: uploadError } = await supabase.storage
          .from("recovery-results")
          .upload(resultFilePath, resultFile, { upsert: false });
        if (uploadError) throw uploadError;
      }
      await updateRequest({
        data: {
          id: selected.id,
          status: status as (typeof RECOVERY_STATUSES)[number],
          adminNotes: adminNotes.trim() || undefined,
          recoveredPassword: recoveredPassword.trim() || undefined,
          resultFilePath,
          resultFileName,
        },
      });
      toast.success("Request updated.");
      await loadRows();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authState === "signed-out") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <form
          onSubmit={handleSignIn}
          className="w-full max-w-sm rounded-xl border border-border bg-card p-8"
        >
          <div className="flex size-11 items-center justify-center rounded-md bg-accent">
            <Lock className="size-5 text-accent-foreground" />
          </div>
          <h1 className="mt-5 font-display text-xl font-semibold text-foreground">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Restricted to authorized administrators.
          </p>
          <input
            type="email"
            required
            placeholder="admin@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-6 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <button type="submit" disabled={busy} className="btn-primary mt-5 w-full justify-center disabled:opacity-60">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Sign in
          </button>
          <Link
            to="/"
            className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Back to site
          </Link>
        </form>
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-xl font-semibold text-foreground">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account does not have administrator privileges.
          </p>
          <button
            onClick={() => void supabase.auth.signOut()}
            className="btn-outline mt-6"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-foreground">
            password<span className="text-primary">recovery</span>
            <span className="text-primary">.io</span>
            <span className="ml-2 rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => void loadRows()} className="btn-outline !px-3 !py-1.5 text-xs">
              <RefreshCw className="size-3.5" /> Refresh
            </button>
            <button
              onClick={() => void supabase.auth.signOut()}
              className="btn-outline !px-3 !py-1.5 text-xs"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1fr_1.2fr]">
        {/* Request list */}
        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-base font-semibold text-foreground">
              Recovery requests ({rows.length})
            </h2>
          </div>
          <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
            {rows.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                No requests yet.
              </li>
            )}
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  onClick={() => selectRow(row)}
                  className={`w-full px-5 py-4 text-left transition-colors hover:bg-muted/60 ${
                    selectedId === row.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-foreground">
                      {row.file_name}
                    </span>
                    <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
                      {row.tracking_code}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Detail / editor */}
        <section className="rounded-xl border border-border bg-card p-6">
          {!selected ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Select a request to review it.
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {selected.tracking_code}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-foreground">
                  {selected.file_name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.email} · {selected.service_type}
                </p>
              </div>

              {selected.user_notes && (
                <div className="rounded-md border border-border bg-muted px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    User notes
                  </p>
                  <p className="mt-1 text-sm text-foreground">{selected.user_notes}</p>
                </div>
              )}

              <button
                onClick={() => void handleDownloadUpload(selected.file_path)}
                className="btn-outline !py-2 text-xs"
              >
                <Download className="size-3.5" /> Download uploaded file
              </button>

              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  {RECOVERY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Admin notes</label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Recovered password</label>
                <input
                  maxLength={500}
                  value={recoveredPassword}
                  onChange={(e) => setRecoveredPassword(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Result file <span className="text-muted-foreground">(unlocked file)</span>
                </label>
                {selected.result_file_name && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current: {selected.result_file_name}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 rounded-md border border-dashed border-border bg-muted px-4 py-4">
                  <Upload className="size-4 text-muted-foreground" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setResultFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                  />
                </div>
              </div>

              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="btn-primary disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Save changes
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
