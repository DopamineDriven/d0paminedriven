import type * as $Enums from "@/enums.ts";

export interface Account {
  id: string;
  userId: string;
  type: string | null;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  access_token: string | null;
  expiresAt: Date | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  password: string | null;
  id_token: string | null;
  session_state: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface Attachment {
  id: string;
  conversationId: string | null;
  draftId: string | null;
  batchId: string | null;
  generationGroupId: string | null;
  seriesId: string | null;
  userId: string;
  messageId: string | null;
  s3ObjectId: string | null;
  origin: $Enums.AssetOrigin;
  status: $Enums.AssetStatus;
  uploadMethod: $Enums.UploadMethod;
  assetType: $Enums.AssetType;
  uploadDuration: number | null;
  cdnUrl: string | null;
  publicUrl: string | null;
  sourceUrl: string | null;
  thumbnailKey: string | null;
  compatMime: string | null;
  compatExt: string | null;
  compatVersionId: string | null;
  compatKey: string | null;
  compatS3ObjectId: string | null;
  compatStatus: $Enums.CompatStatus | null;
  compatReadyAt: Date | null;
  compatCdnUrl: string | null;
  bucket: string;
  key: string;
  versionId: string | null;
  region: string;
  cacheControl: string | null;
  contentDisposition: string | null;
  contentEncoding: string | null;
  expiresAt: Date | null;
  size: bigint | null;
  filename: string | null;
  ext: string | null;
  mime: string | null;
  etag: string | null;
  checksumAlgo: $Enums.ChecksumAlgo;
  checksumSha256: string | null;
  storageClass: string | null;
  sseAlgorithm: string | null;
  sseKmsKeyId: string | null;
  s3LastModified: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentProvider {
  id: string;
  attachmentId: string;
  provider: $Enums.Provider;
  userKeyId: string | null;
  keyFingerprint: string;
  state: $Enums.ProviderAssetState;
  providerUri: string | null;
  providerRef: string | null;
  mime: string | null;
  size: bigint | null;
  readyAt: Date | null;
  expiresAt: Date | null;
  lastCheckedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  indexedStoreRefs: string | null;
}

export interface AudioMetadata {
  attachmentId: string;
  format: string;
  duration: number;
  bitrate: number | null;
  sampleRate: number | null;
  channels: number | null;
  codec: string | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
  genre: string | null;
  waveformPeaks: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageMetadata {
  attachmentId: string;
  format: $Enums.ImageFormat;
  width: number;
  height: number;
  aspectRatio: number | null;
  frames: number;
  hasAlpha: boolean | null;
  animated: boolean;
  orientation: number | null;
  colorSpace: $Enums.ColorSpace | null;
  colorModel: $Enums.ColorModel | null;
  exifDateTimeOriginal: Date | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  gpsLat: number | null;
  gpsLon: number | null;
  dominantColorHex: string | null;
  iccProfile: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  attachmentId: string;
  format: string;
  pageCount: number | null;
  wordCount: number | null;
  language: string | null;
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string[];
  pdfVersion: string | null;
  isEncrypted: boolean;
  isSearchable: boolean;
  isLinearized: boolean | null;
  encoding: string | null;
  lineCount: number | null;
  textPreview: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  userKeyId: string | null;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string | null;
  parentId: string | null;
  isShared: boolean;
  shareToken: string | null;
}

export interface ConversationSettings {
  id: string;
  conversationId: string;
  systemPrompt: string | null;
  enableThinking: boolean | null;
  trackUsage: boolean | null;
  enableWebSearch: boolean | null;
  enableAssetGen: boolean | null;
  reasoningEffort: $Enums.ReasoningEffort | null;
  outputVerbosity: $Enums.OutputVerbosity | null;
  maxTokens: number | null;
  usageAlerts: boolean | null;
  temperature: number | null;
  topP: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageGenJob {
  id: string;
  requestMessageId: string;
  provider: $Enums.Provider;
  model: string;
  userId: string;
  userKeyId: string | null;
  keyFingerprint: string | null;
  prompt: string;
  systemPrompt: string | null;
  temperature: number | null;
  topP: number | null;
  nRequested: number;
  nCompleted: number;
  seed: number | null;
  negativePrompt: string | null;
  outputSize: string | null;
  outputQuality: string | null;
  outputFormat: string | null;
  outputBackground: string | null;
  outputCompression: number | null;
  partialImagesRequested: number | null;
  inputFidelity: string | null;
  personGeneration: string | null;
  moderation: string | null;
  stage: $Enums.ImageGenStage;
  progress: number;
  etaSeconds: number | null;
  durationMs: number | null;
  usage: number | null;
  revisedPrompt: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageGenOutput {
  id: string;
  jobId: string;
  jobIndex: number;
  kind: $Enums.ImageGenOutputKind;
  seriesIndex: number;
  seriesId: string;
  isPartial: boolean;
  attachmentId: string;
  width: number | null;
  height: number | null;
  mime: string | null;
  ext: string | null;
  revisedPrompt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMemoryStore {
  id: string;
  userId: string;
  embeddingModel: string;
  embeddingDim: number;
  totalChunks: number;
  totalTokens: bigint;
  totalConversations: number;
  schemaVersion: $Enums.MemorySchemaVersion;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMemoryContext {
  id: string;
  storeId: string;
  conversationId: string;
  schemaVersion: $Enums.MemorySchemaVersion;
  conversationTitle: string | null;
  firstMessageAt: Date | null;
  lastMessageAt: Date | null;
  rollingSummary: string | null;
  rollingSummaryModel: string | null;
  rollingSummaryProvider: $Enums.Provider | null;
  rollingSummaryTokens: number;
  rollingSummaryUpdatedAt: Date | null;
  /**
   * fold-job lifecycle — QUEUED until the first fold; SUMMARIZING during; READY/ERROR after.
   * Makes a died-mid-fold process observable and reclaimable, mirroring the chunk side.
   */
  rollingSummaryState: $Enums.MemorySummaryState;
  /**
   * fold-prompt era that produced the current rolling summary
   */
  rollingSummaryReasoningVersion: $Enums.MemoryRollingSummaryReasoningVersion;
  /**
   * wall-clock ms spent inside adaptive-thinking blocks across the fold call (stream-event timed)
   */
  rollingSummaryReasoningDuration: number;
  /**
   * captured thinking-block text — visibility into how the fold reaches its conclusions
   */
  rollingSummaryReasoningText: string | null;
  /**
   * JSON trace of in-house tool calls (file_search) during the fold: name, input, output per round
   */
  rollingSummaryReasoningToolUseRaw: string | null;
  /**
   * Indexing watermark: every ordinal < this value is covered by a chunk row.
   * Advanced ONLY via the claim CAS (claimMemorySection.sql). Never cached in-process.
   */
  lastIndexedOrdinalExclusive: number;
  lastChunkedAt: Date | null;
  totalTurns: number;
  chunkedTurns: number;
  totalTokens: number;
  contributingProviderModelsRaw: string | null;
  createdAt: Date;
  updatedAt: Date;
  hasMultipleProviders: boolean;
  hasMultipleModels: boolean;
}

export interface ConversationMemoryChunk {
  id: string;
  /**
   * "${conversationId}-${ordinalStart}-${ordinalEndExclusive}-${schemaVersion}"
   */
  provenanceId: string;
  contextId: string;
  storeId: string;
  conversationId: string;
  chunkIndex: number;
  /**
   * covered messages: ordinalStart <= msg.ordinal < ordinalEndExclusive (0-based)
   */
  ordinalStart: number;
  ordinalEndExclusive: number;
  messageIdStart: string;
  messageIdEnd: string;
  messageTimestampStart: Date;
  messageTimestampEnd: Date;
  /**
   * Rendered from Message rows ordered by ordinal ASC. Append-only history is a
   * standing assumption — a future message-edit feature must invalidate covering chunks.
   */
  transcriptMarkdown: string;
  rendererVersion: $Enums.MemoryTranscriptRendererVersion;
  transcriptIncludesThinking: boolean;
  contentHash: string;
  chunkedMessagesCount: number;
  tokenCount: number;
  /**
   * "ANTHROPIC:claude-opus-4-5-20251101::GROK:grok-4-1-fast-reasoning::GEMINI:gemini-3.1-pro-preview::.."
   */
  providerModelsRaw: string;
  hasAttachments: boolean;
  chunkedAttachmentsCount: number | null;
  /**
   * "convId-msgId-attId-hexEncodedFilename.ext::convId-msgId-attId-hexEncodedFilename.ext"
   */
  attachmentProvenanceIdsRaw: string | null;
  embeddingModel: string;
  /**
   * metadata for mixed-era retrieval; the column type itself pins 1024
   */
  embeddingDim: number;
  embeddedAt: Date | null;
  schemaVersion: $Enums.MemorySchemaVersion;
  boundaryReason: $Enums.MemoryChunkBoundaryReason | null;
  chunkingState: $Enums.MemoryChunkingState;
  chunkingError: string | null;
  retryCount: number;
  summary: string | null;
  summaryState: $Enums.MemorySummaryState;
  summaryModel: string | null;
  /**
   * wall-clock ms spent inside adaptive-thinking blocks across the summary call (stream-event timed)
   */
  summaryReasoningDuration: number;
  /**
   * captured thinking-block text — visibility into how the summarizer reaches its conclusions
   */
  summaryReasoningText: string | null;
  /**
   * JSON trace of in-house tool calls (file_search) during summarization: name, input, output per round
   */
  summaryToolUseRaw: string | null;
  summaryProvider: $Enums.Provider | null;
  summaryPromptVersion: $Enums.MemoryChunkSummaryPromptVersion;
  summaryTokens: number;
  summaryError: string | null;
  summaryRetryCount: number;
  summaryGeneratedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  ordinal: number;
  conversationId: string;
  userId: string | null;
  senderType: $Enums.SenderType;
  provider: $Enums.Provider;
  model: string | null;
  userKeyId: string | null;
  content: string;
  conversationMemoryChunkId: string | null;
  thinkingText: string | null;
  thinkingDuration: number | null;
  responseOutput: string | null;
  isImageGen: boolean;
  messageType: $Enums.MessageType;
  liked: boolean | null;
  disliked: boolean | null;
  tryAgain: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageBlock {
  id: string;
  conversationId: string;
  messageId: string;
  ordinal: number;
  content: string;
  type: $Enums.MessageBlockType;
  durationMs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  bio: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
  userId: string;
}

export interface AttachmentProvider {
  id: string;
  attachmentId: string;
  provider: $Enums.Provider;
  userKeyId: string | null;
  keyFingerprint: string;
  state: $Enums.ProviderAssetState;
  providerUri: string | null;
  providerRef: string | null;
  mime: string | null;
  size: bigint | null;
  readyAt: Date | null;
  expiresAt: Date | null;
  lastCheckedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  indexedStoreRefs: string | null;
}

export interface ProviderStore {
  id: string;
  userId: string;
  provider: $Enums.Provider;
  storeRef: string;
  storeName: string;
  fileCount: number;
  totalBytes: bigint | null;
  providerStoreCreatedAt: Date | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderStoreDocument {
  id: string;
  storeId: string;
  attachmentId: string;
  provider: $Enums.Provider;
  docRef: string;
  docUri: string | null;
  filename: string;
  state: $Enums.ProviderDocState;
  indexedAt: Date | null;
  mimeType: string;
  errorMessage: string | null;
  lastAccessed: Date | null;
  createdAt: Date;
  updatedAt: Date;
  size: bigint | null;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  email_verified: boolean | null;
  image: string | null;
  isAnonymous: boolean | null;
  lastLoginMethod: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TTSJob {
  id: string;
  conversationId: string;
  sourceMessageId: string;
  userId: string;
  provider: string;
  /**
   * xAI voice ids -> "eve" | "ara" | "rex" | "sal" | "leo" | "una"
   */
  voice: string;
  /**
   * BCP-47 language codes | "auto"
   */
  language: string;
  /**
   * wav | mp3 | pcm | aac | opus | flac | mulaw | alaw, etc
   */
  codec: string;
  /**
   * xAI sample rates -> 8000 | 16000 | 22050 | 24000 | 44100 | 48000
   */
  sampleRate: number | null;
  /**
   * xAI bitrates -> 32000 | 64000 | 96000 | 128000 | 192000
   */
  bitrate: number | null;
  cdnUrl: string | null;
  /**
   * input character count
   */
  charCount: number;
  status: $Enums.TTSStatus;
  durationMs: number | null;
  generationMs: number | null;
  sizeBytes: bigint | null;
  error: string | null;
  attachmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserKey {
  id: string;
  userId: string;
  provider: $Enums.Provider;
  apiKey: string;
  iv: string;
  authTag: string;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

export interface UserStore {
  id: string;
  userId: string;
  storeName: string;
  /**
   * voyage-multimodal-3.5 for content containing visual media -- voyage-context-4 otherwise
   */
  defaultEmbeddingModel: string;
  /**
   * default:1024 -> voyage-multimodal-3.5 and voyage-context-4 both support 256 | 512 | 1024 | 2048
   */
  defaultEmbeddingDim: number;
  fileCount: number;
  totalBytes: bigint | null;
  totalChunks: number;
  schemaVersion: $Enums.UserStoreSchemaVersion;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStoreDoc {
  id: string;
  storeId: string;
  attachmentId: string;
  conversationId: string;
  messageId: string;
  /**
   * CDN URL (s3->Cloudfront) of source asset
   */
  originatingUrl: string;
  originatingModel: string | null;
  originatingProvider: $Enums.Provider | null;
  /**
   * ${conversationId}-${messageId}-${attachmentId}-${hexFilename}.${ext}
   */
  provenanceId: string;
  filename: string;
  mimeType: string;
  ext: string;
  size: bigint;
  schemaVersion: $Enums.UserStoreSchemaVersion;
  /**
   * `voyage-context-4` (if no media detected or a txt based file) | `voyage-multimodal-3.5` (for preservation of all media in embedded context)
   */
  embeddingModel: string;
  /**
   * 256 | 512 | 1024 | 2048
   */
  embeddingDim: number;
  hasVisualMedia: boolean;
  /**
   * null when hasVisualMedia=false
   */
  visualMediaSource: $Enums.VisualMediaSource | null;
  /**
   * null when hasVisualMedia=false
   */
  visualMediaContent: $Enums.VisualMediaContent | null;
  pageCount: number | null;
  extractedTextLength: number | null;
  imageCount: number | null;
  /**
   * stored in string form with clear separators 1::15::18::21::45... -> parsed to number[]
   */
  imagePages: string | null;
  /**
   * stored in string form with clear separators 1::12::25::165::273... -> parsed to number[]
   */
  annotPages: string | null;
  /**
   * "mime:application/pdf" | "probe:hasVisualMedia" | etc
   */
  modelSelectionReason: string | null;
  indexedAt: Date | null;
  errorMessage: string | null;
  lastAccessed: Date | null;
  state: $Enums.UserStoreDocState;
  chunkCount: number;
  tokenCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id: string;
  userId: string;
  theme: $Enums.ThemePreference | null;
  defaultProvider: $Enums.Provider | null;
  defaultModel: string | null;
}

export interface UserStoreDocAnnot {
  id: string;
  docId: string;
  subtype: $Enums.AnnotSubtype;
  uri: string;
  /**
   * [x1, y1, x2, y2] from PDF coordinate space
   */
  rect: number[];
  /**
   * character count start offset
   */
  startOffset: number;
  /**
   * character count end offset
   */
  endOffset: number;
  /**
   * only applicable for pdfs
   */
  pageNumber: number | null;
  /**
   * resolved cross-references (populated async after indexing)
   */
  isCdnLink: boolean;
  linkedDocId: string | null;
  attachmentId: string | null;
  createdAt: Date;
}

export interface UserStoreDocChunk {
  id: string;
  docId: string;
  storeId: string;
  chunkProvenanceId: string;
  provenanceId: string;
  attachmentId: string;
  conversationId: string;
  messageId: string;
  chunkIndex: number;
  content: string;
  /**
   * sha256(content + offsets + schemaVersion)
   */
  contentHash: string;
  tokenCount: number;
  /**
   * character count start offset
   */
  startOffset: number;
  /**
   * character count end offset
   */
  endOffset: number;
  /**
   * only applicable for pdfs
   */
  pageStartOffset: number | null;
  /**
   * only applicable for pdfs
   */
  pageEndOffset: number | null;
  /**
   * `voyage-context-4` (if no media detected or a txt based file) | `voyage-multimodal-3.5` (for preservation of all media in embedded context)
   */
  embeddingModel: string;
  hasImages: boolean;
  hasAnnots: boolean;
  state: $Enums.UserStoreChunkState;
  errorMessage: string | null;
  retryCount: number;
  schemaVersion: $Enums.UserStoreSchemaVersion;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Verification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoMetadata {
  attachmentId: string;
  format: string;
  width: number;
  height: number;
  aspectRatio: number | null;
  duration: number;
  frameRate: number | null;
  bitrate: number | null;
  codec: string | null;
  hasAudio: boolean;
  resolution: string | null;
  orientation: number | null;
  rotation: number | null;
  thumbnailCount: number | null;
  keyframeTimes: number[];
  createdAt: Date;
  updatedAt: Date;
}
