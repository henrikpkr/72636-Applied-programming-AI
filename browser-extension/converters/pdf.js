import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Bundled locally: MV3 forbids loading scripts from a CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function pdfToMarkdown(file) {

    const bytes =
        await file.arrayBuffer();

    const pdf =
        await pdfjsLib
            .getDocument({
                data: bytes
            })
            .promise;

    let result = "";

    for (
        let pageNum = 1;
        pageNum <= pdf.numPages;
        pageNum++
    ) {

        const page =
            await pdf.getPage(pageNum);

        const content =
            await page.getTextContent();

        result +=
            "\n\n# Page " +
            pageNum +
            "\n\n";

        result += content.items
            .map(item => item.str)
            .join(" ");
    }

    return result;
}