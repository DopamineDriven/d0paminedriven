import { UrlService } from "@/url/index.ts";

export const extMimeMap = {
  aac: ["audio/aac"],
  abw: ["application/x-abiword"],
  aces: ["image/aces"],
  apng: ["image/apng"],
  arc: ["application/x-freearc"],
  avci: ["image/avci"],
  avif: ["image/avif"],
  avi: ["video/x-msvideo"],
  azw: ["application/vnd.amazon.ebook"],
  bin: ["application/octet-stream"],
  bmp: ["image/bmp"],
  bz: ["application/x-bzip"],
  bz2: ["application/x-bzip2"],
  cda: ["application/x-cdf"],
  cjs: ["application/node", "text/javascript"],
  csh: ["application/x-csh"],
  css: ["text/css"],
  csv: ["text/csv"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  dpx: ["image/dpx"],
  emf: ["image/emf"],
  eot: ["application/vnd.ms-fontobject"],
  epub: ["application/epub+zip"],
  gif: ["image/gif"],
  glb: ["model/gltf-binary"],
  gltf: ["model/gltf+json"],
  gz: ["application/x-gzip", "application/gzip"],
  hjif: ["haptics/hjif"],
  hmpg: ["haptics/hmpg"],
  htm: ["text/html"],
  html: ["text/html"],
  ico: ["image/vnd.microsoft.icon"],
  ics: ["text/calendar"],
  ivs: ["haptics/ivs"],
  jar: ["application/java-archive"],
  jpeg: ["image/jpeg"],
  jpg: ["image/jpeg"],
  js: ["application/node", "text/javascript"],
  json: ["application/json"],
  jsonld: ["application/ld+json"],
  ktx: ["image/ktx"],
  ktx2: ["image/ktx2"],
  m3u8: ["application/vnd.apple.mpegurl"],
  m4a: ["audio/mp4"],
  m4v: ["video/mp4"],
  md: ["text/markdown"],
  mdx: ["application/x-mdx"],
  mid: ["audio/midi"],
  midi: ["audio/x-midi"],
  mjs: ["text/javascript"],
  mp3: ["audio/mpeg"],
  mp4: ["video/mp4"],
  mpeg: ["video/mpeg"],
  mpkg: ["application/vnd.apple.installer+xml"],
  ndjson: ["application/x-ndjson"],
  obj: ["application/octet-stream", "text/plain", "model/obj"],
  odp: ["application/vnd.oasis.opendocument.presentation"],
  ods: ["application/vnd.oasis.opendocument.spreadsheet"],
  odt: ["application/vnd.oasis.opendocument.text"],
  oga: ["audio/ogg"],
  ogg: ["audio/ogg"],
  ogv: ["video/ogg"],
  ogx: ["application/ogg"],
  opus: ["audio/ogg"],
  otf: ["font/otf"],
  png: ["image/png"],
  pdf: ["application/pdf"],
  php: ["application/x-httpd-php"],
  pkpass: ["application/vnd.apple.pkpass"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ],
  py: ["text/x-python"],
  pyc: ["application/x-python-code"],
  rar: ["application/vnd.rar"],
  rtf: ["application/rtf"],
  sh: ["application/x-sh"],
  sql: ["application/sql"],
  svg: ["image/svg+xml"],
  tar: ["application/x-tar"],
  tif: ["image/tiff"],
  tiff: ["image/tiff"],
  toml: ["application/toml"],
  ts: ["text/typescript", "video/mp2t", "video/vnd.dlna.mpeg-tts"],
  ttf: ["application/font-sfnt", "font/ttf"],
  txt: ["text/plain"],
  usdz: ["model/vnd.usdz+zip"],
  vsd: ["application/vnd.visio"],
  vtt: ["text/vtt"],
  wasm: ["application/wasm"],
  wav: ["audio/wav"],
  weba: ["video/webm"],
  webp: ["image/webp"],
  woff: ["font/woff"],
  woff2: ["font/woff2"],
  xhtml: ["application/xhtml+xml"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  xml: ["application/xml"],
  xul: ["application/vnd.mozilla.xul+xml"],
  yaml: ["application/yaml"],
  yml: ["application/yaml"],
  zip: ["application/zip", "application/x-zip-compressed"],
  "3gp": ["video/3gpp"],
  "3g2": ["video/3gpp2"],
  "7z": ["application/x-7z-compressed"]
} as const;

export type FileExtension = keyof typeof extMimeMap;

export type FileExtensionToMimeType<T extends FileExtension> =
  (typeof extMimeMap)[T][number];

export type AllMimeTypes = FileExtensionToMimeType<FileExtension>;

export type InferTopLevelPresent<T> = T extends `${infer U}/${string}` ? U : T;

export type PresentMimeTopLevelTypes = InferTopLevelPresent<AllMimeTypes>;

export type MimeTopLevelType =
  | "text"
  | "haptics"
  | "multipart"
  | "image"
  | "font"
  | "video"
  | "audio"
  | "application"
  | "model"
  | "message"
  | "example";

export class MimeService extends UrlService {
  constructor() {
    super();
  }
  public readonly mimeTypeObj = extMimeMap;

  public assetType<const T extends string>(url: T) {
    const parsed = this.parseUrl(url);
    if (!parsed) return undefined;
    const ext = parsed.pathname.split(/([.])/g)?.reverse()?.[0]?.toLowerCase();
    return ext && ext in this.mimeTypeObj ? (ext as FileExtension) : undefined;
  }

  public getMimes<const E extends FileExtension>(ext: E) {
    return this.mimeTypeObj[
      ext
    ] satisfies readonly FileExtensionToMimeType<E>[];
  }

  public getMimeFor<const E extends FileExtension>(
    ext: E,
    opts?: { type?: MimeTopLevelType }
  ): FileExtensionToMimeType<E> {
    const mimes = this.getMimes(ext);
    if (mimes.length === 1) return mimes[0];
    if (opts?.type) {
      const found = mimes.find(mime => mime.startsWith(opts.type + "/"));
      return found ?? mimes[0];
    }
    return mimes[0];
  }

  public isMimeFor<const E extends FileExtension>(
    ext: E,
    mime: FileExtensionToMimeType<E>
  ) {
    return this.getMimes(ext).find(s => s === mime);
  }
  public getMimeTypeForPath<T extends string>(
    path: T,
    opts?: { type?: MimeTopLevelType }
  ) {
    const ext = this.assetType(path);
    if (!ext) return "application/octet-stream";
    return this.getMimeFor(ext, opts);
  }
}
