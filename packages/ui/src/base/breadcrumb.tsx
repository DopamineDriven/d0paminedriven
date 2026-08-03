import type { ComponentPropsWithRef } from "react";
import { ChevronRight } from "@/icons/chevron-right";
import { MoreHorizontal } from "@/icons/more-horizontal";
import { cn } from "@/lib/utils";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

function BaseBreadcrumb({ className, ...props }: ComponentPropsWithRef<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn(className)}
      {...props}
    />
  );
}

function BaseBreadcrumbList({ className, ...props }: ComponentPropsWithRef<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm wrap-break-word",
        className
      )}
      {...props}
    />
  );
}

function BaseBreadcrumbItem({ className, ...props }: ComponentPropsWithRef<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}

function BaseBreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn("transition-colors hover:text-foreground", className)
      },
      props
    ),
    render,
    state: {
      slot: "breadcrumb-link"
    }
  });
}

function BaseBreadcrumbPage({
  className,
  ...props
}: ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  );
}

function BaseBreadcrumbSeparator({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}>
      {children ?? <ChevronRight className="cn-rtl-flip" />}
    </li>
  );
}

function BaseBreadcrumbEllipsis({
  className,
  ...props
}: ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-5 items-center justify-center [&>svg]:size-4",
        className
      )}
      {...props}>
      <MoreHorizontal />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  BaseBreadcrumb,
  BaseBreadcrumbList,
  BaseBreadcrumbItem,
  BaseBreadcrumbLink,
  BaseBreadcrumbPage,
  BaseBreadcrumbSeparator,
  BaseBreadcrumbEllipsis
};
