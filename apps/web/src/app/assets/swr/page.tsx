"use client";

import { Button } from "@d0paminedriven/ui";
import { useCallback } from "react";
import useSWR from "swr";
import { devCdnUrls } from "@/lib/cdn-data";
import AssetInspector from "../asset-inspector";

// codex resume 019a20f9-35e0-7490-9cf0-a6f1d11dc4de

type AssetResult = Parameters<
  typeof AssetInspector
>[0]["initialResults"][number];

const fetcher = async (_key: string, urls: string[], size: number) => {
  const res = await fetch("/api/metadata", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ urls, size })
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as { results: AssetResult[] };
  return data.results;
};

export default function AssetsSWRPage() {
  const { data, error, isLoading, mutate } = useSWR<
    AssetResult[],
    Error,
    [string, string[], number]
  >(
    ["metadata", devCdnUrls, 96 * 1024],
    ([key, urls, size]) =>
      fetcher(key as string, urls as string[], size as number),
    {
      fetcher: ([key, urls, size]) => fetcher(key, urls, size),
      revalidateOnFocus: false
    }
  );
  const clickCb = useCallback(
    (_e: React.MouseEvent<HTMLButtonElement, MouseEvent> | undefined) => {
      mutate()
        .then(t => {
          const _newResults = t;
        })
        .catch(err => console.error(err));
    },
    [mutate]
  );
  if (error) {
    return (
      <div className="container mx-auto space-y-4 py-6">
        <div className="text-red-500">
          Failed to load: {String(error.message)}
        </div>
        <Button onClick={clickCb}>Retry</Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="container mx-auto py-6">Loading via SWR…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="container mx-auto flex items-center justify-between py-4">
        <h1 className="font-cal-sans text-2xl">Asset Inspector (SWR)</h1>
        <Button variant="outline" onClick={clickCb}>
          Refresh
        </Button>
      </div>
      <AssetInspector initialResults={data} />
    </div>
  );
}
