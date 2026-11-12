"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS, SHOW_DEMO_ACCOUNTS, authService, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";

const FEATURES = [
  {
    icon: Users,
    title: "User Management",
    description: "Manage administrators, teachers, students and section rosters.",
  },
  {
    icon: BookOpen,
    title: "Classes & Courses",
    description: "Organize schools, sections, AI Readiness courses and allocations.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Track onboarding, course completion and assessment results.",
  },
  {
    icon: Settings,
    title: "Organization Policies",
    description: "Strict multi-tenant isolation with structured audit logging.",
  },
];

function PortalMiniPreview() {
  return (
    <div
      aria-hidden
      className="border-border/80 relative overflow-hidden rounded-2xl border bg-[#0d1426]/95 p-4 shadow-2xl shadow-violet-950/50"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="lp-gradient-bg flex size-5 items-center justify-center rounded-md text-[10px] font-bold text-white">
            LP
          </span>
          <span className="text-xs font-semibold text-slate-200">Organization Overview</span>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
          PostgreSQL Live
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Students", val: "642" },
          { label: "Teachers", val: "28" },
          { label: "Classes", val: "12" },
          { label: "Courses", val: "18" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[#1f2c47] bg-[#131c33] px-2.5 py-2"
          >
            <p className="text-sm font-bold text-white tabular-nums">{stat.val}</p>
            <p className="text-[10px] text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-[#1f2c47] bg-[#11192e] p-3">
        <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-400">
          <span>Learning Activity</span>
          <span>Last 30 days</span>
        </div>
        <svg viewBox="0 0 280 54" className="h-12 w-full">
          <defs>
            <linearGradient id="loginPreviewArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,46 Q40,36 72,38 T140,24 T210,18 T280,10 L280,54 L0,54 Z"
            fill="url(#loginPreviewArea)"
          />
          <path
            d="M0,46 Q40,36 72,38 T140,24 T210,18 T280,10"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const session = await authService.login(values.email, values.password);
      toast.success("Signed in successfully.");
      const requested = searchParams.get("next");
      let destination = "/admin/dashboard";
      if (session.role === "TEACHER") {
        destination = requested?.startsWith("/teacher") ? requested : "/teacher/dashboard";
      } else if (session.role === "PLATFORM_DEVELOPER") {
        destination =
          requested &&
          (requested.startsWith("/admin/courses") || requested.startsWith("/admin/reports"))
            ? requested
            : "/admin/courses";
      } else {
        destination = requested?.startsWith("/admin") ? requested : "/admin/dashboard";
      }
      router.replace(destination);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  function fillDemoAccount(index: number) {
    if (process.env.NODE_ENV === "production") return;
    const account = DEMO_ACCOUNTS[index];
    if (!account) return;
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
    clearErrors();
    setFormError(null);
  }

  return (
    <div className="bg-background relative flex min-h-dvh overflow-hidden">
      {/* Ambient radial lighting matching dark-navy SaaS references */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/4 size-[540px] rounded-full bg-violet-600/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 size-[460px] rounded-full bg-blue-600/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        {/* Left Hero Column */}
        <div className="hidden flex-col justify-between space-y-8 lg:flex">
          <div className="flex items-center gap-3">
            <span className="lp-gradient-bg flex size-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg shadow-violet-950/40">
              LP
            </span>
            <div>
              <p className="text-foreground text-base font-bold tracking-tight">L_Platform</p>
              <p className="text-muted-foreground text-xs">
                A Unified Learning & Programming Platform
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <ShieldCheck className="size-3.5" aria-hidden />
              Admin & Teacher Console
            </span>

            <h1 className="text-foreground text-4xl leading-tight font-bold tracking-tight xl:text-[42px]">
              Manage Your Organization on <span className="lp-gradient-text">L_Platform</span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              A secure, multi-tenant portal for platform administrators, school coordinators and
              teachers to manage institutions, classes, AI Readiness courses and assessments.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr] xl:items-center">
            <ul className="space-y-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="flex items-start gap-3">
                    <span className="border-border bg-secondary/80 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-foreground text-sm font-semibold">{feature.title}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <PortalMiniPreview />
          </div>
        </div>

        {/* Right Sign-In Card */}
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <span className="lp-gradient-bg flex size-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md">
              LP
            </span>
            <div>
              <p className="text-foreground text-base font-bold tracking-tight">L_Platform</p>
              <p className="text-muted-foreground text-xs">Admin & Teacher Portal</p>
            </div>
          </div>

          <div className="border-border bg-card/95 rounded-2xl border p-7 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
            <div className="mb-6 text-center">
              <div className="lp-gradient-bg mx-auto mb-3 hidden size-11 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg shadow-violet-950/50 lg:flex">
                LP
              </div>
              <h2 className="text-foreground text-2xl font-bold tracking-tight">Sign In</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Access your L_Platform management portal
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@organization.edu"
                    className="bg-secondary/70 h-11 pl-9"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" role="alert" className="text-destructive text-xs">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="bg-secondary/70 h-11 pr-10 pl-9"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="text-destructive text-xs">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {formError && (
                <div
                  role="alert"
                  className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-3 py-2 text-xs"
                >
                  {formError}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="lp-gradient-bg h-11 w-full border-0 text-white shadow-lg shadow-violet-950/40 hover:opacity-95"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="size-4" aria-hidden />
                  </>
                )}
              </Button>
            </form>

            {process.env.NODE_ENV !== "production" &&
              SHOW_DEMO_ACCOUNTS &&
              DEMO_ACCOUNTS.length > 0 && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden>
                      <span className="border-border w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card text-muted-foreground px-3 text-[11px] font-medium tracking-wider uppercase">
                        Local role quick-fill
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {DEMO_ACCOUNTS.map((account, index) => (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => fillDemoAccount(index)}
                        className={cn(
                          "group border-border bg-secondary/50 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all",
                          "hover:border-primary/50 hover:bg-secondary focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="bg-primary/15 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
                            <Building2 className="size-3.5" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold">
                              {account.label}
                            </span>
                            <span className="text-muted-foreground block truncate text-[11px]">
                              {account.email}
                            </span>
                          </span>
                        </span>
                        <span className="text-primary shrink-0 text-xs font-medium opacity-75 transition-opacity group-hover:opacity-100">
                          Fill
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="bg-background flex min-h-dvh items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading sign-in…</p>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
