"use client";

import {
  Apple,
  ArrowRight,
  Check,
  Code2,
  Download,
  GraduationCap,
  Laptop,
  Monitor,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { API_BASE } from "@/lib/api/base";
import { detectPlatform, PLATFORM_OPTIONS, type DesktopPlatform } from "@/lib/downloads";

interface LatestRelease {
  version: string;
  publishedAt: string;
  platforms: Record<string, { fileName: string; sizeBytes: number } | null>;
}

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Explorers course",
    text: "A free, interactive first course on AI for Class 4–5: what AI is, how it learns, LLMs and using AI safely — with an activity and a quiz in every lesson.",
  },
  {
    icon: Code2,
    title: "Coding challenges",
    text: "Practice problems with a real code editor, smart suggestions and a Run button that checks Python against sample tests — even offline.",
  },
  {
    icon: GraduationCap,
    title: "Built for teachers",
    text: "Post MCQ, written and coding questions, build assignments and tests, then review and release grades from one console.",
  },
  {
    icon: ShieldCheck,
    title: "Safe by design",
    text: "Every school's data is isolated in the database. Students only see their own work; teachers only their classes.",
  },
];

const STEPS = [
  { title: "Download the app", text: "Pick your computer — Windows, Mac or Linux." },
  { title: "Sign in", text: "Use the account your school or teacher gave you." },
  { title: "Start learning", text: "Take the AI course and solve your first challenge." },
];

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PlatformIcon({ platform, className }: { platform: DesktopPlatform; className?: string }) {
  if (platform === "macos") return <Apple className={className} aria-hidden />;
  if (platform === "linux") return <Terminal className={className} aria-hidden />;
  return <Monitor className={className} aria-hidden />;
}

export function Landing() {
  const [open, setOpen] = React.useState(false);
  const [detected, setDetected] = React.useState<DesktopPlatform>("windows");
  const [selected, setSelected] = React.useState<DesktopPlatform>("windows");
  const [release, setRelease] = React.useState<LatestRelease | null>(null);
  const [started, setStarted] = React.useState<DesktopPlatform | null>(null);

  React.useEffect(() => {
    const platform = detectPlatform(navigator.userAgent, navigator.platform);
    setDetected(platform);
    setSelected(platform);
    fetch(`${API_BASE}/api/downloads/latest`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LatestRelease | null) => setRelease(data))
      .catch(() => setRelease(null));
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function openDownload() {
    setStarted(null);
    setSelected(detected);
    setOpen(true);
  }

  function startDownload(platform: DesktopPlatform) {
    setStarted(platform);
    window.location.href = `${API_BASE}/api/downloads/latest/${platform}`;
  }

  const option = PLATFORM_OPTIONS.find((o) => o.id === selected)!;
  const asset = release?.platforms[option.asset];

  return (
    <div className="bg-background text-foreground min-h-dvh">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-white">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-xs font-bold">
              LP
            </span>
            L Platform
          </Link>
          <nav className="text-sidebar-foreground/80 hidden gap-6 text-sm md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <a href="#download" className="hover:text-white">
              Download
            </a>
          </nav>
          <Link
            href="/login"
            className="text-sidebar-foreground/90 ml-auto text-sm font-medium hover:text-white"
          >
            School & teacher sign in
          </Link>
        </div>

        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-14 pb-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sidebar-primary mb-3 text-sm font-semibold tracking-wide uppercase">
              For students · Class 4 and up
            </p>
            <h1 className="text-4xl leading-tight font-semibold text-white md:text-5xl">
              Get AI-ready. Learn to code. Have fun doing it.
            </h1>
            <p className="text-sidebar-foreground/80 mt-5 max-w-xl text-lg">
              L Platform is a free desktop app with a beginner AI course, hands-on coding challenges
              and tests from your teachers.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openDownload}
                className="bg-primary text-primary-foreground inline-flex h-12 items-center gap-2 rounded-md px-6 text-base font-semibold hover:opacity-95"
              >
                <Download className="size-5" aria-hidden /> Download for free
              </button>
              <a
                href="#features"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/20 px-5 text-sm font-medium text-white hover:bg-white/5"
              >
                See what&apos;s inside <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
            <p className="text-sidebar-muted mt-4 text-xs">
              Windows · macOS · Linux{release ? ` · Version ${release.version}` : ""}
            </p>
          </div>

          <div
            aria-hidden
            className="rounded-xl border border-white/10 bg-[#151d2a] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-green-400/70" />
              <span className="ml-2">Sum of Two Integers · Easy</span>
            </div>
            <pre className="rounded-md bg-[#0b111b] p-4 font-mono text-sm leading-6 text-slate-200">
              <span className="text-sky-300">a</span>, <span className="text-sky-300">b</span> ={" "}
              <span className="text-amber-300">map</span>(int, input().split()){"\n"}
              <span className="text-amber-300">print</span>(a + b)
            </pre>
            <div className="mt-4 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              <Check className="mr-1.5 inline size-4" /> 2/2 sample tests passed
            </div>
          </div>
        </section>
      </header>

      <main>
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold">Everything a young learner needs</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            One app for learning, practice and assessment — designed with schools.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="surface p-6">
                <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-md">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-6">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="border-border border-y bg-white/60 dark:bg-transparent">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-semibold">Start in three steps</h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="surface p-6">
                  <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="download" className="mx-auto max-w-6xl px-6 py-20 text-center">
          <Laptop className="text-primary mx-auto size-10" aria-hidden />
          <h2 className="mt-4 text-3xl font-semibold">Download L Platform</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl">
            Free for students. Works on Windows 10/11, macOS 11+ and Linux.
          </p>
          <button
            type="button"
            onClick={openDownload}
            className="bg-primary text-primary-foreground mt-8 inline-flex h-12 items-center gap-2 rounded-md px-7 text-base font-semibold hover:opacity-95"
          >
            <Download className="size-5" aria-hidden /> Download the app
          </button>
          <div className="text-muted-foreground mx-auto mt-10 grid max-w-3xl gap-4 text-left text-sm md:grid-cols-2">
            <div className="surface p-5">
              <p className="text-foreground font-semibold">Windows says “protected your PC”?</p>
              <p className="mt-1">Click More info → Run anyway. The installer is safe.</p>
            </div>
            <div className="surface p-5">
              <p className="text-foreground font-semibold">Mac blocks the app?</p>
              <p className="mt-1">
                System Settings → Privacy &amp; Security → Open Anyway, then open the app again.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-border text-muted-foreground border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm">
          <span>© {new Date().getFullYear()} L Platform</span>
          <Link href="/login" className="hover:text-foreground">
            School & teacher sign in
          </Link>
        </div>
      </footer>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-title"
            className="bg-card w-full max-w-md rounded-xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="download-title" className="text-xl font-semibold">
                  Which computer do you use?
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  We picked the one we think you have.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:bg-muted rounded-md p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-2" role="radiogroup" aria-label="Operating system">
              {PLATFORM_OPTIONS.map((o) => {
                const active = selected === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelected(o.id)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      active ? "border-primary bg-accent" : "border-border hover:bg-muted"
                    }`}
                  >
                    <PlatformIcon platform={o.id} className="size-5" />
                    <span className="flex-1">
                      <span className="block font-medium">{o.label}</span>
                      <span className="text-muted-foreground block text-xs">{o.hint}</span>
                    </span>
                    {o.id === detected && (
                      <span className="text-primary text-xs font-semibold">Recommended</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => startDownload(selected)}
              className="bg-primary text-primary-foreground mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md font-semibold hover:opacity-95"
            >
              <Download className="size-4" aria-hidden /> Download for {option.label}
              {asset ? ` · ${formatSize(asset.sizeBytes)}` : ""}
            </button>

            {started && (
              <p className="text-muted-foreground mt-4 text-sm" role="status">
                Your download is starting… {option.afterDownload}
              </p>
            )}
            {release === null && (
              <p className="text-muted-foreground mt-3 text-xs">
                Can&apos;t reach the download server? Try again in a minute.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
