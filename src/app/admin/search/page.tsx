"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  ChevronRight,
  Layers,
  School,
  Search,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { ErrorState } from "@/components/admin/error-state";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage, services } from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks/use-platform-data";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS, LANGUAGE_LABELS, ROLE_LABELS } from "@/types";

type SearchIcon = typeof Search;

interface SearchItem {
  id: string;
  label: string;
  secondary?: string;
  href: string;
}

interface SearchGroup {
  id: string;
  label: string;
  icon: SearchIcon;
  items: SearchItem[];
  total: number;
}

const MIN_TERM_LENGTH = 2;
const GROUP_LIMIT = 5;

async function searchAll(term: string): Promise<SearchGroup[]> {
  const [organizations, users, classes, sections, courses, allocations] = await Promise.all([
    services.organizations.list({ search: term, page: 1, pageSize: GROUP_LIMIT }),
    services.users.list({ search: term, page: 1, pageSize: GROUP_LIMIT }),
    services.classes.list({ search: term, page: 1, pageSize: GROUP_LIMIT }),
    services.sections.list({ search: term, page: 1, pageSize: GROUP_LIMIT }),
    services.courses.list({ search: term, page: 1, pageSize: GROUP_LIMIT }),
    services.allocations.list({ search: term, page: 1, pageSize: GROUP_LIMIT }),
  ]);

  const groups: SearchGroup[] = [
    {
      id: "organizations",
      label: "Organizations",
      icon: Building2,
      total: organizations.meta.total,
      items: organizations.items.map((organization) => ({
        id: organization.id,
        label: organization.name,
        secondary: `${ORGANIZATION_TYPE_LABELS[organization.type]} · ${organization.city}`,
        href: `/admin/organizations/${organization.id}`,
      })),
    },
    {
      id: "users",
      label: "People",
      icon: Users,
      total: users.meta.total,
      items: users.items.map((user) => ({
        id: user.id,
        label: `${user.firstName} ${user.lastName}`,
        secondary: `${ROLE_LABELS[user.role]} · ${user.organizationName ?? "Platform-wide"}`,
        href: `/admin/users/${user.id}`,
      })),
    },
    {
      id: "classes",
      label: "Classes",
      icon: School,
      total: classes.meta.total,
      items: classes.items.map((academicClass) => ({
        id: academicClass.id,
        label: `${academicClass.organizationName} · ${academicClass.name}`,
        secondary: academicClass.academicYear,
        href: `/admin/classes/${academicClass.id}`,
      })),
    },
    {
      id: "sections",
      label: "Sections",
      icon: Layers,
      total: sections.meta.total,
      items: sections.items.map((section) => ({
        id: section.id,
        label: `${section.className} · ${section.name}`,
        secondary: `${section.organizationName} · ${section.studentCount} students`,
        href: `/admin/sections/${section.id}`,
      })),
    },
    {
      id: "courses",
      label: "Courses",
      icon: BookOpen,
      total: courses.meta.total,
      items: courses.items.map((course) => ({
        id: course.id,
        label: course.title,
        secondary: `${LANGUAGE_LABELS[course.language]} · ${DIFFICULTY_LABELS[course.difficulty]}`,
        href: `/admin/courses/${course.id}`,
      })),
    },
    {
      id: "allocations",
      label: "Allocations",
      icon: Target,
      total: allocations.meta.total,
      items: allocations.items.map((allocation) => ({
        id: allocation.id,
        label: allocation.courseTitle,
        secondary: `${allocation.organizationName} · ${allocation.publicId}`,
        href: `/admin/allocations/${allocation.id}`,
      })),
    },
  ];

  return groups.filter((group) => group.items.length > 0);
}

export default function SearchPage() {
  const [term, setTerm] = React.useState("");
  const debouncedTerm = useDebouncedValue(term.trim(), 250);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("q");
    if (value) setTerm(value);
    inputRef.current?.focus();
  }, []);

  const enabled = debouncedTerm.length >= MIN_TERM_LENGTH;
  const results = useQuery({
    queryKey: ["global-search", debouncedTerm],
    queryFn: () => searchAll(debouncedTerm),
    enabled,
    staleTime: 15_000,
  });

  const groups = results.data ?? [];
  const totalResults = groups.reduce((sum, group) => sum + group.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Global search"
        title="Search the platform"
        description="Find organizations, people, classes, sections, courses and allocations in one place. Results link to the matching record."
      />

      <div className="relative max-w-xl">
        <label htmlFor="global-search-input" className="sr-only">
          Search the platform
        </label>
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          id="global-search-input"
          ref={inputRef}
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search by name, email, class, course or ID…"
          className="h-11 pl-9 text-base"
          autoComplete="off"
        />
      </div>

      {!enabled ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Search}
              title="Start typing to search"
              description={`Enter at least ${MIN_TERM_LENGTH} characters. Mock search runs against every list service in the browser.`}
            />
          </CardContent>
        </Card>
      ) : results.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, groupIndex) => (
            <Card key={groupIndex}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-4 w-32" />
                {Array.from({ length: 3 }).map((__, rowIndex) => (
                  <Skeleton key={rowIndex} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : results.error ? (
        <Card>
          <ErrorState
            title="Search failed"
            message={getErrorMessage(results.error)}
            onRetry={() => void results.refetch()}
          />
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Search}
              title={`No matches for “${debouncedTerm}”`}
              description="Try a shorter term, an email address, a public ID or a different spelling."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {totalResults} {totalResults === 1 ? "result" : "results"} across {groups.length}{" "}
            {groups.length === 1 ? "category" : "categories"} for “{debouncedTerm}”.
          </p>
          <div className="space-y-4">
            {groups.map((group) => (
              <SearchGroupCard key={group.id} group={group} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SearchGroupCard({ group }: { group: SearchGroup }) {
  const Icon = group.icon;

  return (
    <Card>
      <div className="border-border/70 flex items-center gap-2 border-b px-5 py-3">
        <Icon className="text-muted-foreground size-4" aria-hidden />
        <h2 className="text-sm font-semibold">{group.label}</h2>
        <span className="text-muted-foreground text-xs">
          {group.total} {group.total === 1 ? "match" : "matches"}
        </span>
      </div>
      <ul className="divide-border/70 divide-y">
        {group.items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "hover:bg-accent/50 flex items-center justify-between gap-3 px-5 py-3 transition-colors",
                "focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{item.label}</span>
                {item.secondary && (
                  <span className="text-muted-foreground block truncate text-xs">
                    {item.secondary}
                  </span>
                )}
              </span>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
