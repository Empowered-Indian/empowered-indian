import { pdf } from "@react-pdf/renderer";

/**
 * Common PDF generation and download function
 * @param {JSX.Element} docNode - The PDF document JSX element
 * @param {string} fileName - The filename for the PDF
 * @returns {Promise<boolean>} - Returns true if successful
 */
export async function generateAndDownloadPdf(docNode, fileName) {
    try {
        const asPdf = pdf(docNode, { author: "Empowered Indian" });
        const blob = await asPdf.toBlob();
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = fileName;
        window.document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error("PDF generation failed:", error);
        throw error;
    }
}