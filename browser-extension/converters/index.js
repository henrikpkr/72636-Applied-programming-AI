import { pdfToMarkdown } from "./pdf.js";
import { docxToMarkdown } from "./docx.js";
import { htmlToMarkdown } from "./html.js";
import { csvToMarkdown } from "./csv.js";
import { jsonToMarkdown } from "./json.js";

const converters = {
    pdf: pdfToMarkdown,
    docx: docxToMarkdown,
    html: htmlToMarkdown,
    htm: htmlToMarkdown,
    csv: csvToMarkdown,
    json: jsonToMarkdown,
    txt: file => file.text(),
    md: file => file.text()
};

export const SUPPORTED = Object.keys(converters);

// Picks a converter from the file extension and returns Markdown text.
export async function convertFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const fn = converters[ext];
    if (!fn) throw new Error(`Unsupported format: .${ext}`);
    return fn(file);
}

// Wires a drop zone, file input, textarea and copy/download buttons together.
// Used by both the toolbar popup and the new tab page.
export function mountConverter({ dropzone, fileInput, output, copyBtn, downloadBtn }) {
    let baseName = "converted";

    async function handle(file) {
        if (!file) return;
        baseName = file.name.replace(/\.[^.]+$/, "") || "converted";
        output.value = `Converting ${file.name}…`;
        try {
            output.value = await convertFile(file);
        } catch (err) {
            output.value = `Conversion failed: ${err.message}`;
        }
    }

    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("dragover", e => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone.addEventListener("drop", e => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        handle(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener("change", e => handle(e.target.files[0]));

    copyBtn.addEventListener("click", () => navigator.clipboard.writeText(output.value));
    downloadBtn.addEventListener("click", () => {
        const url = URL.createObjectURL(new Blob([output.value], { type: "text/markdown" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${baseName}.md`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    return handle;
}
