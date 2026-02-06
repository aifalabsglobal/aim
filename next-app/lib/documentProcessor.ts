import fs from "fs";
import path from "path";

type Attachment = { path?: string; url?: string; mimetype: string; originalName?: string };

export async function processDocument(attachment: Attachment): Promise<{ filename: string; content: string; error?: boolean } | null> {
  const relativePath = attachment.path ?? attachment.url;
  if (!relativePath) return { filename: "unknown", content: "Error: Missing file path", error: true };
  const filePath = path.join(process.cwd(), relativePath);
  const mimeType = attachment.mimetype;
  const filename = attachment.originalName ?? path.basename(filePath);

  if (!fs.existsSync(filePath)) return { filename, content: "Error: File not found", error: true };

  try {
    if (mimeType.startsWith("text/") || mimeType === "application/json") {
      const content = fs.readFileSync(filePath, "utf8");
      return { filename, content: content.trim() };
    }
    if (mimeType === "application/pdf" || mimeType.startsWith("image/")) {
      // PDF/OCR not implemented here; add pdf-parse + tesseract later if needed
      return null;
    }
    return null;
  } catch (err) {
    return { filename, content: `Error: ${(err as Error).message}`, error: true };
  }
}
