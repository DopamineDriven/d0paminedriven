import { Fs } from "@d0paminedriven/fs";
// import { Fs } from "@d0paminedriven/fs";

// const fs = new Fs(process.cwd());
// class BenchmarkWrite {
//   private agg = 0;

//   constructor(public fs: Fs) {}
//   private r(url: string) {
//     return this.fs.fileToBuffer(url).toString("utf-8");
//   }
//   public reader(urls: string[]) {
//     return urls.map(url => JSON.parse<[string, string]>(this.r(url)));
//   }

//   private async s(val: string[]) {
//     for (const [remote, local] of this.reader(val)) {
//       await this.fs.fetchRemoteWriteLocalLargeFiles(remote, local, false);
//     }
//   }
//   public async init(dirs: string[][]) {
//     for (const val of dirs) {
//       await this.s(val);
//     }
//   }
// }
// const dir = "src/test/img-data/segmented";
// let agg = 0;
// const getDirs = (agg: number) => {
//   const mapper = fs.readDir(dir, { recursive: false }).map(v => {
//     const nextLayer = `${dir}/${v}` as const;
//     const x = fs.readDir(nextLayer).map(t => {
//       agg += 1;
//       return `${nextLayer}/${t}`;
//     });
//     return x;
//   });
//   return { mapper, agg };
// };
// const benchmark = new BenchmarkWrite(fs);
// let tInitial = 0;
// if (process.argv[3] === "init") {
//   tInitial = performance.now();
//   const { agg: size, mapper: urls } = getDirs(agg);
//   Promise.all([benchmark.init(urls)]).then(() => {
//     const tFinal = performance.now() - tInitial;
//     benchmark.fs.withWs(
//       "src/test/results.txt",
//       `wrote ${size} mixed image assets from remote to local in ${tFinal} ms`
//     );
//   });
// }
// if (process.argv[3] ==="write-out") {
// const dir = "src/test/__benchmark__";
// const getDirsToWrite = () => {
//   const mapper = fs.readDir(dir, { recursive: false }).filter((t)=>t.includes(".")).map(v => {
//     const nextLayer = `${dir}/${v}` as const;
//     const x = fs.readDir(nextLayer).map(t => {

//       return `${nextLayer}/${t}`;
//     });
//     return x;
//   });
//   const jsonData = JSON.stringify(mapper,null, 2);
//   const toTs = `export const tuplesOfTuples=${jsonData};`;
//   fs.withWs(`src/test/local-data.ts`, toTs);
// };
// getDirs();
// }

// public async toTriplet(url: string) {
//   const pathname = url.slice(url.lastIndexOf("/") + 1);
//   const dbFile = pathname.startsWith("att") ? pathname : pathname.slice(14);

//   void (await this.fs.fetchRemoteWriteLocalLargeFiles(
//     url,
//     `src/test/__benchmark__/${dbFile.slice(dbFile.lastIndexOf(".") + 1)}/${dbFile}`,
//     false
//   ));
// }


import { tupleOfTriplets } from "@/test/img-data/tuple-of-triplets.ts";

const fs = new Fs(process.cwd());

let tInitial = 0;
let tFinal = 0;
tInitial = performance.now();
for (const ss of tupleOfTriplets as [string, string, string][][]) {
  (async (all: [string, string, string][]) => {
    const { Fs } = await import("@d0paminedriven/fs");
    const fs = new Fs(process.cwd());
    for (const [url, filename, ext] of all) {
      await fs.fetchRemoteWriteLocalLargeFiles(
        url,
        `src/test/__benchmark__/${ext}/${filename}.${ext}`,
        false
      );
    }
  })(ss);
}
// (tupleOfTriplets as [string, string, string][][]).map(async v => {
//   tInitial= performance.now();
//   await ss(v);
// });


(async () => {
  tInitial = performance.now();
  for (const all of tupleOfTriplets as [string, string, string][][]) {
    for (const [url, filename, ext] of all) {
      await fs.fetchRemoteWriteLocalLargeFiles(
        url,
        `src/test/__benchmark__/${ext}/${filename}.${ext}`,
        false
      );
    }
  }
  tFinal = performance.now() - tInitial;
})().then(_ => {
  fs.withWs(
    "src/test/results.txt",
    `wrote  mixed image assets remote to local in ${tFinal} ms`
  );
});
