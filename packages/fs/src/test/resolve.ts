import { Fs, ImageSpecs } from "@/index.ts";
import json from "@/test/tests/pbr.json" with { type: "json" };

const fsx = new Fs(process.cwd());

const pbrFileList = [
  "https://asrosscloud.com/textures/brushed-stainless-steel-satin/brushed_metal_26_94_ao.jpg",
  "https://asrosscloud.com/textures/brushed-stainless-steel-satin/brushed_metal_26_94_diffuse.jpg",
  "https://asrosscloud.com/textures/brushed-stainless-steel-satin/brushed_metal_26_94_glossiness.jpg",
  "https://asrosscloud.com/textures/brushed-stainless-steel-satin/brushed_metal_26_94_height.jpg",
  "https://asrosscloud.com/textures/brushed-stainless-steel-satin/brushed_metal_26_94_metalness.jpg",
  "https://asrosscloud.com/textures/brushed-stainless-steel-satin/brushed_metal_26_94_normal.jpg",
  "https://asrosscloud.com/textures/brushed-stainless-steel-satin/brushed_metal_26_94_reflection.jpg",
  "https://asrosscloud.com/textures/brushed-stainless-steel-satin/brushed_metal_26_94_render.jpg",
  "https://asrosscloud.com/textures/brushed-stainless-steel-satin/brushed_metal_26_94_roughness.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-fine/metal_ledges_26_52_ao.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-fine/metal_ledges_26_52_diffuse.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-fine/metal_ledges_26_52_glossiness.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-fine/metal_ledges_26_52_height.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-fine/metal_ledges_26_52_metalness.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-fine/metal_ledges_26_52_normal.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-fine/metal_ledges_26_52_reflection.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-fine/metal_ledges_26_52_render.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-fine/metal_ledges_26_52_roughness.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-glossy/metal_ledges_26_53_ao.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-glossy/metal_ledges_26_53_diffuse.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-glossy/metal_ledges_26_53_glossiness.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-glossy/metal_ledges_26_53_height.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-glossy/metal_ledges_26_53_metalness.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-glossy/metal_ledges_26_53_normal.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-glossy/metal_ledges_26_53_reflection.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-glossy/metal_ledges_26_53_render.jpg",
  "https://asrosscloud.com/textures/brushed-steel-vertical-glossy/metal_ledges_26_53_roughness.jpg",
  "https://asrosscloud.com/textures/diamond-plated-blackened/patterned_metal_26_25_ao.jpg",
  "https://asrosscloud.com/textures/diamond-plated-blackened/patterned_metal_26_25_diffuse.jpg",
  "https://asrosscloud.com/textures/diamond-plated-blackened/patterned_metal_26_25_glossiness.jpg",
  "https://asrosscloud.com/textures/diamond-plated-blackened/patterned_metal_26_25_height.jpg",
  "https://asrosscloud.com/textures/diamond-plated-blackened/patterned_metal_26_25_metalness.jpg",
  "https://asrosscloud.com/textures/diamond-plated-blackened/patterned_metal_26_25_normal.jpg",
  "https://asrosscloud.com/textures/diamond-plated-blackened/patterned_metal_26_25_reflection.jpg",
  "https://asrosscloud.com/textures/diamond-plated-blackened/patterned_metal_26_25_render.jpg",
  "https://asrosscloud.com/textures/diamond-plated-blackened/patterned_metal_26_25_roughness.jpg",
  "https://asrosscloud.com/textures/diamond-plated-polished/patterned_metal_26_97_ao.jpg",
  "https://asrosscloud.com/textures/diamond-plated-polished/patterned_metal_26_97_diffuse.jpg",
  "https://asrosscloud.com/textures/diamond-plated-polished/patterned_metal_26_97_glossiness.jpg",
  "https://asrosscloud.com/textures/diamond-plated-polished/patterned_metal_26_97_height.jpg",
  "https://asrosscloud.com/textures/diamond-plated-polished/patterned_metal_26_97_metalness.jpg",
  "https://asrosscloud.com/textures/diamond-plated-polished/patterned_metal_26_97_normal.jpg",
  "https://asrosscloud.com/textures/diamond-plated-polished/patterned_metal_26_97_reflection.jpg",
  "https://asrosscloud.com/textures/diamond-plated-polished/patterned_metal_26_97_render.jpg",
  "https://asrosscloud.com/textures/diamond-plated-polished/patterned_metal_26_97_roughness.jpg",
  "https://asrosscloud.com/textures/elegant-stone-tiles/elegant-stone-tiles-albedo.png",
  "https://asrosscloud.com/textures/elegant-stone-tiles/elegant-stone-tiles-ao.png",
  "https://asrosscloud.com/textures/elegant-stone-tiles/elegant-stone-tiles-height.png",
  "https://asrosscloud.com/textures/elegant-stone-tiles/elegant-stone-tiles-metallic.png",
  "https://asrosscloud.com/textures/elegant-stone-tiles/elegant-stone-tiles-normal-ogl.png",
  "https://asrosscloud.com/textures/elegant-stone-tiles/elegant-stone-tiles-roughness.png",
  "https://asrosscloud.com/textures/painted-stucco-white/white_plaster_21_27_ao.jpg",
  "https://asrosscloud.com/textures/painted-stucco-white/white_plaster_21_27_diffuse.jpg",
  "https://asrosscloud.com/textures/painted-stucco-white/white_plaster_21_27_glossiness.jpg",
  "https://asrosscloud.com/textures/painted-stucco-white/white_plaster_21_27_height.jpg",
  "https://asrosscloud.com/textures/painted-stucco-white/white_plaster_21_27_normal.jpg",
  "https://asrosscloud.com/textures/painted-stucco-white/white_plaster_21_27_reflection.jpg",
  "https://asrosscloud.com/textures/painted-stucco-white/white_plaster_21_27_render.jpg",
  "https://asrosscloud.com/textures/painted-stucco-white/white_plaster_21_27_roughness.jpg",
  "https://asrosscloud.com/textures/smooth-stucco/smooth-stucco-Height.png",
  "https://asrosscloud.com/textures/smooth-stucco/smooth-stucco-Metallic.png",
  "https://asrosscloud.com/textures/smooth-stucco/smooth-stucco-Normal-ogl.png",
  "https://asrosscloud.com/textures/smooth-stucco/smooth-stucco-Roughness.png",
  "https://asrosscloud.com/textures/smooth-stucco/smooth-stucco-albedo.png",
  "https://asrosscloud.com/textures/smooth-stucco/smooth-stucco-ao.png",
  "https://asrosscloud.com/textures/subtle-black-granite/subtle-black-granite-albedo.png",
  "https://asrosscloud.com/textures/subtle-black-granite/subtle-black-granite-ao.png",
  "https://asrosscloud.com/textures/subtle-black-granite/subtle-black-granite-height.png",
  "https://asrosscloud.com/textures/subtle-black-granite/subtle-black-granite-metallic.png",
  "https://asrosscloud.com/textures/subtle-black-granite/subtle-black-granite-normal-ogl.png",
  "https://asrosscloud.com/textures/subtle-black-granite/subtle-black-granite-roughness.png",
  "https://asrosscloud.com/textures/true-stucco-white-uniform/white_stucco_wall_21_11_ao.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-uniform/white_stucco_wall_21_11_diffuse.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-uniform/white_stucco_wall_21_11_glossiness.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-uniform/white_stucco_wall_21_11_height.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-uniform/white_stucco_wall_21_11_normal.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-uniform/white_stucco_wall_21_11_reflection.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-uniform/white_stucco_wall_21_11_render.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-uniform/white_stucco_wall_21_11_roughness.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-varied/white_stucco_wall_21_92_ao.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-varied/white_stucco_wall_21_92_diffuse.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-varied/white_stucco_wall_21_92_glossiness.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-varied/white_stucco_wall_21_92_height.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-varied/white_stucco_wall_21_92_normal.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-varied/white_stucco_wall_21_92_reflection.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-varied/white_stucco_wall_21_92_render.jpg",
  "https://asrosscloud.com/textures/true-stucco-white-varied/white_stucco_wall_21_92_roughness.jpg",
  "https://asrosscloud.com/textures/true-stucco-white/white_stucco_wall_21_97_ao.jpg",
  "https://asrosscloud.com/textures/true-stucco-white/white_stucco_wall_21_97_diffuse.jpg",
  "https://asrosscloud.com/textures/true-stucco-white/white_stucco_wall_21_97_glossiness.jpg",
  "https://asrosscloud.com/textures/true-stucco-white/white_stucco_wall_21_97_height.jpg",
  "https://asrosscloud.com/textures/true-stucco-white/white_stucco_wall_21_97_normal.jpg",
  "https://asrosscloud.com/textures/true-stucco-white/white_stucco_wall_21_97_reflection.jpg",
  "https://asrosscloud.com/textures/true-stucco-white/white_stucco_wall_21_97_render.jpg",
  "https://asrosscloud.com/textures/true-stucco-white/white_stucco_wall_21_97_roughness.jpg"
] as const;

async function _pbrTexturesR2ToLocal() {
  for (const x of pbrFileList) {
    const filename = new URL(x).pathname;
    const clean = filename.includes(".")
      ? (filename.split(".")?.[0] ?? "")
      : filename;
    console.log(filename);
    await fsx.fetchRemoteWriteLocalLargeFiles(
      x,
      `src/test/__gen__/batch/${clean}`
    );
  }
}

// _pbrTexturesR2ToLocal();

const paths = fsx
  .readDir("src/test/__gen__/batch", { recursive: true })
  .map(t => `src/test/__gen__/batch/${t}`)
  .filter(t => /(\.)/g.test(t));

let start = 0;
async function getMetadata(paths: string[]) {
  start = performance.now();
  let xx: ImageSpecs | null = null;
  const arr = Array.of<ImageSpecs>();
  for (const x of paths) {
    xx = (await fsx.getSpecs(x, 4096 * 6)) as ImageSpecs;
    if (xx) arr.push(xx);
  }
  return arr;
}
const jsonObj = (time: number, data: ImageSpecs[]) =>
  JSON.stringify(
    {
      duration: time,
      data
    },
    null,
    2
  );

getMetadata(paths).then(t => {
  fsx.withWs(
    "src/test/tests/pbr-2.json",
    jsonObj(performance.now() - start, t)
  );
});

console.log(json.data.filter(t => t.format === "png").length);

// const s = fsx.resolve(
//   fsx.tmpDir,
//   "my/deeply/nested/super/deep/really/fucking/deep/inception/level/test/atomic-1999.json"
// );
// console.log(fsx.readTmp(s).toString("utf-8"));

// const homeDir = fsx.tmpDir;

// fsx.readDir("", { recursive: true });

// console.log({
//   1: fsx.pathHandler(homeDir),
//   2: fsx.pathHandler2(homeDir)
// });
