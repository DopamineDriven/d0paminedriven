import { tmpdir } from "os";
import { resolve } from "path";
import { Fs } from "@/index.ts";


/*
* This file exports all enum related types from the schema.
*
* 🟢 You can import this file directly.
*/

export const ReasoningEffort = {
  minimal: 'minimal',
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const

export type ReasoningEffort = (typeof ReasoningEffort)[keyof typeof ReasoningEffort]


export const OutputVerbosity = {
  low: 'low',
  medium: 'medium',
  high: 'high'
} as const

export type OutputVerbosity = (typeof OutputVerbosity)[keyof typeof OutputVerbosity]


export const CompatStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  FAILED: 'FAILED',
  ALIASED: 'ALIASED'
} as const

export type CompatStatus = (typeof CompatStatus)[keyof typeof CompatStatus]


export const ProviderAssetState = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED',
  DELETED: 'DELETED'
} as const

export type ProviderAssetState = (typeof ProviderAssetState)[keyof typeof ProviderAssetState]


export const AssetType = {
  DOCUMENT: 'DOCUMENT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  UNKNOWN: 'UNKNOWN'
} as const

export type AssetType = (typeof AssetType)[keyof typeof AssetType]


export const ChecksumAlgo = {
  CRC32: 'CRC32',
  CRC32C: 'CRC32C',
  SHA1: 'SHA1',
  SHA256: 'SHA256',
  CRC64NVME: 'CRC64NVME'
} as const

export type ChecksumAlgo = (typeof ChecksumAlgo)[keyof typeof ChecksumAlgo]


export const ImageFormat = {
  jpeg: 'jpeg',
  png: 'png',
  gif: 'gif',
  webp: 'webp',
  avif: 'avif',
  heic: 'heic',
  apng: 'apng',
  bmp: 'bmp',
  tiff: 'tiff',
  ico: 'ico',
  jxl: 'jxl',
  jp2: 'jp2',
  jpx: 'jpx',
  jxr: 'jxr',
  jls: 'jls',
  svg: 'svg',
  raw: 'raw',
  dng: 'dng',
  cr2: 'cr2',
  nef: 'nef',
  arw: 'arw',
  hdr: 'hdr',
  pic: 'pic',
  rgbe: 'rgbe',
  xyze: 'xyze',
  unknown: 'unknown'
} as const

export type ImageFormat = (typeof ImageFormat)[keyof typeof ImageFormat]


export const ColorModel = {
  rgb: 'rgb',
  rgba: 'rgba',
  grayscale: 'grayscale',
  grayscale_alpha: 'grayscale_alpha',
  indexed: 'indexed',
  cmyk: 'cmyk',
  ycbcr: 'ycbcr',
  ycck: 'ycck',
  vector: 'vector',
  lab: 'lab',
  unknown: 'unknown'
} as const

export type ColorModel = (typeof ColorModel)[keyof typeof ColorModel]


export const ColorSpace = {
  srgb: 'srgb',
  display_p3: 'display_p3',
  adobe_rgb: 'adobe_rgb',
  prophoto_rgb: 'prophoto_rgb',
  rec2020: 'rec2020',
  rec709: 'rec709',
  cmyk: 'cmyk',
  lab: 'lab',
  xyz: 'xyz',
  gray: 'gray',
  unknown: 'unknown'
} as const

export type ColorSpace = (typeof ColorSpace)[keyof typeof ColorSpace]


export const SenderType = {
  USER: 'USER',
  AI: 'AI',
  SYSTEM: 'SYSTEM'
} as const

export type SenderType = (typeof SenderType)[keyof typeof SenderType]


export const ThemePreference = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM'
} as const

export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference]


export const Provider = {
  OPENAI: 'OPENAI',
  GROK: 'GROK',
  GEMINI: 'GEMINI',
  ANTHROPIC: 'ANTHROPIC',
  META: 'META',
  VERCEL: 'VERCEL'
} as const

export type Provider = (typeof Provider)[keyof typeof Provider]


export const UploadMethod = {
  FETCHED: 'FETCHED',
  PRESIGNED: 'PRESIGNED',
  SERVER: 'SERVER',
  GENERATED: 'GENERATED'
} as const

export type UploadMethod = (typeof UploadMethod)[keyof typeof UploadMethod]


export const ImageGenStage = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  PERSISTING: 'PERSISTING',
  FINALIZING: 'FINALIZING',
  COMPLETED: 'COMPLETED',
  REFUSAL: 'REFUSAL',
  FAILED: 'FAILED',
  ABORTED: 'ABORTED'
} as const

export type ImageGenStage = (typeof ImageGenStage)[keyof typeof ImageGenStage]


export const MessageType = {
  AUDIO_GEN: 'AUDIO_GEN',
  COMPUTER_USE: 'COMPUTER_USE',
  IMAGE_GEN: 'IMAGE_GEN',
  TEXT: 'TEXT',
  VIDEO_GEN: 'VIDEO_GEN'
} as const

export type MessageType = (typeof MessageType)[keyof typeof MessageType]


export const ImageGenOutputKind = {
  PARTIAL: 'PARTIAL',
  FINAL: 'FINAL'
} as const

export type ImageGenOutputKind = (typeof ImageGenOutputKind)[keyof typeof ImageGenOutputKind]


export const AssetOrigin = {
  UPLOAD: 'UPLOAD',
  REMOTE: 'REMOTE',
  GENERATED: 'GENERATED',
  PASTED: 'PASTED',
  SCREENSHOT: 'SCREENSHOT',
  IMPORTED: 'IMPORTED',
  SCRAPED: 'SCRAPED'
} as const

export type AssetOrigin = (typeof AssetOrigin)[keyof typeof AssetOrigin]


export const AssetStatus = {
  REQUESTED: 'REQUESTED',
  PLANNED: 'PLANNED',
  UPLOADING: 'UPLOADING',
  STORED: 'STORED',
  SCANNING: 'SCANNING',
  READY: 'READY',
  FAILED: 'FAILED',
  QUARANTINED: 'QUARANTINED',
  ATTACHED: 'ATTACHED',
  DELETED: 'DELETED'
} as const

export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus]


const attachmentRecord = {
  size: 495841,
  providerLinks: [
    {
      size: 495841,
      id: "bllwrgwpsy76lul8hqpry204",
      attachmentId: "vpqiys4xuxvpysdcjyhup3gb",
      provider: "GEMINI",
      userKeyId: "w77r6tefzhojljoys7wuxpvs",
      keyFingerprint: "w77r6tefzhojljoys7wuxpvs",
      state: "ACTIVE",
      providerUri:
        "https://generativelanguage.googleapis.com/v1beta/files/vpqiys4xuxvpysdcjyhup3gb",
      containerRef: null,
      providerRef: "files/vpqiys4xuxvpysdcjyhup3gb",
      mime: "image/png",
      readyAt: new Date("2025-11-08T01:27:22.343Z"),
      expiresAt: new Date("2025-11-10T01:27:21.479Z"),
      lastCheckedAt: new Date("2025-11-08T01:27:22.343Z"),
      errorCode: null,
      errorMessage: null,
      createdAt: new Date("2025-11-08T01:27:20.564Z"),
      updatedAt: new Date("2025-11-08T01:27:22.344Z")
    }
  ],
  id: "vpqiys4xuxvpysdcjyhup3gb",
  conversationId: "a1mm2rcro2oz0yzstidz6thw",
  draftId: "nrr6h4r4480f6kviycyo1zhf~a1mm2rcro2oz0yzstidz6thw~batch_mhluwq73~0",
  batchId: "batch_mhluwq73",
  generationGroupId: null,
  seriesId: null,
  userId: "nrr6h4r4480f6kviycyo1zhf",
  messageId: "aenm7o6v4imsr5plm06y5yla",
  s3ObjectId:
    "s3://ws-server-assets-prod/upload/nrr6h4r4480f6kviycyo1zhf/1762338615146-claudtullus-wow.png#BOTNU_0.lmUkJQbzdrLYcNb.Rxb.NadD",
  origin: "UPLOAD",
  status: "READY",
  uploadMethod: "PRESIGNED",
  assetType: "IMAGE",
  uploadDuration: 791,
  cdnUrl:
    "https://assets.aicoalesce.com/upload/nrr6h4r4480f6kviycyo1zhf/1762338615146-claudtullus-wow.png",
  publicUrl:
    "https://ws-server-assets-prod.s3.us-east-1.amazonaws.com/upload/nrr6h4r4480f6kviycyo1zhf/1762338615146-claudtullus-wow.png",
  sourceUrl:
    "https://ws-server-assets-prod.s3.us-east-1.amazonaws.com/upload/nrr6h4r4480f6kviycyo1zhf/1762338615146-claudtullus-wow.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA3MSF7Z3NS5XCR5MM%2F20251105%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251105T103016Z&X-Amz-Expires=604800&X-Amz-Signature=f497f8b51d30476cd21fcc9ab22049987a7a263cc29636ed0b291e19d84ed222&X-Amz-SignedHeaders=host&versionId=BOTNU_0.lmUkJQbzdrLYcNb.Rxb.NadD&x-amz-checksum-mode=ENABLED&x-id=GetObject",
  thumbnailKey: null,
  compatMime: "image/png",
  compatExt: "png",
  compatVersionId: "BOTNU_0.lmUkJQbzdrLYcNb.Rxb.NadD",
  compatKey:
    "upload/nrr6h4r4480f6kviycyo1zhf/1762338615146-claudtullus-wow.png",
  compatS3ObjectId:
    "s3://ws-server-assets-prod/upload/nrr6h4r4480f6kviycyo1zhf/1762338615146-claudtullus-wow.png#BOTNU_0.lmUkJQbzdrLYcNb.Rxb.NadD",
  compatStatus: "ALIASED",
  compatReadyAt: new Date("2025-11-05T10:30:17.000Z"),
  compatCdnUrl:
    "https://assets.aicoalesce.com/upload/nrr6h4r4480f6kviycyo1zhf/1762338615146-claudtullus-wow.png",
  bucket: "ws-server-assets-prod",
  key: "upload/nrr6h4r4480f6kviycyo1zhf/1762338615146-claudtullus-wow.png",
  versionId: "BOTNU_0.lmUkJQbzdrLYcNb.Rxb.NadD",
  region: "us-east-1",
  cacheControl: null,
  contentDisposition: null,
  contentEncoding: null,
  expiresAt: new Date("2025-11-12T10:30:16.452Z"),
  filename: "claudtullus-wow.png",
  ext: "png",
  mime: "image/png",
  etag: "71606a4ff4452f7837265504948164e7",
  checksumAlgo: "CRC64NVME",
  checksumSha256: "X17UYID2/cQ=",
  storageClass: null,
  sseAlgorithm: null,
  sseKmsKeyId: null,
  s3LastModified: new Date("2025-11-05T10:30:17.000Z"),
  deletedAt: null,
  createdAt: new Date("2025-11-05T10:30:15.151Z"),
  updatedAt: new Date("2025-11-05T10:30:28.536Z"),
  image: {
    attachmentId: "vpqiys4xuxvpysdcjyhup3gb",
    format: "png",
    width: 688,
    height: 464,
    aspectRatio: 1.4827586206896552,
    frames: 1,
    hasAlpha: true,
    animated: false,
    orientation: null,
    colorSpace: "srgb",
    colorModel: "rgba",
    exifDateTimeOriginal: null,
    cameraMake: null,
    cameraModel: null,
    lensModel: null,
    gpsLat: null,
    gpsLon: null,
    dominantColorHex: null,
    iccProfile: null,
    createdAt: new Date("2025-11-05T10:30:16.615Z"),
    updatedAt: new Date("2025-11-05T10:30:16.615Z")
  },
  document: null,
  imageGenOutput: null
} as const

export class GrokFileServiceWorkup {
  protected fs: Fs;
  constructor(fs: Fs) {
    this.fs = fs;
  }
  private urlExtWorkup({
    cdnUrl,
    compatCdnUrl,
    compatStatus,
    ext,
    compatExt,
    id
  }: {
    id: string;
    compatStatus: CompatStatus | null;
    ext: string | null;
    compatExt: string | null;
    cdnUrl: string | null;
    compatCdnUrl: string | null;
  }) {
    const urlExtRecord = { url: "", ext: "" };
    try {
      if (!compatStatus)
        throw new Error(
          `no compat status associated with attachmentId ${id}; something went wrong...`
        );
      if (compatStatus === "ACTIVE" && compatCdnUrl && compatExt) {
        urlExtRecord.url = compatCdnUrl;
        urlExtRecord.ext = compatExt;
      }
      if (compatStatus === "ALIASED" && cdnUrl && ext) {
        urlExtRecord.url = cdnUrl;
        urlExtRecord.ext = ext;
      }
    } finally {
      return urlExtRecord;
    }
  }

  protected assetToTmpWorkup({
    cdnUrl,
    compatCdnUrl,
    compatExt,
    compatStatus,
    ext,
    id,
    userId
  }: {
    id: string;
    userId: string;
    compatStatus: CompatStatus | null;
    cdnUrl: string | null;
    compatCdnUrl: string | null;
    ext: string | null;
    compatExt: string | null;
  }) {
    const { ext: extension, url } = this.urlExtWorkup({
      cdnUrl,
      compatCdnUrl,
      compatStatus,
      compatExt,
      ext,
      id
    });
    const tmpPrefix = `xai-tmp-${userId}-${id}-${(compatStatus ?? "ALIASED").toLowerCase()}`;
    const tmpName = this.fs.uniqueTmpName(tmpPrefix, extension);
    const absTmpPath = resolve(tmpdir(), tmpName);
    return {
      tmpFilenamePrefix: tmpPrefix,
      tmpUniquename: tmpName,
      absTmpPath,
      ext: extension,
      remoteUrl: url
    };
  }

  public async remoteToTmpWorkup(att: typeof attachmentRecord) {
    const { absTmpPath, ext, tmpUniquename, tmpFilenamePrefix, remoteUrl } =
      this.assetToTmpWorkup(att);

    await this.fs.fetchRemoteWriteLocalLargeFiles(remoteUrl, absTmpPath, false);
    if (this.fs.existsTmp(tmpUniquename)) {
      return { tmpUniquename, absTmpPath, ext, tmpFilenamePrefix };
    } else {
      throw new Error(
        `no tmp file exists having filename ${tmpUniquename} at absolute path ${absTmpPath}`
      );
    }
  }
}

const fs = new Fs(process.cwd());

const grokFileService = new GrokFileServiceWorkup(fs);

(async () => {
  return await grokFileService.remoteToTmpWorkup(attachmentRecord);
})().then(async res => {
  const toBuffer = await fs.readTmpAsync(res.tmpUniquename);
  fs.withWs(`src/test/__out__/testing/tmp/${res.tmpUniquename}`, toBuffer);
  console.log(res);
  return;
});
