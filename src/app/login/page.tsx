"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
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

const HIGHLIGHTS = [
  { icon: Building2, text: "Organizations, classes and sections in one place" },
  { icon: Users, text: "Role-based access for admins and teachers" },
  { icon: BookOpen, text: "Courses, coding assignments and assessments" },
  { icon: ShieldCheck, text: "Tenant isolation enforced in the database" },
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
    <div className="bg-background grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="bg-sidebar text-sidebar-foreground hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md text-sm font-bold">
            LP
          </span>
          <span className="text-lg font-semibold text-white">L Platform</span>
        </div>
        <div className="max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl leading-tight font-semibold text-white">
              The learning and assessment console for schools.
            </h1>
            <p className="text-sidebar-muted text-base">
              Manage organizations, teach classes, author questions and review student work.
            </p>
          </div>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="bg-sidebar-accent text-sidebar-primary flex size-8 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sidebar-muted text-xs">
          Students sign in with the L Platform desktop app.
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-xs font-bold">
              LP
            </span>
            <span className="font-semibold">L Platform</span>
          </div>
          <div className="mb-6 space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-muted-foreground text-sm">
              Admin and teacher console. Use your organization account.
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
                  className="h-11 pl-9"
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
                  className="h-11 pr-10 pl-9"
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

            <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
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
