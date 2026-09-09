import * as officeParser from 'officeparser';
import { extractPdfWithGemini } from './gemini-ocr';

/**
 * Downloads a file from a URL and extracts its text content if it's a supported format (PDF, PPTX, DOCX, XLSX).
 */
export async function extractTextFromAttachment(url: string, mimeType: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch attachment from URL: ${url}, status: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If it's a PDF, try the advanced Gemini OCR pipeline first
    if (mimeType === "application/pdf") {
      const geminiText = await extractPdfWithGemini(buffer, mimeType);
      if (geminiText) {
        return geminiText;
      }
    }

    // Fallback or non-PDF files: use officeparser (supports PDF, DOCX, PPTX, XLSX)
    const text = await officeParser.parseOffice(buffer) as unknown as string;
    return typeof text === 'string' ? text.trim() : null;
  } catch (error) {
    console.error("Error parsing attachment:", error);
    return null;
  }
}
