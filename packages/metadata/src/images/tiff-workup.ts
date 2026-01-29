import type { ImageSpecs } from "@/types/index.ts";
import { GifExtractorWorkup } from "@/images/gif-workup.ts";

export class TiffExtractorWorkup extends GifExtractorWorkup {
  public tiff(
    rawbuffer: Buffer<ArrayBufferLike>,
    buffer: Buffer<ArrayBufferLike>
  ) {
    const little = buffer[0] === 0x49; // "II" vs "MM"
    const isBigTiff = buffer[2] === 0x2b || buffer[3] === 0x2b;

    // We intentionally don't parse BigTIFF (64-bit offsets). Fail loudly so you can bump your reader when you hit one.
    if (isBigTiff) {
      throw new Error(
        "BigTIFF (0x2B) detected — not supported in lightweight header parser."
      );
    }

    // Use the *full* raw buffer here (IFDs can sit beyond your header window).
    const src = rawbuffer;

    const readU16 = (off: number) => {
      if (off < 0 || off + 2 > src.length) return 0;
      return little ? src.readUInt16LE(off) : src.readUInt16BE(off);
    };

    const readU32 = (off: number) => {
      if (off < 0 || off + 4 > src.length) return 0;
      return little ? src.readUInt32LE(off) : src.readUInt32BE(off);
    };

    const TIFF_START = 0;
    const firstIFDOff = readU32(4);
    let ifdOff = TIFF_START + firstIFDOff;

    let frames = 0;
    let width: number | null = null;
    let height: number | null = null;
    let samplesPerPixel: number | null = null;
    let extraSamples: number[] = [];
    let photometric: number | null = null;
    let orientation: number | null = null;
    let iccPresent = false;
    let exifIFDOffset: number | null = null;

    const TAG = {
      ImageWidth: 256,
      ImageLength: 257,
      BitsPerSample: 258, // not strictly needed here
      Compression: 259, // not strictly needed here
      PhotometricInterpretation: 262,
      StripOffsets: 273, // not needed for metadata
      Orientation: 274,
      SamplesPerPixel: 277,
      RowsPerStrip: 278, // not needed for metadata
      PlanarConfiguration: 284, // not needed for metadata
      ExtraSamples: 338,
      ICCProfile: 34675,
      ExifIFDPointer: 34665,
      // EXIF IFD:
      DateTimeOriginal: 0x9003
    } as const;

    // TIFF field types (classic)
    const TYPE = {
      BYTE: 1,
      ASCII: 2,
      SHORT: 3,
      LONG: 4,
      RATIONAL: 5,
      SBYTE: 6,
      UNDEFINED: 7,
      SSHORT: 8,
      SLONG: 9,
      SRATIONAL: 10,
      FLOAT: 11,
      DOUBLE: 12
    } as const;

    // Helper to extract values from an IFD entry (classic TIFF 12-byte entries)
    function readIFDValue(
      entryOff: number,
      type: number,
      count: number
    ): number | number[] | string | null {
      // For classic TIFF, the "value or offset" is 4 bytes at entryOff+8
      const valueOrOff = readU32(entryOff + 8);

      // Inline-value size threshold is 4 bytes
      const valueFitsInline =
        ((type === TYPE.BYTE ||
          type === TYPE.SBYTE ||
          type === TYPE.UNDEFINED ||
          type === TYPE.ASCII) &&
          count <= 4) ||
        (type === TYPE.SHORT && count <= 2) ||
        (type === TYPE.LONG && count <= 1);

      let dataOff = valueOrOff;
      if (valueFitsInline) {
        dataOff = entryOff + 8;
      } else {
        dataOff = TIFF_START + valueOrOff;
      }

      // Check if data is within buffer
      if (dataOff < 0 || dataOff >= src.length) return null;

      const readShortN = (o: number) => readU16(o);
      const readLongN = (o: number) => readU32(o);

      switch (type) {
        case TYPE.ASCII: {
          const end = Math.min(
            src.indexOf(0, dataOff) === -1
              ? dataOff + count
              : src.indexOf(0, dataOff),
            src.length
          );
          try {
            return src.toString("ascii", dataOff, end);
          } catch {
            return null;
          }
        }
        case TYPE.BYTE:
        case TYPE.SBYTE:
        case TYPE.UNDEFINED: {
          const out: number[] = [];
          for (let i = 0; i < count; i++) {
            const off = dataOff + i;
            if (off >= src.length || !src[off]) break;
            out.push(src[off]);
          }
          return count === 1 ? (out[0] ?? null) : out;
        }
        case TYPE.SHORT: {
          const out: number[] = [];
          for (let i = 0; i < count; i++) {
            // Use the original dataOff for reading via readShortN which handles translation
            const val = readShortN(dataOff + i * 2);
            if (val === 0) break; // Couldn't read
            out.push(val);
          }
          return count === 1 ? (out[0] ?? null) : out;
        }
        case TYPE.LONG: {
          const out: number[] = [];
          for (let i = 0; i < count; i++) {
            // Use the original dataOff for reading via readLongN which handles translation
            const val = readLongN(dataOff + i * 4);
            if (val === 0) break; // Couldn't read
            out.push(val);
          }
          return count === 1 ? (out[0] ?? null) : out;
        }
        case TYPE.RATIONAL: {
          // two LONGs per value (num/den)
          const out: number[] = [];
          for (let i = 0; i < count; i++) {
            const num = readLongN(dataOff + i * 8);
            const den = readLongN(dataOff + i * 8 + 4);
            if (num === 0 && den === 0) break; // Couldn't read
            out.push(den ? num / den : 0);
          }
          return count === 1 ? (out[0] ?? null) : out;
        }
        default:
          return null; // Unsupported type; fine for our metadata use
      }
    }

    // Traverse IFD chain, record metadata from the first page, count frames
    const MAX_IFDS = 32; // sanity ceiling
    while (ifdOff > 0 && ifdOff + 2 <= src.length && frames < MAX_IFDS) {
      const numEntries = readU16(ifdOff);
      const entriesBase = ifdOff + 2;

      // Check if we have enough space for all entries
      const ifdSize = numEntries * 12 + 4; // entries + next IFD pointer
      if (entriesBase + ifdSize > src.length) {
        // IFD extends beyond buffer - this is the issue with coffee.tif
        console.warn(
          `TIFF IFD at offset ${ifdOff} requires ${ifdSize} bytes but only ${src.length - entriesBase} available`
        );
        // Try to parse what we can
      }

      for (let i = 0; i < numEntries; i++) {
        const entry = entriesBase + i * 12;
        if (entry + 12 > src.length) {
          console.warn(`TIFF entry ${i} at offset ${entry} truncated`);
          break;
        }

        const tag = readU16(entry);
        const type = readU16(entry + 2);
        const count = readU32(entry + 4);

        // Narrow to tags we care about
        if (tag === TAG.ImageWidth && width == null) {
          const v = readIFDValue(entry, type, count);
          if (typeof v === "number") width = v;
          if (Array.isArray(v) && typeof v[0] === "number") width = v[0];
        } else if (tag === TAG.ImageLength && height == null) {
          const v = readIFDValue(entry, type, count);
          if (typeof v === "number") height = v;
          if (Array.isArray(v) && typeof v[0] === "number") height = v[0];
        } else if (tag === TAG.SamplesPerPixel && samplesPerPixel == null) {
          const v = readIFDValue(entry, type, count);
          if (typeof v === "number") samplesPerPixel = v;
        } else if (tag === TAG.ExtraSamples) {
          const v = readIFDValue(entry, type, count);
          if (typeof v === "number") extraSamples = [v];
          else if (Array.isArray(v))
            extraSamples = v.filter(n => typeof n === "number") as number[];
        } else if (
          tag === TAG.PhotometricInterpretation &&
          photometric == null
        ) {
          const v = readIFDValue(entry, type, count);
          if (typeof v === "number") photometric = v;
        } else if (tag === TAG.Orientation && orientation == null) {
          const v = readIFDValue(entry, type, count);
          if (typeof v === "number") orientation = v;
        } else if (tag === TAG.ICCProfile) {
          iccPresent = true;
        } else if (tag === TAG.ExifIFDPointer && exifIFDOffset == null) {
          const v = readIFDValue(entry, type, count);
          if (typeof v === "number") exifIFDOffset = TIFF_START + v;
        }
      }

      frames++;

      // Next IFD offset is 4 bytes right after the entries
      const nextPtrOff = entriesBase + numEntries * 12;
      if (nextPtrOff + 4 > src.length) break;
      const nextRel = readU32(nextPtrOff);
      ifdOff = nextRel ? TIFF_START + nextRel : 0;
    }

    // Basic EXIF DateTimeOriginal if EXIF IFD is present (classic TIFF)
    let exifDateTimeOriginal: string | null = null;
    if (exifIFDOffset && exifIFDOffset + 2 <= src.length) {
      try {
        const num = readU16(exifIFDOffset);
        const base = exifIFDOffset + 2;
        for (let i = 0; i < num; i++) {
          const entry = base + i * 12;
          if (entry + 12 > src.length) break;
          const tag = readU16(entry);
          if (tag === TAG.DateTimeOriginal) {
            const type = readU16(entry + 2);
            const count = readU32(entry + 4);
            const val = readIFDValue(entry, type, count);
            if (
              typeof val === "string" &&
              /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/.test(val)
            ) {
              exifDateTimeOriginal = val;
            }
            break;
          }
        }
      } catch {
        // ignore EXIF parse failures
      }
    }

    if (!width || !height) {
      // If we couldn't find dimensions, it might be because the IFD is beyond our buffer
      // Log a warning but try to return sensible defaults rather than throwing
      console.warn(
        `TIFF: Could not find ImageWidth/ImageLength in buffer of ${src.length} bytes. ` +
          `IFD at offset ${firstIFDOff} may require more data.`
      );

      // Check if this is likely a truncation issue
      if (firstIFDOff >= src.length - 100) {
        throw new Error(
          `TIFF IFD at offset ${firstIFDOff} is beyond buffer (${src.length} bytes). ` +
            `This file requires reading more data to parse.`
        );
      }

      // Otherwise, it's genuinely missing required tags
      throw new Error(
        "Invalid TIFF: missing ImageWidth/ImageLength tags in accessible IFDs."
      );
    }

    // Map color model/space
    let colorModel = "unknown" as ImageSpecs["colorModel"];
    let colorSpace = "unknown" as ImageSpecs["colorSpace"];

    // PhotometricInterpretation common values:
    // 0=WhiteIsZero (gray), 1=BlackIsZero (gray), 2=RGB, 3=Palette, 5=CMYK, 6=YCbCr, 8=CIELab
    switch (photometric) {
      case 0:
      case 1:
        colorModel =
          samplesPerPixel === 2 || extraSamples.length
            ? "grayscale-alpha"
            : "grayscale";
        colorSpace = "gray";
        break;
      case 2:
        colorModel =
          samplesPerPixel === 4 || extraSamples.length ? "rgba" : "rgb";
        colorSpace = "srgb"; // sane default unless we parse the ICC "desc"
        break;
      case 3:
        colorModel = "indexed";
        colorSpace = "srgb";
        break;
      case 5:
        colorModel = "cmyk";
        colorSpace = "cmyk";
        break;
      case 6:
        colorModel = "ycbcr"; // matches your JPEG branch semantics
        colorSpace = "srgb"; // typical working space assumption
        break;
      case 8:
        colorModel = "lab";
        colorSpace = "lab";
        break;
      default:
        // unknown photometric; leave defaults
        break;
    }

    const hasAlpha =
      extraSamples.some(v => v === 1 || v === 2) || // 1: associated alpha, 2: unassociated
      (photometric === 2 && samplesPerPixel === 4) ||
      ((photometric === 0 || photometric === 1) && samplesPerPixel === 2);

    return {
      type: "IMAGE",
      width,
      height,
      format: "tiff",
      frames,
      animated: false,
      hasAlpha,
      orientation: orientation ?? null,
      aspectRatio: width / height,
      colorModel,
      colorSpace,
      iccProfile: iccPresent ? "embedded" : null,
      exifDateTimeOriginal
    } satisfies ImageSpecs;
  }
  /**
   * "MM\0*"
   */
  protected isClassicTiffBE(buffer: Buffer<ArrayBufferLike>) {
    return (
      buffer?.[0] === 0x4d &&
      buffer?.[1] === 0x4d &&
      buffer?.[2] === 0x00 &&
      buffer?.[3] === 0x2a
    );
  }
  /**
   * "II*\0"
   */
  protected isClassicTiffLE(buffer: Buffer<ArrayBufferLike>) {
    return (
      buffer?.[0] === 0x49 &&
      buffer?.[1] === 0x49 &&
      buffer?.[2] === 0x2a &&
      buffer?.[3] === 0x00
    );
  }
  /**
   * "MM\0+"
   */
  protected isBigTiffMagicBE(buffer: Buffer<ArrayBufferLike>) {
    return (
      buffer?.[0] === 0x4d &&
      buffer?.[1] === 0x4d &&
      buffer?.[2] === 0x00 &&
      buffer?.[3] === 0x2b
    );
  }
  /**
   * "II+\0"
   */
  protected isBigTiffMagicLE(buffer: Buffer<ArrayBufferLike>) {
    return (
      buffer?.[0] === 0x49 &&
      buffer?.[1] === 0x49 &&
      buffer?.[2] === 0x2b &&
      buffer?.[3] === 0x00
    );
  }

  /**
   * TIFF/TIF (classic TIFF only; BigTIFF is detected and rejected)
   */
  public isTiffSignature(buffer: Buffer<ArrayBufferLike>) {
    return (
      buffer.length >= 8 &&
      (this.isClassicTiffLE(buffer) ||
        this.isClassicTiffBE(buffer) ||
        this.isBigTiffMagicLE(buffer) ||
        this.isBigTiffMagicBE(buffer))
    );
  }
}
