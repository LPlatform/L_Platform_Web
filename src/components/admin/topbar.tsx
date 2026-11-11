"use client";

import { Bell, LogOut, Menu, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/admin/breadcrumbs";
import { useSession } from "@/components/admin/session-provider";
import { ThemeToggle } from "@/components/admin/theme-toggle";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { services } from "@/lib/api";
import { formatRelative } from "@/lib/dates";
import { ROLE_LABELS, type AuditLog } from "@/types";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { session, signOut } = useSession();
  const router = useRouter();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [signingOut, setSigningOut] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AuditLog[]>([]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    let active = true;
    services.dashboard
      .getRecentActivity(5)
      .then((rows) => {
        if (active && Array.isArray(rows)) setNotifications(rows);
      })
      .catch(() => {
        /* ignore when unauthenticated */
      });
    return () => {
      active = false;
    };
  }, []);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/admin/search?q=${encodeURIComponent(trimmed)}` : "/admin/search");
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out of L_Platform.");
    } finally {
      setSigningOut(false);
    }
  }

  const [firstName = "", ...restName] = session.name.split(" ");
  const lastName = restName.join(" ");

  return (
    <header className="border-border/80 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>

        <Breadcrumbs className="hidden md:block" />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <form onSubmit={handleSearch} className="relative hidden md:block" role="search">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search organizations, users, classes..."
              aria-label="Global search"
              className="bg-secondary/70 border-border/80 h-9 w-64 pr-16 pl-9 text-xs lg:w-80"
            />
            <kbd className="border-border bg-card text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[10px] font-medium">
              Ctrl K
            </kbd>
          </form>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Global search"
            asChild
          >
            <Link href="/admin/search">
              <Search className="size-4" />
            </Link>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="size-4" />
                {notifications.length > 0 && (
                  <span
                    aria-hidden
                    className="bg-primary ring-background absolute top-2 right-2 size-1.5 rounded-full ring-2"
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-border flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold">Recent Platform Activity</p>
                <span className="text-muted-foreground text-xs">{notifications.length}</span>
              </div>
              {notifications.length === 0 ? (
                <div className="text-muted-foreground px-4 py-5 text-xs">
                  No recent events recorded in your scope.
                </div>
              ) : (
                <ul className="divide-border divide-y">
                  {notifications.map((item) => (
                    <li key={item.id} className="px-4 py-2.5 text-xs">
                      <p className="text-foreground font-medium">{item.action}</p>
                      <p className="text-muted-foreground mt-0.5 truncate">
                        {item.entityLabel || item.entityType} · {formatRelative(item.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-border border-t px-4 py-2.5">
                <Link
                  href="/admin/audit-logs"
                  className="text-primary text-xs font-medium hover:underline"
                >
                  Open audit log →
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          <ThemeToggle />

          <div className="bg-border mx-1 hidden h-6 w-px sm:block" aria-hidden />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hover:bg-accent focus-visible:ring-ring/40 flex items-center gap-2 rounded-xl p-1 pr-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Account menu"
              >
                <UserAvatar firstName={firstName} lastName={lastName || firstName} size="sm" />
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-[140px] truncate text-sm font-medium">
                    {session.name}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    {ROLE_LABELS[session.role]}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <span className="text-foreground block text-sm font-medium">{session.name}</span>
                <span className="text-muted-foreground block truncate text-xs">
                  {session.email}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs">
                  {ROLE_LABELS[session.role]}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push("/admin/settings")}>
                <Settings />
                Platform settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                disabled={signingOut}
                onSelect={() => void handleSignOut()}
              >
                <LogOut />
                {signingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
