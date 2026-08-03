"use client";

import type { JSX } from "react";
import { BaseButton } from "@/base/button";
import { CircleCheck } from "@/icons/circle-check";
import { Info } from "@/icons/info";
import { Loader } from "@/icons/loader";
import { OctagonX } from "@/icons/octagon-x";
import { TriangleAlert } from "@/icons/triangle-alert";
import { X } from "@/icons/x";
import { cn } from "@/lib/utils";
import { Toast as BaseToastPrimitive } from "@base-ui/react/toast";

const toast = BaseToastPrimitive.createToastManager();

function BaseToastProvider({ ...props }: BaseToastPrimitive.Provider.Props) {
  return <BaseToastPrimitive.Provider {...props} />;
}

function BaseToastPortal({ ...props }: BaseToastPrimitive.Portal.Props) {
  return <BaseToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function BaseToastViewport({
  className,
  ...props
}: BaseToastPrimitive.Viewport.Props) {
  return (
    <BaseToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full",
        className
      )}
      {...props}
    />
  );
}

function BaseToast({ className, ...props }: BaseToastPrimitive.Root.Props) {
  return (
    <BaseToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast bg-popover text-popover-foreground focus-visible:border-ring focus-visible:ring-ring/50 pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-2xl border shadow-lg will-change-transform outline-none select-none focus-visible:ring-[3px]",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:transform-[translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:transform-[translateY(150%)]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:transform-[translateY(150%)]",
        "data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        className
      )}
      {...props}
    />
  );
}

function BaseToastContent({
  className,
  ...props
}: BaseToastPrimitive.Content.Props) {
  return (
    <BaseToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className
      )}
      {...props}
    />
  );
}

function BaseToastTitle({
  className,
  ...props
}: BaseToastPrimitive.Title.Props) {
  return (
    <BaseToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  );
}

function BaseToastDescription({
  className,
  ...props
}: BaseToastPrimitive.Description.Props) {
  return (
    <BaseToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function BaseToastAction({
  className,
  render = <BaseButton variant="outline" size="sm" />,
  ...props
}: BaseToastPrimitive.Action.Props) {
  return (
    <BaseToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

function BaseToastClose({
  className,
  children,
  render = <BaseButton variant="ghost" size="icon-sm" />,
  ...props
}: BaseToastPrimitive.Close.Props) {
  return (
    <BaseToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "text-muted-foreground hover:text-foreground relative shrink-0 after:absolute after:-inset-2 after:content-['']",
        className
      )}
      {...props}>
      {children ?? <X aria-hidden="true" />}
    </BaseToastPrimitive.Close>
  );
}

function BaseToastIcon({ type }: { type: string | undefined }) {
  let icon: JSX.Element | null = null;

  if (type === "success") {
    icon = <CircleCheck aria-hidden="true" />;
  }

  if (type === "info") {
    icon = <Info aria-hidden="true" />;
  }

  if (type === "warning") {
    icon = <TriangleAlert aria-hidden="true" />;
  }

  if (type === "error") {
    icon = <OctagonX className="text-destructive" aria-hidden="true" />;
  }

  if (type === "loading") {
    icon = <Loader className="animate-spin" aria-hidden="true" />;
  }

  if (!icon) {
    return null;
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4">
      {icon}
    </span>
  );
}

function BaseToastList() {
  const { toasts } = BaseToastPrimitive.useToastManager();

  return toasts.map(toastItem => (
    <BaseToast key={toastItem.id} toast={toastItem}>
      <BaseToastContent>
        <BaseToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <BaseToastTitle />
          <BaseToastDescription />
        </div>
        <BaseToastAction />
        <BaseToastClose />
      </BaseToastContent>
    </BaseToast>
  ));
}

function BaseToaster({
  children,
  toastManager = toast,
  ...props
}: BaseToastPrimitive.Provider.Props) {
  return (
    <BaseToastProvider toastManager={toastManager} {...props}>
      {children}
      <BaseToastPortal>
        <BaseToastViewport>
          <BaseToastList />
        </BaseToastViewport>
      </BaseToastPortal>
    </BaseToastProvider>
  );
}

const createBaseToastManager = BaseToastPrimitive.createToastManager;
const useBaseToastManager = BaseToastPrimitive.useToastManager;

export {
  BaseToaster,
  BaseToast,
  BaseToastAction,
  BaseToastClose,
  BaseToastContent,
  BaseToastDescription,
  BaseToastPortal,
  BaseToastProvider,
  BaseToastTitle,
  BaseToastViewport,
  createBaseToastManager,
  toast,
  useBaseToastManager
};
