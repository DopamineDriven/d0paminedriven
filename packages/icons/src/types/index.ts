import type { ComponentPropsWithRef } from "react";

export type BaseSVGProps = Omit<
  ComponentPropsWithRef<"svg">,
  "viewBox" | "xmlns" | "fill" | "strokeLinecap" | "strokeLinejoin"
>;
