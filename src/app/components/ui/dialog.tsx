"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "./utils";

function filterProps<T extends Record<string, any>>(props: T): T {
  const filtered = { ...props } as any;
  for (const key in filtered) {
    if (key.startsWith("_fg") || key.startsWith("data-fg")) {
      delete filtered[key];
    }
  }
  return filtered;
}

// Wrapper component to filter _fg props from lucide-react icons
const FilteredXIcon = React.forwardRef<SVGSVGElement, React.ComponentProps<typeof XIcon>>((props, ref) => {
  return <XIcon {...filterProps(props)} ref={ref} />;
});
FilteredXIcon.displayName = "FilteredXIcon";

const Dialog = React.forwardRef<
  any,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>
>((props, ref) => {
  return <DialogPrimitive.Root data-slot="dialog" {...filterProps(props)} />;
});
Dialog.displayName = "Dialog";

const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(({ ...props }, ref) => (
  <DialogPrimitive.Trigger ref={ref} data-slot="dialog-trigger" {...filterProps(props)} />
));
DialogTrigger.displayName = DialogPrimitive.Trigger.displayName;

const DialogPortal = React.forwardRef<
  any,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>
>((props, ref) => {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...filterProps(props)} />;
});
DialogPortal.displayName = "DialogPortal";

const DialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ ...props }, ref) => (
  <DialogPrimitive.Close ref={ref} data-slot="dialog-close" {...filterProps(props)} />
));
DialogClose.displayName = DialogPrimitive.Close.displayName;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...filterProps(props)}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const descriptionId = React.useId();
  const ariaDescribedby = props['aria-describedby'] || descriptionId;
  const contentProps = { ...filterProps(props) };

  // Always provide aria-describedby
  contentProps['aria-describedby'] = ariaDescribedby;

  // Check if children contains DialogDescription
  const hasDescription = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === DialogDescription ||
       (typeof child.type === 'object' && 'displayName' in child.type && child.type.displayName === 'DialogDescription'))
  );

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-0.25rem)] translate-x-[-50%] translate-y-[-50%] rounded-2xl border p-0 shadow-lg overflow-hidden duration-200",
          className,
        )}
        {...contentProps}
      >
        {!hasDescription && !props['aria-describedby'] && (
          <DialogPrimitive.Description id={descriptionId} className="sr-only">
            Dialog content
          </DialogPrimitive.Description>
        )}
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <FilteredXIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dialog-header"
    className={cn("flex flex-col gap-1 px-6 py-4 border-b border-slate-200 text-left", className)}
    {...filterProps(props)}
  />
));
DialogHeader.displayName = "DialogHeader";

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dialog-footer"
    className={cn(
      "flex flex-row items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50",
      className,
    )}
    {...filterProps(props)}
  />
));
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="dialog-title"
    className={cn("text-c1 leading-none font-semibold", className)}
    {...filterProps(props)}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="dialog-body" className={cn("px-6 py-5", className)} {...filterProps(props)} />
  )
);
DialogBody.displayName = "DialogBody";

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="dialog-description"
    className={cn("text-muted-foreground text-c3", className)}
    {...filterProps(props)}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
