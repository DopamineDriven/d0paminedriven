# @d0paminedriven/fs

> **The filesystem utilities that eliminate entire categories of bugs from your codebase.**

## 🎯 Why This Package Exists

**Stop checking if directories exist.** Stop worrying about MIME types. Stop blowing up your RAM with large files. Stop writing the same filesystem boilerplate over and over.

This package solves real problems that `fs-extra` and other utilities ignore:

- ✅ **Atomic directory creation with write operations** - One method, zero directory anxiety
- ✅ **Intelligent MIME type handling** - Bidirectional mapping with compile-time safety
- ✅ **Memory-safe remote asset fetching** - Stream gigabyte files without fear
- ✅ **Native image dimension extraction** - Get width, height, format without dependencies
- ✅ **Tmp directory management** - Complete utilities for temporary file operations
- ✅ **Type-safe throughout** - Full TypeScript with literal types and inference

## 🚀 The Revolutionary `withWs` Method

**This single method has eliminated "directory doesn't exist" errors for 3+ years:**

```typescript
// What everyone else does (including fs-extra):
await fs.mkdir('/deep/nested/path', { recursive: true });
const stream = fs.createWriteStream('/deep/nested/path/file.json');
stream.write(data);
// 3 operations, multiple points of failure, mental overhead

// What withWs does:
fs.withWs('/deep/nested/path/file.json', data);
// ONE operation. Directories created atomically with write stream. 
// No await needed. No directory checks. Just works.
```

---

## 📦 Installation

```bash
pnpm add @d0paminedriven/fs
# or
npm install @d0paminedriven/fs
```

## 🔥 Core Features

### 1. Smart Remote Asset Fetching

**Handles URLs without extensions intelligently:**

```typescript
const fs = new Fs(process.cwd());

// URLs with no extension? No problem!
// Automatically detects MIME type from Content-Type header
await fs.fetchRemoteWriteLocalLargeFiles(
  "https://api.example.com/asset/12345",  // No extension in URL
  "public/assets/downloaded-file"         // Extension auto-detected
);
// Result: public/assets/downloaded-file.png (if Content-Type was image/png)

// Streams large files without memory explosion
await fs.fetchRemoteWriteLocalLargeFiles(
  "https://cdn.example.com/huge-video.mp4",  // 2GB file? No problem
  "public/videos/my-video"
);
```

### 2. 🏆 Native Image Metadata Extraction - Zero Dependencies, Maximum Performance

**Industry-leading performance with pure Node.js Buffer operations:**

#### Performance Benchmarks
```typescript
// Real-world performance metrics:
// 📊 222 KB JPEG parsed in 2.5ms
// 🚀 53.9 MB PNG parsed in 69.6ms
// That's ~775 MB/second throughput!

const metadata = await fs.getImageSpecs("massive-image.png");
// Completes in milliseconds, not seconds
```

#### Comprehensive Metadata Extraction
```typescript
// testing with a 4k PBR Texture
let timer0 = 0;
const getPerf = () => {
  timer0 = performance.now();
  return fsx.getImageSpecs("src/test/__gen__/elegant-stone-tiles-albedo.png");
};

getPerf().then(data => {
  console.log(performance.now() - timer0);
  console.log(data);
});
// 69.642293 ms
// 53.9 MB Image
// {
//   width: 4096,
//   height: 4096,
//   format: 'png',
//   frames: 1,               // Animation frame count
//   animated: false,         // GIF/WebP/AVIF animation detection
//   hasAlpha: true,          // Alpha channel detection
//   orientation: 6,          // EXIF orientation (1-8)
//   aspectRatio: 1.0,        // Calculated aspect ratio
//   colorSpace: 'rgba',      // Color space detection
//   iccProfile: 'sRGB',      // Embedded color profile
//   exifDateTimeOriginal: '2024:01:15 14:30:00'  // EXIF timestamp
// }
```

#### Supported Formats & Advanced Features

| Format | Dimensions | Color Space | Alpha | Animation | EXIF | ICC Profile |
|--------|------------|-------------|-------|-----------|------|-------------|
| PNG    | ✅ | ✅ | ✅ | ✅ (APNG) | ✅ | ✅ |
| JPEG   | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| WebP   | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GIF    | ✅ | ✅ | ✅* | ✅ | ❌ | ❌ |
| BMP    | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| AVIF   | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*GIF transparency is binary (not full alpha)

#### Why This Implementation Is Exceptional

1. **Pure Node.js** - No ImageMagick, no Sharp, no native bindings
2. **Streaming Reads** - Only reads necessary bytes (headers), not entire file
3. **O(1) Memory** - 54MB file uses same memory as 1KB file
4. **Sub-100ms** - Even gigantic images parse in milliseconds
5. **Production Ready** - Handles malformed images gracefully
6. **Rich Metadata** - Not just dimensions, but color profiles, timestamps, orientation

#### Real-World Use Cases

```typescript
// Validate uploads without loading entire image
async function validateImageUpload(filePath: string) {
  const meta = await fs.getImageSpecs(filePath);
  
  if (meta.width > 4096 || meta.height > 4096) {
    throw new Error("Image too large");
  }
  
  if (meta.animated && meta.frames > 100) {
    throw new Error("Too many animation frames");
  }
  
  return meta;
}

// Generate responsive image sets
async function generateSrcSet(imagePath: string) {
  const { width, height, format } = await fs.getImageSpecs(imagePath);
  
  // Use dimensions to calculate breakpoints
  const breakpoints = [width, width * 0.75, width * 0.5, width * 0.25]
    .filter(w => w >= 320);
    
  // Process only what's needed
  return breakpoints;
}

// Smart gallery organization
async function organizePhotoLibrary(photoDir: string) {
  const photos = fs.readDir(photoDir);
  const metadata = await Promise.all(
    photos.map(async (photo) => ({
      file: photo,
      ...await fs.getImageSpecs(`${photoDir}/${photo}`),
      size: fs.getSize(fs.fileSize(`${photoDir}/${photo}`, "auto"))
    }))
  );
  
  // Group by orientation, date, aspect ratio, etc.
  const landscape = metadata.filter(m => m.aspectRatio > 1);
  const portrait = metadata.filter(m => m.aspectRatio < 1);
  const animated = metadata.filter(m => m.animated);
  
  return { landscape, portrait, animated };
}
```

#### Technical Implementation Highlights

- **Binary Header Parsing** - Direct buffer operations for each format's signature
- **Chunk-Based Reading** - PNG chunks, WebP VP8/VP8L/VP8X, AVIF boxes
- **EXIF Parsing** - Native TIFF/IFD parsing for orientation & timestamps  
- **Color Profile Detection** - ICC, sRGB, Adobe RGB detection
- **Animation Analysis** - Frame counting for GIF, APNG, WebP, AVIF
- **Efficient Scaling** - 243x file size difference = only 27x time difference

This isn't just reading image dimensions - it's a complete image intelligence system that rivals enterprise solutions, delivered in a fraction of the time with zero dependencies.

### 3. Intelligent MIME Type System

```typescript
// Bidirectional MIME mapping with full type safety
const mimeType = fs.getMimeTypeForPath("file.tsx");  // "text/tsx"
const extension = fs.mimeToExt("application/pdf");   // "pdf"

// Handles edge cases elegantly
fs.getMimeTypeForPath("no-extension");    // "application/octet-stream"
fs.mimeToExt("image/jpeg");              // "jpg" (returns common extension)
```

### 4. Tmp Directory Management Suite

```typescript
// Write to tmp with automatic cleanup
const tmpPath = fs.writeTmp("session-data.json", JSON.stringify(data));

// Generate unique tmp filenames
const uniqueName = fs.uniqueTmpName("upload", "bin");
// Result: "upload-1701234567890-x7y8z9.bin"

// Scan tmp directory (non-recursive by default to avoid permission issues)
const tmpFiles = fs.scanTmp("session-");  // Find all session files
const regexFiles = fs.scanTmp(/\.json$/);  // Regex pattern support

// Remove individual tmp files with precision
fs.rmTmpFile("session-abc123.json");  // Targeted single file removal

// Extract files from tmp to permanent location
fs.extractFromTmp("processed-", "./output", { 
  cleanupAfter: true  // Auto-remove from tmp after extraction
});

// Cleanup old tmp files
fs.cleanupTmp("cache-", 60 * 60 * 1000);  // Remove files older than 1 hour

// Async generator for batch removal with progress tracking
for await (const progress of fs.cleanTmpGenerator("upload-", 20)) {
  // Process files in batches of 20 with real-time progress
  console.log(`Batch ${progress.batchNumber}/${progress.totalBatches}`);
}
```

### 5. The Legendary `withWs` Method

```typescript
// Deep nested paths? Complex directory structures? Don't care.
fs.withWs(
  "output/2024/reports/january/week-1/summary.json",
  JSON.stringify(reportData)
);
// Creates all 5 directories if needed, writes file, done.

// Works with any data type
fs.withWs("public/images/avatar.png", imageBuffer);
fs.withWs("logs/error.log", "Error: " + errorMessage);
fs.withWs("data/binary.dat", binaryData);
```

---

## 🎨 Real-World Examples

### Image Asset Pipeline

```typescript
const fs = new Fs(process.cwd());

async function processImageAssets() {
  // Fetch remote images with automatic extension detection
  const imageUrls = [
    "https://api.unsplash.com/photos/random",  // No extension!
    "https://cdn.example.com/hero-image",       // No extension!
    "https://example.com/logo.avif"              // Has extension
  ];
  
  for (const url of imageUrls) {
    // Extension auto-detected from Content-Type
    await fs.fetchRemoteWriteLocalLargeFiles(
      url,
      `public/images/${Date.now()}`
    );
  }
  
  // Get dimensions for all downloaded images
  const images = fs.readDir("public/images");
  const metadata = images.map(img => ({
    file: img,
    ...fs.getImageSpecs(`public/images/${img}`),
    size: fs.getSize(`public/images/${img}`)
  }));
  
  // Generate TypeScript metadata file
  fs.withWs(
    "src/generated/image-metadata.ts",
    `export const imageMetadata = ${JSON.stringify(metadata, null, 2)} as const;`
  );
}
```

### Temporary File Processing

```typescript
async function processUpload(fileBuffer: Buffer, userId: string) {
  const fs = new Fs(process.cwd());
  
  // Generate unique tmp filename
  const tmpName = fs.uniqueTmpName(`upload-${userId}`, "dat");
  
  // Write to tmp for processing
  const tmpPath = fs.writeTmp(tmpName, fileBuffer);
  
  // Process the file (resize, convert, etc.)
  const processed = await processFile(tmpPath);
  
  // Move to permanent storage
  fs.withWs(`uploads/${userId}/${Date.now()}.jpg`, processed);
  
  // Cleanup tmp (or let cleanupTmp handle it later)
  fs.cleanupTmp(`upload-${userId}`);
}
```

### Advanced Tmp Management

#### Granular Single File Removal
```typescript
const fs = new Fs(process.cwd());

// Create some tmp files
const tmpFile1 = fs.uniqueTmpName("session", "json");
const tmpFile2 = fs.uniqueTmpName("cache", "dat");
fs.writeTmp(tmpFile1, JSON.stringify({ user: "123" }));
fs.writeTmp(tmpFile2, Buffer.from("cached data"));

// Remove a specific tmp file
fs.rmTmpFile(tmpFile1); // Removes only session-*.json file

// Or find and remove specific files
const sessionFiles = fs.scanTmp("session");
sessionFiles.forEach(file => fs.rmTmpFile(file));
```

#### Batch Removal with Progress Tracking
```typescript
async function cleanupWithProgress() {
  const fs = new Fs(process.cwd());
  
  // Clean tmp files in batches with real-time progress
  for await (const progress of fs.cleanTmpGenerator("upload-", 25)) {
    if (progress.action === 'removing') {
      console.log(`Processing batch ${progress.batchNumber}/${progress.totalBatches}`);
      console.log(`Files in batch: ${progress.batch.length}`);
    } else if (progress.action === 'batch-complete') {
      console.log(`Batch complete! Removed: ${progress.totalRemoved}`);
      console.log(`Remaining: ${progress.remaining}`);
    }
  }
}

// Using regex patterns for more complex matching
async function cleanupPatterns() {
  const fs = new Fs(process.cwd());
  
  // Match multiple patterns with regex
  const pattern = /(session|cache|upload)-.*/;
  
  for await (const progress of fs.cleanTmpGenerator(pattern, 50)) {
    // Process large batches of 50 files at a time
    if (progress.action === 'batch-complete') {
      console.log(`Batch ${progress.batchNumber}: Removed ${progress.batchSize} files`);
    }
  }
}
```

### Build-Time Asset Generation

```typescript
// Generate a manifest of all assets with sizes and dimensions
function generateAssetManifest() {
  const fs = new Fs(process.cwd());
  const assets: Record<string, any> = {};
  
  // Scan all asset directories
  const images = fs.readDir("public/images", { recursive: true });
  const videos = fs.readDir("public/videos", { recursive: true });
  
  // Process images
  images.forEach(img => {
    const path = `public/images/${img}`;
    assets[img] = {
      type: "image",
      mime: fs.getMimeTypeForPath(img),
      size: fs.autoFileSizeRaw(path),
      dimensions: fs.getImageSpecs(path)
    };
  });
  
  // Process videos
  videos.forEach(vid => {
    const path = `public/videos/${vid}`;
    assets[vid] = {
      type: "video",
      mime: fs.getMimeTypeForPath(vid),
      size: fs.autoFileSizeRaw(path)
    };
  });
  
  // Write manifest (directories auto-created)
  fs.withWs(
    "src/generated/assets/manifest.json",
    JSON.stringify(assets, null, 2)
  );
}
```

## 📊 Performance & Architecture

### Why It's Fast

- **Stream-based file operations** - Never loads entire files into memory
- **Parallel directory creation** - Uses `finally` blocks for guaranteed execution
- **Zero unnecessary checks** - No redundant `fs.exists()` calls
- **Optimized MIME lookups** - O(1) bidirectional mapping with Map structures

### Memory Safety

```typescript
// This won't blow up your RAM, even with a 10GB file
await fs.fetchRemoteWriteLocalLargeFiles(
  "https://example.com/massive-file.zip",
  "downloads/massive-file"
);

// Internally uses streams:
// response.body.pipe(fs.createWriteStream(path))
// Instead of loading entire file into memory
```

## 🛠️ Complete API Reference

### Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `withWs(path, data, options?)` | Write with automatic directory creation | `WriteStream` |
| `writeFileAsync(path, data)` | Async file write with directory creation | `Promise<void>` |
| `readDir(path, options?)` | Read directory contents | `string[]` |
| `fileToBuffer(path)` | Read file as Buffer | `Buffer` |
| `exists(path)` | Check if path exists | `boolean` |
| `rmFile(path)` | Remove file | `void` |
| `rmDirSync(path)` | Remove directory | `void` |

### Remote Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `fetchRemoteWriteLocalLargeFiles(url, outputPath)` | Stream remote file to disk | `Promise<void>` |
| `assetToBufferView(url)` | Fetch remote asset as buffer | `Promise<{buffer, b64, mime}>` |

### Image Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `getImageSpecs(path)` | Extract image dimensions | `{width, height, type}` |
| `imageTransform(target, options)` | Transform images with Sharp | `Promise<Buffer>` |
| `cleanDataUrl(dataUrl)` | Strip data URL prefix | `string` |
| `b64ToBlob(b64, mime?)` | Convert base64 to Blob | `Blob` |

### MIME Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `getMimeTypeForPath(path)` | Get MIME type from file path | `string` |
| `mimeToExt(mime)` | Convert MIME to extension | `string` |
| `getExtensionForMimeType(mime)` | Get extension from MIME | `string \| undefined` |

### Tmp Directory Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `writeTmp(filename, data)` | Write to tmp directory | `string` (path) |
| `readTmp(filename)` | Read from tmp directory | `Buffer` |
| `scanTmp(pattern?)` | List tmp directory contents | `string[]` |
| `extractFromTmp(pattern, target, options?)` | Extract files from tmp | `string[]` |
| `cleanupTmp(pattern, maxAge?)` | Remove tmp files | `number` (removed) |
| `uniqueTmpName(prefix?, ext?)` | Generate unique tmp filename | `string` |

### Utility Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `wait(ms)` | Async delay utility | `Promise<void>` |
| `getSize(path)` | Human-readable file size | `string` |
| `fileSizeMb(path)` | File size in MB | `number` |
| `autoFileSizeRaw(path)` | Auto-formatted size object | `{size, unit}` |
| `chunkArray(array, size)` | Split array into chunks | `T[][]` |

## 🚦 Migration Guide

### From fs-extra

```typescript
// Before (fs-extra)
await fs.ensureDir('/path/to/dir');
await fs.writeFile('/path/to/dir/file.json', data);

// After (@d0paminedriven/fs)
fs.withWs('/path/to/dir/file.json', data);
```

### From Native fs

```typescript
// Before (native fs)
import { mkdir, writeFile } from 'fs/promises';
await mkdir('/path/to/dir', { recursive: true });
await writeFile('/path/to/dir/file.json', data);

// After (@d0paminedriven/fs)
fs.withWs('/path/to/dir/file.json', data);
```

## 💡 Philosophy

This package embodies a simple philosophy: **filesystem operations should be atomic, safe, and obvious**. 

- **Atomic**: Operations either fully succeed or fully fail
- **Safe**: No memory explosions, no race conditions
- **Obvious**: One method does one thing well

The `withWs` method is the crown jewel - it eliminates an entire category of bugs (missing directories) that plague every Node.js application. After using it for 3+ years, the creator literally forgot that "directory doesn't exist" errors were even a thing.

---

|npm |downloads| github|
|:----:|:----:|:------:|
| [![npm](https://img.shields.io/npm/v/@d0paminedriven/fs?color=blue)](https://www.npmjs.com/package/@d0paminedriven/fs) | [![npm](https://img.shields.io/npm/dm/@d0paminedriven/fs)](https://www.npmjs.com/package/@d0paminedriven/fs) | <a style="fill:white;" href="https://github.com/DopamineDriven/d0paminedriven/tree/master/packages/fs"><svg height="24" aria-hidden="true" viewBox="0 0 24 24" version="1.1" width="24" data-view-component="true" class="octicon octicon-mark-github"><path d="M12 1C5.9225 1 1 5.9225 1 12C1 16.8675 4.14875 20.9787 8.52125 22.4362C9.07125 22.5325 9.2775 22.2025 9.2775 21.9137C9.2775 21.6525 9.26375 20.7862 9.26375 19.865C6.5 20.3737 5.785 19.1912 5.565 18.5725C5.44125 18.2562 4.905 17.28 4.4375 17.0187C4.0525 16.8125 3.5025 16.3037 4.42375 16.29C5.29 16.2762 5.90875 17.0875 6.115 17.4175C7.105 19.0812 8.68625 18.6137 9.31875 18.325C9.415 17.61 9.70375 17.1287 10.02 16.8537C7.5725 16.5787 5.015 15.63 5.015 11.4225C5.015 10.2262 5.44125 9.23625 6.1425 8.46625C6.0325 8.19125 5.6475 7.06375 6.2525 5.55125C6.2525 5.55125 7.17375 5.2625 9.2775 6.67875C10.1575 6.43125 11.0925 6.3075 12.0275 6.3075C12.9625 6.3075 13.8975 6.43125 14.7775 6.67875C16.8813 5.24875 17.8025 5.55125 17.8025 5.55125C18.4075 7.06375 18.0225 8.19125 17.9125 8.46625C18.6138 9.23625 19.04 10.2125 19.04 11.4225C19.04 15.6437 16.4688 16.5787 14.0213 16.8537C14.42 17.1975 14.7638 17.8575 14.7638 18.8887C14.7638 20.36 14.75 21.5425 14.75 21.9137C14.75 22.2025 14.9563 22.5462 15.5063 22.4362C19.8513 20.9787 23 16.8537 23 12C23 5.9225 18.0775 1 12 1Z"></path></svg></a>

## 📜 License

MIT © [DopamineDriven](https://github.com/DopamineDriven)

---

**Built with frustration, refined with experience, shared with love.** 🚀
