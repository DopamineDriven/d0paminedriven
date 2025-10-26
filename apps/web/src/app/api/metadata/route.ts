export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { Extract } from "@d0paminedriven/metadata";

type ImgOrDoc = Awaited<ReturnType<Extract["extractRemote"]>>;

type AssetResult =
  | { url: string; ok: true; meta: ImgOrDoc }
  | { url: string; ok: false; error: string };

function limiter(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const run = async <T,>(fn: () => Promise<T>): Promise<T> => {
    if (active >= concurrency) await new Promise<void>(r => queue.push(r));
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
}

async function processUrls(urls: string[], size = 96 * 1024, timeout = 5000) {
  const extract = new Extract({ debug: false });
  const run = limiter(6);
  const tasks = urls.map(url =>
    run(async (): Promise<AssetResult> => {
      try {
        const meta = await extract.extractRemote(url, size, timeout);
        return { url, ok: true, meta };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { url, ok: false, error: msg };
      }
    })
  );
  return await Promise.all(tasks);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const single = searchParams.get("url");
  const size = parseInt(searchParams.get("size") ?? "98304", 10);
  const timeout = parseInt(searchParams.get("timeout") ?? "5000", 10);
  if (!single) {
    return new Response(
      JSON.stringify({ error: "Provide ?url=... or POST { urls: [] }" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }
  const results = await processUrls([single], size, timeout);
  return new Response(JSON.stringify({ results }), {
    headers: { "content-type": "application/json" }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      urls?: string[];
      size?: number;
      timeout?: number;
    };
    const urls = Array.isArray(body?.urls) ? body.urls : [];
    if (!urls.length)
      return new Response(
        JSON.stringify({ error: "POST body must include urls[]" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    const results = await processUrls(urls, body.size ?? 96 * 1024, body.timeout ?? 5000);
    return new Response(JSON.stringify({ results }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}

