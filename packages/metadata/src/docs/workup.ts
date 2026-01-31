import { inflateSync } from "node:zlib";
import { PdfWorkupService } from "@/docs/pdf-workup.ts";

export class DocWorkupService extends PdfWorkupService {
  protected toSafeString(buf: Uint8Array, encoding = "utf-8"): string {
    try {
      return new TextDecoder(encoding, { fatal: false }).decode(buf);
    } catch {
      // Fallback to latin1-ish if decoder fails
      return Array.from(buf)
        .map(b => String.fromCharCode(b))
        .join("");
    }
  }

  protected detectTextEncodingPrefix(buffer: Uint8Array): {
    encoding: string;
    offset: number;
  } {
    // BOM detection for common encodings
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xef &&
      buffer[1] === 0xbb &&
      buffer[2] === 0xbf
    )
      return { encoding: "utf-8", offset: 3 };
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe)
      return { encoding: "utf-16le", offset: 2 };
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff)
      return { encoding: "utf-16be", offset: 2 };
    return { encoding: "utf-8", offset: 0 };
  }

  // Best-effort text detection/decoding with UTF-8 validation and Windows-1252 fallback
  protected detectAndDecodeText(buffer: Uint8Array): string {
    const { encoding, offset } = this.detectTextEncodingPrefix(buffer);
    const body = buffer.subarray(offset);
    if (encoding === "utf-8" && offset === 0) {
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(body);
      } catch {
        return new TextDecoder("windows-1252", { fatal: false }).decode(body);
      }
    }
    return this.toSafeString(body, encoding);
  }
  protected firstN(text: string | null | undefined, n = 240) {
    if (!text) return null;
    const t = text.slice(0, n);
    return t.length < text.length ? `${t}…` : t;
  }

  protected countWords(text: string) {
    const words = text.trim().match(/[\p{L}\p{N}_]+/gu);
    return words ? words.length : 0;
  }

  protected countLines(text: string) {
    if (!text) return 0;
    // Normalise CRLF
    return text.replace(/\r\n/g, "\n").split("\n").length;
  }

  /**
   * Count PDF pages with confidence tracking
   * Returns both the count and how confident we are in the result
   */
  protected countPDFPagesWithConfidence(buffer: Buffer): {
    pageCount: number | null;
    confidence: "high" | "medium" | "low" | "estimated";
  } {
    const text = buffer.toString("latin1");

    // Strategy 1: Direct /Pages /Count (high confidence)
    const directCount = this.strategy1DirectPagesCount(text);
    if (directCount && directCount > 0) {
      return { pageCount: directCount, confidence: "high" };
    }

    // Strategy 2: Linearized /N (high confidence)
    const linearizedCount = this.strategy2Linearized(text);
    if (linearizedCount && linearizedCount > 0) {
      return { pageCount: linearizedCount, confidence: "high" };
    }

    // Strategy 3: Catalog chain (high confidence)
    const catalogCount = this.strategy3CatalogChain(buffer, text);
    if (catalogCount && catalogCount > 0) {
      return { pageCount: catalogCount, confidence: "high" };
    }

    // Strategy 4: Decompressed streams including ObjStm (medium confidence)
    const decompressedCount = this.strategy4DecompressedStreams(buffer);
    if (decompressedCount && decompressedCount > 0) {
      return { pageCount: decompressedCount, confidence: "medium" };
    }

    // Strategy 5: Kids refs to Page objects (medium confidence)
    const kidsCount = this.strategy5KidsPageRefs(text);
    if (kidsCount && kidsCount > 0) {
      return { pageCount: kidsCount, confidence: "medium" };
    }

    // Strategy 6: Brute force Page count (low confidence)
    const bruteCount = this.strategy6BruteForce(text);
    if (bruteCount && bruteCount > 0) {
      return { pageCount: bruteCount, confidence: "low" };
    }

    // Strategy 7: Estimate (last resort)
    const estimatedCount = this.strategy7Estimate(buffer, text);
    return { pageCount: estimatedCount, confidence: "estimated" };
  }

  /**
   * Legacy method for backward compatibility
   */
  protected countPDFPages(buffer: Buffer): number | null {
    return this.countPDFPagesWithConfidence(buffer).pageCount;
  }

  protected decompressStream(
    buffer: Buffer,
    start: number,
    end: number
  ): string | null {
    try {
      const compressed = buffer.subarray(start, end);
      return inflateSync(compressed).toString("latin1");
    } catch {
      return null;
    }
  }

  protected extractPDFTextRobust(buffer: Buffer, maxLength = 500) {
    const raw = buffer.toString("latin1");
    const textBlocks: string[] = [];

    // Find all content streams
    const streamPattern =
      /(\d+)\s+\d+\s+obj[^>]*\/Filter\s*\/FlateDecode[^>]*\/Length\s+(\d+)[^>]*>>[\r\n]*stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;

    let match: RegExpExecArray | null;
    while ((match = streamPattern.exec(raw)) !== null) {
      if (!match[2]) continue;
      const length = parseInt(match[2], 10);
      const _streamStart = match.index + match[0].indexOf("stream") + 7; // after "stream\n"

      // Find actual byte position for binary-safe extraction
      const streamStartBytes = buffer.indexOf("stream", match.index) + 7;
      const decompressed = this.decompressStream(
        buffer,
        streamStartBytes,
        streamStartBytes + length
      );

      if (decompressed) {
        this.extractTextFromContent(decompressed, textBlocks, maxLength);
      }

      if (textBlocks.join(" ").length > maxLength) break;
    }

    // Also try uncompressed streams (your existing approach)
    if (textBlocks.length === 0) {
      return this.extractPDFText(buffer, maxLength);
    }

    return this.finalizeTextBlocks(textBlocks, maxLength);
  }

  protected extractTextFromContent(
    content: string,
    blocks: string[],
    maxLength: number
  ): void {
    for (const m of content.matchAll(/BT([\s\S]*?)ET/g)) {
      const body = m[1];
      if (!body) continue;

      // Tj with () strings
      for (const tj of body.matchAll(/\(([^)]*)\)\s*Tj/g)) {
        if (tj[1]) blocks.push(this.decodePdfString(tj[1]));
        if (blocks.join(" ").length > maxLength) return;
      }

      // Tj with <hex>
      for (const hex of body.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
        if (hex[1]) blocks.push(this.decodeHexString(hex[1]));
        if (blocks.join(" ").length > maxLength) return;
      }

      // TJ arrays
      for (const tja of body.matchAll(/\[([\s\S]*?)\]\s*TJ/gi)) {
        const arr = tja[1];
        if (!arr) continue;

        for (const str of arr.matchAll(/\(([^)]*)\)/g)) {
          if (str[1]) blocks.push(this.decodePdfString(str[1]));
        }
        for (const hx of arr.matchAll(/<([0-9A-Fa-f]+)>/g)) {
          if (hx[1]) blocks.push(this.decodeHexString(hx[1]));
        }
        if (blocks.join(" ").length > maxLength) return;
      }
    }
  }

  protected finalizeTextBlocks(
    blocks: string[],
    maxLength: number
  ): string | null {
    if (!blocks.length) return null;

    let result = blocks
      .join(" ")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!result) return null;
    if (result.length > maxLength) result = result.slice(0, maxLength) + "…";
    return result;
  }
  protected extractPDFText(buffer: Buffer, maxLength = 500): string | null {
    try {
      const text = buffer.toString("latin1");
      const textBlocks = Array.of<string>();
      const btMatches = text.matchAll(/BT([\s\S]*?)ET/g);
      for (const m of btMatches) {
        const body = m[1];
        // Tj with () strings
        if (body) {
          for (const tj of body.matchAll(/\(([^)]*)\)\s*Tj/g)) {
            if (tj[1]) textBlocks.push(this.decodePdfString(tj[1]));
            if (textBlocks.join(" ").length > maxLength) break;
          }
          // Tj with <hex>
          for (const hex of body.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
            if (hex[1]) textBlocks.push(this.decodeHexString(hex[1]));
            if (textBlocks.join(" ").length > maxLength) break;
          }
          // TJ arrays
          for (const tja of body.matchAll(/\[(.*?)\]\s*TJ/g)) {
            const arr = tja[1];
            if (arr) {
              for (const str of arr.matchAll(/\(([^)]*)\)/g)) {
                if (str[1]) textBlocks.push(this.decodePdfString(str[1]));
                if (textBlocks.join(" ").length > maxLength) break;
              }
              for (const hx of arr.matchAll(/<([0-9A-Fa-f]+)>/g)) {
                if (hx[1]) textBlocks.push(this.decodeHexString(hx[1]));
                if (textBlocks.join(" ").length > maxLength) break;
              }
            }
          }
        }
        if (textBlocks.join(" ").length > maxLength) break;
      }
      if (!textBlocks.length) return null;
      let result = textBlocks
        .join(" ")
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!result) return null;
      if (result.length > maxLength) result = result.slice(0, maxLength) + "…";
      return result;
    } catch {
      return null;
    }
  }

  protected decodeHexString(hex: string) {
    if (!hex) return "";

    // Remove spaces and ensure even length
    hex = hex.replace(/\s/g, "");
    if (hex.length % 2) hex += "0";

    let result = "";
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substring(i, 2), 16);
      if (!isNaN(code)) {
        result += String.fromCharCode(code);
      }
    }
    return result;
  }
  /**
   * Parse PDF date format into ISO 8601
   * PDF Format: D:YYYYMMDDHHmmSSOHH'mm'
   * Your implementation is good but needs small fixes
   */
  protected parsePdfDate(value: string) {
    if (!value) return null;

    // Clean the input
    const v = value.startsWith("D:") ? value.slice(2) : value;

    // Fixed regex - make timezone optional and handle variations
    const re =
      /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:(Z|[+\-])(\d{2})'?(\d{2})'?)?/;
    const m = v.match(re);
    if (!m) return null;

    const [_, Y, Mo, D, H, Mi, S, tzIndicator, tzHours, tzMinutes] = m;

    // Build date components with defaults
    const yyyy = Y;
    const mm = Mo ?? "01";
    const dd = D ?? "01";
    const hh = H ?? "00";
    const mi = Mi ?? "00";
    const ss = S ?? "00";

    // Build timezone string
    let tz = "";
    if (tzIndicator) {
      if (tzIndicator === "Z") {
        tz = "Z";
      } else {
        // Handle +/- timezone
        const tzH = tzHours ?? "00";
        const tzM = tzMinutes ?? "00";
        tz = `${tzIndicator}${tzH.padStart(2, "0")}:${tzM.padStart(2, "0")}`;
      }
    }

    // Return ISO 8601 format
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${hh.padStart(2, "0")}:${mi.padStart(2, "0")}:${ss.padStart(2, "0")}${tz}`;
  }

  protected getPdfInfoString(text: string, key: string) {
    // Parenthesis format
    let m = text.match(new RegExp(`\/${key}\\s*\(([^)]*)\)`));
    if (m?.[1]) return this.decodePdfString(m[1]);
    // Hex format
    m = text.match(new RegExp(`\/${key}\\s*<([0-9A-Fa-f]+)>`));
    if (m?.[1]) return this.decodeHexString(m[1]);
    return null;
  }

  /**
   * Extract date fields from PDF - handles all encoding formats
   * This is what you need to call from your main PDF parser
   */
  protected extractPdfDate(text: string, fieldName: string): string | null {
    // Method 1: Parentheses format (most common)
    // Example: /CreationDate (D:20241225120000+05'00')
    let match = text.match(new RegExp(`\/${fieldName}\\s*\\(([^)]+)\\)`));
    if (match?.[1]) {
      // Decode PDF string escapes first
      const decoded = this.decodePdfString(match[1]);
      return this.parsePdfDate(decoded);
    }

    // Method 2: Hexadecimal format
    // Example: /CreationDate <443A32303234313232353132303030302B30352730302720>
    match = text.match(new RegExp(`\/${fieldName}\\s*<([0-9A-Fa-f]+)>`));
    if (match?.[1]) {
      const decoded = this.decodeHexString(match[1]);
      return this.parsePdfDate(decoded);
    }

    // Method 3: Direct string (rare but possible)
    // Example: /CreationDate D:20241225120000Z
    match = text.match(new RegExp(`\/${fieldName}\\s+(D:[^\\s/>]+)`));
    if (match?.[1]) {
      return this.parsePdfDate(match[1]);
    }

    return null;
  }
}
