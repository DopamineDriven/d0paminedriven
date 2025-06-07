# @d0paminedriven/fs

> *“Don’t sweat the small stuff; just write your damn files.”*

Let's be real, you likely already have a project manager breathing down your neck for updates on the hour, JIRA ticket blues bringing you down, Teams/Slack notification pings plaguing your dreams, the "hey, got five minutes?" guy breaking your flow state on the daily, and nth other pressing issues on your mind mid-development.

These situations are all annoying af, which is why this package seamlessly ensures that targeted output paths exist for you (if they don't exist yet, they will before your file is written). Whether you're using `writeFileAsync`, `fetchRemoteWriteLocalLargeFiles`, or `withWs`, this package has you covered no matter how deep your targeted output paths go. Unfortunately, this package *can't* help with that pesky PM or that flow-breaking co-worker (yet--PRs welcome).

Want to grab some remote files? Throw any file size its way &mdash; no problemo &mdash; just use the `fetchRemoteWriteLocalLargeFiles` method. (Proceed with caution in the >=gigabyte range. If your setup can handle it, then by all means.)

---

## 🚀 Quickstart

```ts
import { Fs } from "@d0paminedriven/fs";

// Set your cwd (project root recommended)
const fs = new Fs(process.cwd());

/** Write to a nested file path (no mkdirp needed) */
await fs.writeFileAsync("public/assets/images/foo/bar.jpg", myImageBuffer);
// No error, no “does this folder exist?”, no drama

/** Fetch and save a massive remote asset */
await fs.fetchRemoteWriteLocalLargeFiles(
  "https://cdn.example.com/big-model.glb",
  "public/models/my-big-model"
);
// Handles directories, streams file to disk, and never blows up your RAM

/** Read every file in a directory */
const files = fs.readDir("public/assets/images", { recursive: true });

/** Unlink a file (with existence check) */
await fs.unlink("public/assets/old/unused.txt");

/** Need a wait utility for your script? */
await fs.wait(2000); // waits 2 seconds

/** Get the MIME type for any file by extension */
const mime = fs.getMimeTypeForPath("foo.png"); // "image/png"
```

---

## 🍳 Recipes / Real-World Scripts

Need to audit or analyze files, generate a TypeScript object from your assets, or automate asset metadata?
Here’s a dead-simple pattern to iterate off of:

```ts

const files = fs.readDir("public/assets/images", { recursive: true });

/** Map those files to a typescript object with file names as keys + corresponding file sizes as values */
const arr = Array.of<[string, number]>();

function generateTsObjOfFileSizes(withExtensions = true) {
  try {
    files.forEach(function (file) {
      const size = fs.fileSizeMb(`public/assets/images/${file}`);
      if (withExtensions === false) {
        arr.push([file.split(/\./g)[0] ?? file, size]);
      } else {
        arr.push([file, size]);
      }
    });
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message);
    else console.error(`generateTsFileOfFileSizes`, err);
  } finally {
    const tupleArrToObj = Object.fromEntries(arr);
    fs.withWs(
      `src/utils/file-sizes.ts`,
      `export const publicAssetsImagesFileSizesMb = ${JSON.stringify(tupleArrToObj, null, 2)} as const;`
    );
  }
}

generateTsObjOfFileSizes();

```

*This outputs a TypeScript object you can use for dashboards, asset analytics, or CI/CD checks:*

```ts
export const fileSizesInMb = {
  "chess-atb.png": 1.1277456283569336,
  "elegant-stone-tiles-albedo.png": 53.93040370941162,
  "port-40.avif": 1.7613801956176758,
  "saeukkang.usdz": 3.6647157669067383
} as const;
```
<small>ⓘ assets used were pooled from repos across github via the `fetchRemoteWriteLocalLargeFiles` method</small>

<br>

---

|npm |downloads| github|
|:----:|:----:|:------:|
| [![npm](https://img.shields.io/npm/v/@d0paminedriven/fs?color=blue)](https://www.npmjs.com/package/@d0paminedriven/fs) | [![npm](https://img.shields.io/npm/dm/@d0paminedriven/fs)](https://www.npmjs.com/package/@d0paminedriven/fs) | <a style="fill:white;" href="https://github.com/DopamineDriven/d0paminedriven/tree/master/packages/fs"><svg height="24" aria-hidden="true" viewBox="0 0 24 24" version="1.1" width="24" data-view-component="true" class="octicon octicon-mark-github"><path d="M12 1C5.9225 1 1 5.9225 1 12C1 16.8675 4.14875 20.9787 8.52125 22.4362C9.07125 22.5325 9.2775 22.2025 9.2775 21.9137C9.2775 21.6525 9.26375 20.7862 9.26375 19.865C6.5 20.3737 5.785 19.1912 5.565 18.5725C5.44125 18.2562 4.905 17.28 4.4375 17.0187C4.0525 16.8125 3.5025 16.3037 4.42375 16.29C5.29 16.2762 5.90875 17.0875 6.115 17.4175C7.105 19.0812 8.68625 18.6137 9.31875 18.325C9.415 17.61 9.70375 17.1287 10.02 16.8537C7.5725 16.5787 5.015 15.63 5.015 11.4225C5.015 10.2262 5.44125 9.23625 6.1425 8.46625C6.0325 8.19125 5.6475 7.06375 6.2525 5.55125C6.2525 5.55125 7.17375 5.2625 9.2775 6.67875C10.1575 6.43125 11.0925 6.3075 12.0275 6.3075C12.9625 6.3075 13.8975 6.43125 14.7775 6.67875C16.8813 5.24875 17.8025 5.55125 17.8025 5.55125C18.4075 7.06375 18.0225 8.19125 17.9125 8.46625C18.6138 9.23625 19.04 10.2125 19.04 11.4225C19.04 15.6437 16.4688 16.5787 14.0213 16.8537C14.42 17.1975 14.7638 17.8575 14.7638 18.8887C14.7638 20.36 14.75 21.5425 14.75 21.9137C14.75 22.2025 14.9563 22.5462 15.5063 22.4362C19.8513 20.9787 23 16.8537 23 12C23 5.9225 18.0775 1 12 1Z"></path></svg></a>

---
