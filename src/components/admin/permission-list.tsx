"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/admin/error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { usePermissions } from "@/lib/hooks/use-platform-data";

export function PermissionList({ className }: { className?: string }) {
  const permissions = usePermissions();

  return (
    <Card className={className}>
      <CardHeader>
        <span className="bg-primary/10 text-primary mb-1 flex size-9 items-center justify-center rounded-lg">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        <CardTitle>Organization administrator access</CardTitle>
        <CardDescription>
          These capabilities are granted by role in this mock environment. Authorization is enforced
          by the backend in production.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {permissions.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : permissions.isError ? (
          <ErrorState
            message={getErrorMessage(permissions.error)}
            onRetry={() => void permissions.refetch()}
            className="py-6"
          />
        ) : (
          <ul className="space-y-3">
            {(permissions.data ?? []).map((permission) => (
              <li key={permission.id} className="flex gap-2.5">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium">{permission.label}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {permission.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
