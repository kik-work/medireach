import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/data";

/**
 * Uploaded files (prescriptions and test reports), stored next to the JSON database in .data/uploads/<record id>.
 * Only photos (JPEG, PNG, WebP) and PDFs are accepted. The first bytes must match the declared
 * type, so a renamed HTML or script file is refused.
 */
const DIR = path.join(DATA_DIR, "uploads");

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  "application/pdf": (b) => b.subarray(0, 5).toString("latin1") === "%PDF-",
};

export const ACCEPTED_TYPES = Object.keys(SIGNATURES);

export type ParsedUpload = { ok: true; type: string; bytes: Buffer } | { ok: false; error: string };

/** Reads a `data:<type>;base64,<data>` URL sent by the browser. */
export function parseDataUrl(value: unknown): ParsedUpload {
  if (typeof value !== "string") return { ok: false, error: "Attach a photo or PDF." };
  const match = /^data:([\w.+/-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(value);
  if (!match) return { ok: false, error: "The attached file could not be read." };
  const type = match[1].toLowerCase();
  const check = SIGNATURES[type];
  if (!check) return { ok: false, error: "Attach a JPEG, PNG, WebP photo or a PDF." };
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0) return { ok: false, error: "The attached file is empty." };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, error: "The file is larger than 3 MB." };
  if (!check(bytes)) return { ok: false, error: "The file content does not match its type." };
  return { ok: true, type, bytes };
}

const fileOf = (id: string) => {
  if (!/^[\w-]+$/.test(id)) throw new Error("Invalid upload id");
  return path.join(DIR, id);
};

/** Returns false when the file system is read-only. */
export function writeUpload(id: string, bytes: Buffer): boolean {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(fileOf(id), bytes);
    return true;
  } catch {
    return false;
  }
}

export function readUpload(id: string): Buffer | null {
  try {
    return fs.readFileSync(fileOf(id));
  } catch {
    return null;
  }
}

export function removeUpload(id: string) {
  try {
    fs.rmSync(fileOf(id), { force: true });
  } catch {
    // Nothing to remove.
  }
}
