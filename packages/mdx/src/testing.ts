import { VFile, StrictVFile, EnhancedVFile } from "vfile";
import { matter } from "@/index";
import { parseFrontmatter } from "@/temp";

const mdxPostFile = `---
id: "4"
title: HILLSIDE TO HARBOR
description: HELPING YOU NAVIGATE CHALLENGING SITUATIONS
imageUrl: https://raw.githubusercontent.com/DopamineDriven/portfolio-2025/master/apps/web/public/hillsidetoharbor.png
homeImageUrl: https://raw.githubusercontent.com/DopamineDriven/portfolio-2025/master/apps/web/public/hillsidetoharbor-768x1024.png
link: /projects/hillside-to-harbor
slug: hillside-to-harbor
externalLink: https://www.hillsidetoharbor.com
technologies:
  - Next.js
  - React
  - TypeScript
  - Tailwindcss
  - Headless WordPress
  - Cloudfront
  - WPGraphQL
  - Gravity Forms
  - Vercel
  - Codegen
date: "2023"
---

Family-owned small business serving the Knoxville, TN area; helps homeowners in financial trouble navigate challenging situations by acquiring pre-foreclosed properties at fair prices and working with the current owner, not the bank, as an example. They buy fixer-uppers and help those in trouble have a chance at a fresh start financially.`;


declare module "vfile" {
  interface DataMap {
    myCustomField: string[];
  }




  class StrictVFile<
    TData extends { [P in keyof DataMap]: DataMap[P] }
  > extends VFile {
    data: TData;
  }
  class EnhancedVFile<
    TData extends { [P in keyof DataMap]: DataMap[P] }
  > extends VFile {
    data: TData;
  }
}

new EnhancedVFile({ value: mdxPostFile }).data;

export {};




const _ddParser = parseFrontmatter(mdxPostFile);

const file = new StrictVFile({ value: mdxPostFile });

matter(file, { strip: true });


