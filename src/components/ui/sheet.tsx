"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "left" | "right";
  }
>(({ className, children, side = "left", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px]" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "bg-sidebar text-sidebar-foreground data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-y-0 z-50 flex w-[280px] flex-col shadow-2xl transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300",
        side === "left"
          ? "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left left-0"
          : "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right right-0",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground absolute top-3 right-3 rounded-md p-1">
        <X className="size-4" />
        <span className="sr-only">Close navigation</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export { Sheet, SheetTrigger, SheetClose, SheetContent };
