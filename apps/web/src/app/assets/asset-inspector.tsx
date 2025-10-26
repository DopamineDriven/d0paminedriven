"use client";

import type {
  ExpandedDocSpecs,
  ExpandedImgSpecs
} from "@d0paminedriven/metadata";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Icon,
  Input,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator
} from "@d0paminedriven/ui";
import { useMemo, useState } from "react";

type AssetOk = {
  url: string;
  ok: true;
  meta: ExpandedImgSpecs | ExpandedDocSpecs;
};
type AssetErr = { url: string; ok: false; error: string };
export type AssetResult = AssetOk | AssetErr;

function humanBytes(n?: number | null) {
  if (!n || n <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.min(
    Math.floor(Math.log(n) / Math.log(1024)),
    units.length - 1
  );
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function AssetCard({ item }: { item: AssetResult }) {
  if (!item.ok) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Error</span>
            <Badge variant="destructive">Failed</Badge>
          </CardTitle>
          <CardDescription className="text-xs break-all opacity-80">
            {item.url}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">{item.error}</div>
        </CardContent>
      </Card>
    );
  }

  const meta = item.meta;
  const isImage = meta.type === "IMAGE";
  const src = meta.source ?? item.url;

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isImage ? (
              <Icon.ImageIcon className="size-4" />
            ) : (
              <Icon.FileText className="size-4" />
            )}
            <span className="capitalize">
              {isImage
                ? meta.format
                : (meta.format ?? meta.mimeType ?? "document")}
            </span>
          </CardTitle>
          <Badge variant="secondary">{isImage ? "Image" : "Document"}</Badge>
        </div>
        <CardDescription className="text-xs break-all opacity-80">
          {src}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isImage ? (
          <div className="bg-muted/40 flex items-center justify-center overflow-hidden rounded-md border">
            {/* Use plain img to avoid remote patterns config */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={meta.format}
              className="object-contain"
              style={{ width: "100%", height: 200 }}
            />
          </div>
        ) : (
          <div className="bg-muted/40 flex items-center justify-center rounded-md border p-6">
            <Icon.FileText className="text-muted-foreground size-10" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          {isImage ? (
            <>
              <div className="text-muted-foreground">Dimensions</div>
              <div>
                {meta.width} x {meta.height}
              </div>
              <div className="text-muted-foreground">Frames</div>
              <div>{meta.frames}</div>
              <div className="text-muted-foreground">Animated</div>
              <div>{meta.animated ? "Yes" : "No"}</div>
              <div className="text-muted-foreground">Color</div>
              <div>{meta.colorSpace}</div>
            </>
          ) : (
            <>
              <div className="text-muted-foreground">Pages</div>
              <div>{meta.pageCount ?? "-"}</div>
              <div className="text-muted-foreground">Words</div>
              <div>{meta.wordCount ?? "-"}</div>
              <div className="text-muted-foreground">MIME</div>
              <div>{meta.mimeType ?? meta.format ?? "-"}</div>
              <div className="text-muted-foreground">Preview</div>
              <div className="line-clamp-2">{meta.textPreview ?? ""}</div>
            </>
          )}

          <div className="text-muted-foreground">Content-Type</div>
          <div>{meta.contentType ?? "-"}</div>
          <div className="text-muted-foreground">Fetched</div>
          <div>{humanBytes(meta.fetchedBytes)}</div>
          <div className="text-muted-foreground">Size</div>
          <div>{humanBytes(meta.byteSize)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssetInspector({
  initialResults
}: {
  initialResults: AssetResult[];
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [format, setFormat] = useState<string>("all");
  const [onlyErrors, setOnlyErrors] = useState(false);

  const allFormats = useMemo(() => {
    const set = new Set<string>();
    for (const r of initialResults) {
      if (!r.ok) continue;
      if (r.meta.type === "IMAGE") set.add(r.meta.format as string);
      else if (r.meta.format) set.add(r.meta.format);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [initialResults]);

  const filtered = useMemo(() => {
    return initialResults.filter(r => {
      if (onlyErrors) return !r.ok;
      if (!r.ok) return false;
      const urlMatch = r.url.toLowerCase().includes(query.toLowerCase());
      if (!urlMatch) return false;
      if (type !== "all") {
        if (type === "image" && r.meta.type !== "IMAGE") return false;
        if (type === "document" && r.meta.type !== "DOCUMENT") return false;
      }
      if (format !== "all") {
        if (r.meta.type === "IMAGE") {
          if (r.meta.format !== format) return false;
        } else {
          const f = r.meta.format ?? r.meta.mimeType ?? "";
          if (f !== format) return false;
        }
      }
      return true;
    });
  }, [initialResults, query, type, format, onlyErrors]);

  const counts = useMemo(() => {
    const total = initialResults.length;
    let images = 0;
    let documents = 0;
    let errors = 0;
    for (const r of initialResults) {
      if (!r.ok) {
        errors++;
        continue;
      }
      if (r.meta.type === "IMAGE") images++;
      else documents++;
    }
    return { total, images, documents, errors };
  }, [initialResults]);

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-cal-sans text-2xl">Asset Metadata Inspector</h1>
          <p className="text-muted-foreground text-sm">
            Using @d0paminedriven/metadata to classify and preview assets
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">Total {counts.total}</Badge>
          <Badge variant="outline">Images {counts.images}</Badge>
          <Badge variant="outline">Documents {counts.documents}</Badge>
          <Badge variant="destructive">Errors {counts.errors}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by URL..."
          />
        </div>
        <Select
          value={type}
          onValueChange={v => setType(v as "all" | "image" | "document")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            {allFormats.map(f => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={onlyErrors ? "destructive" : "outline"}
          onClick={() => setOnlyErrors(v => !v)}>
          {onlyErrors ? "Showing errors" : "Only errors"}
        </Button>
      </div>

      <Separator />

      <ScrollArea className="h-[calc(100dvh-260px)]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <AssetCard
              key={(item.ok ? item.meta.source : item.url) ?? item.url}
              item={item}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
