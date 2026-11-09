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
import { Badge } from "@/components/ui/badge";
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
import { ROLE_LABELS } from "@/types";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { session, signOut } = useSession();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [signingOut, setSigningOut] = React.useState(false);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/admin/search?q=${encodeURIComponent(trimmed)}` : "/admin/search");
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out of the demo session.");
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

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <form onSubmit={handleSearch} className="relative hidden md:block" role="search">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              aria-label="Global search"
              className="h-9 w-48 pl-9 lg:w-64"
            />
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
                <span
                  aria-hidden
                  className="bg-primary ring-background absolute top-2 right-2 size-1.5 rounded-full ring-2"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-border flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                <Badge variant="muted">Mock</Badge>
              </div>
              <div className="text-muted-foreground space-y-2 px-4 py-4 text-sm">
                <p>
                  In-app notifications are not enabled in this build. Invitation activity is
                  recorded in the audit log and can be reviewed at any time.
                </p>
                <Link
                  href="/admin/invitations"
                  className="text-primary inline-flex font-medium hover:underline"
                >
                  Review invitations
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
                className="hover:bg-accent focus-visible:ring-ring/40 flex items-center gap-2 rounded-lg p-1 pr-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
