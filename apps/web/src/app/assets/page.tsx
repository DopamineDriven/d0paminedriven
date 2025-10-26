import type {
  ExpandedDocSpecs,
  ExpandedImgSpecs
} from "@d0paminedriven/metadata";
import { Extract } from "@d0paminedriven/metadata";
import { Suspense } from "react";
import { devCdnUrls } from "@/lib/cdn-data";
import AssetInspector from "./asset-inspector";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ImgOrDoc = ExpandedDocSpecs | ExpandedImgSpecs;

type AssetResult =
  | {
      url: string;
      ok: true;
      meta: ImgOrDoc;
    }
  | {
      url: string;
      ok: false;
      error: string;
    };

async function getMetadataForUrls(urls: string[], headBytes = 96 * 1024) {
  const extract = new Extract({ debug: false });

  // simple concurrency limiter
  const limit = (n: number) => {
    let active = 0;
    const queue: (() => void)[] = [];
    const run = async <T,>(fn: () => Promise<T>): Promise<T> => {
      if (active >= n) await new Promise<void>(r => queue.push(r));
      active++;
      try {
        return await fn();
      } finally {
        active--;
        const next = queue.shift();
        if (next) next();
      }
    };
    return run;
  };

  const run = limit(6);
  const tasks = urls.map(url =>
    run(async (): Promise<AssetResult> => {
      try {
        const meta = await extract.extractRemote(url, headBytes);
        return { url, ok: true, meta };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { url, ok: false, error: msg };
      }
    })
  );

  const results = await Promise.all(tasks);
  return results;
}

export default async function AssetsPage() {
  const results = await getMetadataForUrls(devCdnUrls);

  return (
    <Suspense fallback={"Loading assets..."}>
      <AssetInspector initialResults={results} />
    </Suspense>
  );
}
