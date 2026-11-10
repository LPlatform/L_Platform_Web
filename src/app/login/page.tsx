"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS, authService, getErrorMessage } from "@/lib/api";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Building2,
    title: "Organization management",
    description: "Onboard institutions, monitor activity and control access from one workspace.",
  },
  {
    icon: CalendarClock,
    title: "Course allocation",
    description: "Assign courses to an entire organization, a class or a single section.",
  },
  {
    icon: BarChart3,
    title: "Operational insight",
    description: "Track onboarding, enrollment and allocation coverage with live reporting.",
  },
  {
    icon: ShieldCheck,
    title: "Auditable by design",
    description: "Every administrative change is captured in a structured audit trail.",
  },
];

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
      } else {
        destination = requested?.startsWith("/admin") ? requested : "/admin/dashboard";
      }
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  function fillDemoAccount(index: number) {
    const account = DEMO_ACCOUNTS[index];
    if (!account) return;
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
    clearErrors();
    setFormError(null);
  }

  return (
    <div className="bg-background flex min-h-dvh">
      <aside className="bg-sidebar text-sidebar-foreground relative hidden w-[46%] max-w-2xl flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        <div
          aria-hidden
          className="bg-sidebar-primary/25 pointer-events-none absolute -top-40 -right-32 size-[480px] rounded-full blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 size-[380px] rounded-full bg-sky-500/15 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 items-center justify-center rounded-xl shadow-lg">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">L_Platform</p>
            <p className="text-sidebar-muted text-[11px] font-medium tracking-[0.18em] uppercase">
              Admin portal
            </p>
          </div>
        </div>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-3">
            <p className="text-sidebar-primary text-xs font-semibold tracking-[0.18em] uppercase">
              Administration workspace
            </p>
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance xl:text-4xl">
              Run every institution from a single, auditable console.
            </h1>
            <p className="text-sidebar-muted text-sm leading-relaxed">
              Manage organizations, people, academic structure and course delivery without losing
              track of who changed what.
            </p>
          </div>
          <ul className="grid gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex gap-3">
                  <span className="bg-sidebar-accent text-sidebar-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-sidebar-muted mt-0.5 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-sidebar-muted/80 relative text-xs leading-relaxed">
          Local development portal connected to the L_Platform Backend and persistent PostgreSQL
          database. Demo accounts are for local testing only.
        </p>
      </aside>

      <main className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl shadow-sm">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">L_Platform</p>
              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
                Admin portal
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-muted-foreground text-sm">
              Use a demo account to explore the administration workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
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
                  className="h-10 pl-9"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
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
                  className="h-10 pr-10 pl-9"
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
                <p id="password-error" role="alert" className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {formError && (
              <div
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
              >
                {formError}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in to admin portal
                  <ArrowRight className="size-4" aria-hidden />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <span className="border-border w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background text-muted-foreground px-3 text-xs font-medium tracking-wide uppercase">
                  Demo accounts
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {DEMO_ACCOUNTS.map((account, index) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoAccount(index)}
                  className={cn(
                    "group border-border bg-card flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left shadow-xs transition-colors",
                    "hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{account.label}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {account.email}
                    </span>
                  </span>
                  <span className="text-primary shrink-0 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                    Use account
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="bg-muted/60 text-muted-foreground mt-8 rounded-lg px-3 py-2.5 text-xs leading-relaxed">
            Demo authentication runs entirely in this browser. It is not real security and must not
            be used to protect production data.
          </p>
        </div>
      </main>
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
