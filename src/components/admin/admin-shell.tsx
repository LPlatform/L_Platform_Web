"use client";

import { GraduationCap, Settings2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { SidebarNav } from "@/components/admin/nav";
import { useSession } from "@/components/admin/session-provider";
import { Topbar } from "@/components/admin/topbar";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ROLE_LABELS } from "@/types";

function Brand() {
  return (
    <Link
      href="/admin/dashboard"
      className="focus-visible:ring-sidebar-primary/60 flex items-center gap-3 rounded-lg px-2 py-1 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm">
        <GraduationCap className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="text-sidebar-foreground block truncate text-sm font-semibold tracking-tight">
          L_Platform
        </span>
        <span className="text-sidebar-muted block text-[11px] font-medium tracking-[0.16em] uppercase">
          Admin portal
        </span>
      </span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useSession();
  const [firstName = "", ...restName] = session.name.split(" ");
  const lastName = restName.join(" ");

  return (
    <>
      <div className="border-sidebar-border flex h-16 shrink-0 items-center border-b px-4">
        <Brand />
      </div>
      <SidebarNav onNavigate={onNavigate} />
      <div className="border-sidebar-border shrink-0 border-t p-3">
        <Link
          href="/admin/settings"
          onClick={onNavigate}
          className="hover:bg-sidebar-accent/60 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
        >
          <UserAvatar firstName={firstName} lastName={lastName || firstName} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="text-sidebar-foreground block truncate text-sm font-medium">
              {session.name}
            </span>
            <span className="text-sidebar-muted block truncate text-[11px]">
              {ROLE_LABELS[session.role]}
            </span>
          </span>
          <Settings2 className="text-sidebar-muted size-4 shrink-0" aria-hidden />
        </Link>
        <p className="text-sidebar-muted/70 px-2 pt-2 text-[10px] font-medium tracking-[0.12em] uppercase">
          Mock environment · demo data
        </p>
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="bg-background min-h-dvh">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-lg px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <aside className="border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r lg:flex">
        <SidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent className="flex flex-col">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-dvh flex-col lg:pl-[264px]">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main id="main-content" className="page-container w-full flex-1 py-6 lg:py-8">
          {children}
        </main>
        <footer className="page-container pt-2 pb-6">
          <p className="text-muted-foreground text-xs">
            L_Platform Admin · Frontend demonstration with simulated data. Authorization and data
            isolation are enforced by the backend API in production.
          </p>
        </footer>
      </div>
    </div>
  );
}
