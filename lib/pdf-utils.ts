import { PDFDocument } from "@cantoo/pdf-lib"

export async function processPdf(
  file: File,
  password?: string,
): Promise<{ pdfBytes: ArrayBuffer | null; isEncrypted: boolean }> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Load the PDF document
    let pdfDoc: PDFDocument
    let isEncrypted = false

    try {
      // First try to load without password
      pdfDoc = await PDFDocument.load(arrayBuffer, {
        password: password ?? "",
        ignoreEncryption: false,
      })
    } catch (error) {
      console.error("processPDFError", error)
      // If it fails, the PDF might be encrypted
      isEncrypted = true

      return { pdfBytes: null, isEncrypted }
    }

    // At this point, we have a loaded PDF document
    // Save it to bytes and return
    const pdfBytes = await pdfDoc.save()

    return {
      pdfBytes: pdfBytes.buffer,
      isEncrypted: false,
    }
  } catch (error) {
    console.error("Error processing PDF:", error)
    throw new Error("Failed to process PDF")
  }
}
