import { default as Fs } from "@/fs/index.ts";

const fs = new Fs(process.cwd());
/**
 * recursively read directories (or not)
 */
const files = fs.readDir("src/test/__gen__", { recursive: true });

/** Map those files to a typescript object with file names as keys + corresponding file sizes as values */
const arr = Array.of<[string, number]>();

// (async () =>
//   files.map(file => {
//     const size = fs.fileSizeMb(`src/test/__gen__/${file}`);
//     arr.push([file, size]);
//   }))().then(() => {
//   fs.withWs(
//     `src/test/__out__/file-sizes.ts`,
//     `export const fileSizesInMb = ${JSON.stringify(Object.fromEntries(arr), null, 2)} as const;`
//   );
// });

function generateTsFileOfFileSizes(withExtensions = true) {
  try {
    files.forEach(function (file) {
      const size = fs.fileSizeMb(`src/test/__gen__/${file}`);
      if (withExtensions === false) {
        arr.push([file.split(/\./g)[0] ?? file, size]);
      } else {
        arr.push([file, size]);
      }
    });
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message);
    else console.error(err);
  } finally {
    const tupleToObj = Object.fromEntries(arr);
    fs.withWs(
      `src/test/__out__/file-sizes.ts`,
      `export const fileSizesInMb = ${JSON.stringify(tupleToObj, null, 2)} as const;`
    );
  }
}

generateTsFileOfFileSizes();
