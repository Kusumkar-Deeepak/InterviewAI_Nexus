import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url"; // <- use Vite-style import

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;


export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item) => item.str).join(" ") + "\n";
    }

    if (!fullText.trim()) {
      throw new Error("No extractable text found. This might be a scanned image PDF.");
    }

    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error);
    
    if (error.name === "InvalidPDFException") {
      throw new Error("The PDF structure is invalid or the file is corrupted.");
    }

    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};