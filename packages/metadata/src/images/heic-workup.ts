import type { ImageSpecs } from "@/types/index.ts";
import { TiffExtractorWorkup } from "@/images/tiff-workup.ts";

export class HeicExtractorWorkup extends TiffExtractorWorkup {
  protected heic(buffer: Buffer<ArrayBufferLike>) {
    const ftyp = this.findBox(buffer, "ftyp");
    if (!ftyp) throw new Error("Invalid HEIC: No ftyp");
    const brands = buffer
      .toString("ascii", ftyp.pos, ftyp.pos + ftyp.size)
      .toLowerCase();
    const isHeic =
      brands.includes("heic") ||
      brands.includes("heix") ||
      brands.includes("heim") ||
      brands.includes("heis") ||
      brands.includes("hevc") ||
      brands.includes("hevx") ||
      brands.includes("mif1"); // Common HEIF brands, focusing on HEVC-based (HEIC)
    if (!isHeic) throw new Error("Not a HEIC file");

    const meta = this.findBox(buffer, "meta");
    if (!meta) throw new Error("Invalid HEIC: No meta");
    const metaSubStart = meta.pos + 4; // Skip version + flags
    const metaSubEnd = meta.pos + meta.size;

    const iprp = this.findBox(buffer, "iprp", metaSubStart, metaSubEnd);
    if (!iprp) throw new Error("Invalid HEIC: No iprp");
    const ipco = this.findBox(buffer, "ipco", iprp.pos, iprp.pos + iprp.size);
    if (!ipco) throw new Error("Invalid HEIC: No ipco");
    const ispe = this.findBox(buffer, "ispe", ipco.pos, ipco.pos + ipco.size);
    if (!ispe) throw new Error("Invalid HEIC: No ispe");

    if (buffer[ispe.pos] !== 0) throw new Error("Invalid ispe version");
    const width = buffer.readUInt32BE(ispe.pos + 4);
    const height = buffer.readUInt32BE(ispe.pos + 8);

    // For color space, look for 'colr' box in ipco (simple color info) or assume RGB if no ICC
    let colorSpace = "rgb" as ImageSpecs["colorSpace"],
      colorModel = "rgb" as ImageSpecs["colorModel"],
      hasAlpha = false,
      iccProfile: string | null = null;
    const colr = this.findBox(buffer, "colr", ipco.pos, ipco.pos + ipco.size);
    if (colr) {
      const colrType = buffer.toString("ascii", colr.pos, colr.pos + 4);
      if (colrType === "nclx") {
        // nclx profile: color primaries, transfer, matrix
        // Simplified: We can check matrix coefficient for YUV vs RGB, but for now, flag as ycbcr if not RGB
        const matrix = buffer.readUInt16BE(colr.pos + 6);
        colorModel = matrix === 2 ? "rgb" : "ycbcr"; // 2 is RGB identity
      } else if (colrType === "rICC" || colrType === "prof") {
        colorSpace = "unknown"; // ICC profile present
        iccProfile = "embedded";
      }
    }
    // Check for alpha: Look for 'auxC' box with alpha URI
    const auxC = this.findBox(buffer, "auxC", ipco.pos, ipco.pos + ipco.size);
    if (
      auxC &&
      buffer.toString("ascii", auxC.pos, auxC.pos + auxC.size).includes("alpha")
    ) {
      hasAlpha = true;
      if (colorModel === "rgb") {
        colorModel = "rgba";
      } else if (colorModel === "ycbcr") {
        colorModel = "ycck";
      } else if (colorModel === "grayscale" || colorModel === "unknown") {
        colorModel = "grayscale-alpha";
      }
    }
    const xmpXml = this.parseXmpFromAvif(buffer, meta, ipco); // Reuse AVIF XMP parser, as structure is identical
    let exifDateTimeOriginal: string | null = null;
    if (xmpXml) {
      // Simple native parse: Find xmp:CreateDate or photoshop:DateCreated (common for original date)
      // This is regex-free; use string search for robustness
      let dateStart = xmpXml.indexOf('xmp:CreateDate="');
      if (dateStart === -1)
        dateStart = xmpXml.indexOf('photoshop:DateCreated="');
      if (dateStart !== -1) {
        dateStart += 16; // Skip to value
        const dateEnd = xmpXml.indexOf('"', dateStart);
        if (dateEnd !== -1) {
          exifDateTimeOriginal = xmpXml.substring(dateStart, dateEnd);
        }
      }
      // If needed, add more tags like dc:date, but this covers basics
    }
    // Animated/frames: For HEIF sequences (e.g., bursts), check brands like 'heim'/'heis' for multi-image
    let frames = 1;
    const animated = brands.includes("heim") || brands.includes("heis");
    if (animated) {
      const iloc = this.findBox(buffer, "iloc", metaSubStart, metaSubEnd);
      if (iloc) {
        // Simplified: Count items (full parse complex, assume frames = item count / 2 if alpha)
        const version = buffer?.[iloc.pos] ?? 0;
        const itemCountPos = iloc.pos + (version < 2 ? 4 : 6);
        let itemCount = buffer?.readUInt16BE(itemCountPos) ?? 0;
        if (version >= 2) itemCount = buffer?.readUInt32BE(itemCountPos) ?? 0; // Override for v2+
        frames = Math.max(1, Math.floor(itemCount / (hasAlpha ? 2 : 1))); // Approx: Divide by 2 if alpha layers
      }
    }

    return {
      type: "IMAGE",
      width,
      height,
      format: "heic",
      frames,
      animated,
      colorModel,
      hasAlpha: hasAlpha ? true : null,
      orientation: null, // Can have 'irot' or 'imir' transforms, or EXIF; add parsing if needed
      aspectRatio: width / height,
      colorSpace,
      iccProfile,
      exifDateTimeOriginal // Can have dedicated 'Exif' item; add parser similar to XMP if required
    } satisfies ImageSpecs;
  }
  /**
   *  HEIC/HEIF: Similar to AVIF, ISOBMFF with ftyp heic/heix/etc.
   * Run check after AVIF, before SVG
   */
  protected isHeicSignature(buffer: Buffer<ArrayBufferLike>) {
    return buffer.length >= 32 && this.toAscii(buffer, 4, 8) === "ftyp";
  }
}
