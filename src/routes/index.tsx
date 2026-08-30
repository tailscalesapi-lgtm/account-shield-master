import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Newspaper,
  FolderArchive,
  Fingerprint,
  ListOrdered,
  Terminal,
  Lock,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "passwordrecovery.io — Cryptographic Password Recovery" },
      {
        name: "description",
        content:
          "Recover access to locked Office documents, LibreOffice files, ZIP and RAR archives, and hashed passwords. Corporate-grade tooling, zero data retention.",
      },
      { property: "og:title", content: "passwordrecovery.io — Restore Access with Structural Precision" },
      {
        property: "og:description",
        content:
          "Cryptographic recovery for locked documents, archives, and hashes. Engineered for corporate and forensic users.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NAV_LINKS = [
  "Office",
  "LibreOffice",
  "zip / rar",
  "md5",
  "sha1",
  "sha256",
  "sha512",
  "cisco",
  "Security",
];

const PROTOCOLS = [
  {
    icon: FileText,
    title: "Office Documents",
    desc: "Microsoft Word, Excel, PowerPoint — .doc, .docx, .xls, .xlsx, .ppt, .pptx",
  },
  {
    icon: Newspaper,
    title: "LibreOffice",
    desc: "OpenDocument formats — .odt, .ods, .odp, .odg",
  },
  {
    icon: FolderArchive,
    title: "Archives",
    desc: "Compressed archives — .zip, .rar",
  },
  {
    icon: Fingerprint,
    title: "Hash Lookup",
    desc: "MD5, SHA-1, SHA-256, SHA-512, Cisco Type 7",
  },
  {
    icon: ListOrdered,
    title: "Example Hashes",
    desc: "Reference catalogue of hash formats and examples",
  },
  {
    icon: Terminal,
    title: "Tutorials",
    desc: "Practical tips for John the Ripper and Hashcat",
  },
];

const STATS = [
  { value: "99.4%", label: "Success Rate" },
  { value: "< 15m", label: "Avg. Resolution" },
  { value: "AES-256", label: "Secure Environment" },
];

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-display text-lg font-bold tracking-tight text-foreground">
          password<span className="text-primary">recovery</span>
          <span className="text-primary">.io</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#protocols"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link}
            </a>
          ))}
        </nav>
        <Link to="/recover" className="btn-primary hidden sm:inline-flex">
          Start Recovery
        </Link>
      </div>
    </header>
  );
}

function TerminalCard() {
  return (
    <div className="relative">
      {/* floating connection badge */}
      <div className="absolute -bottom-6 -left-6 z-10 flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xl">
        <div className="flex size-9 items-center justify-center rounded-md bg-accent">
          <ShieldCheck className="size-4 text-accent-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-xs text-muted-foreground">Connection</p>
          <p className="text-sm font-semibold text-foreground">Encrypted</p>
        </div>
      </div>

      <div className="scanline rounded-xl border border-border bg-card/90 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-primary/60" />
          </div>
          <span className="font-mono text-xs tracking-widest text-terminal-ink">
            SYS_NODE_ALPHA
          </span>
        </div>
        <div className="flex h-56 flex-col items-center justify-center gap-4 px-8">
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2">
              <span className="font-mono text-xs text-muted-foreground">
                Analyzing Entropy…
              </span>
              <span className="font-mono text-xs font-semibold text-foreground">78%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-terminal"
                style={{ width: "78%" }}
              />
            </div>
          </div>
        </div>
        <div className="border-t border-border px-5 py-3 text-right">
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
            STATUS: NOMINAL
          </span>
        </div>
      </div>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="hero-glow relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 pb-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-1.5">
              <span className="pulse-dot size-2 rounded-full bg-primary" />
              <span className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
                KINETIC PROTOCOL ACTIVE
              </span>
            </div>

            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Restore Access with{" "}
              <span className="text-primary">Structural Precision.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Cryptographic recovery for locked Microsoft Office documents,
              LibreOffice files, ZIP and RAR archives, and hashed passwords.
              Engineered for corporate and forensic users — zero data retention.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/recover" className="btn-primary">
                <Lock className="size-4" />
                Initiate Recovery
              </Link>
              <a href="#protocols" className="btn-outline">
                Security Methodology
              </a>
            </div>
          </div>

          <div className="hidden lg:block">
            <TerminalCard />
          </div>
        </div>

        {/* Stats */}
        <div className="border-t border-border/70">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protocols */}
      <section id="protocols" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Recovery Protocols
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOCOLS.map((protocol) => (
            <Link
              key={protocol.title}
              to="/recover"
              className="group rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-md bg-accent">
                  <protocol.icon className="size-5 text-accent-foreground" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                {protocol.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {protocol.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="start" className="border-t border-border/70">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Regain access. Retain nothing.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Upload a locked file and let the recovery pipeline do the rest.
            Files are processed in memory and never stored.
          </p>
          <Link to="/recover" className="btn-primary mt-8">
            <Lock className="size-4" />
            Start Recovery
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <p className="font-display text-sm font-bold text-foreground">
            password<span className="text-primary">recovery</span>
            <span className="text-primary">.io</span>
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Zero retention. Full control.
          </p>
        </div>
      </footer>
    </div>
  );
}
