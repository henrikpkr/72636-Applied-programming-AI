import { pdfToMarkdown } from "./converters/pdf.js";
import { docxToMarkdown } from "./converters/docx.js";
import { htmlToMarkdown } from "./converters/html.js";
import { csvToMarkdown } from "./converters/csv.js";
import { jsonToMarkdown } from "./converters/json.js";

const dropzone = document.getElementById("dropzone");
const output = document.getElementById("output");
const fileInput = document.getElementById("fileInput");

async function processFile(file) {
    try {
        await convert(file);
    } catch (err) {
        output.value = `Conversion failed: ${err.message}`;
    }
}

async function convert(file) {
    const extension =
        file.name.split(".").pop().toLowerCase();

    let markdown = "";

    switch (extension) {
        case "pdf":
            markdown = await pdfToMarkdown(file);
            break;

        case "docx":
            markdown = await docxToMarkdown(file);
            break;

        case "html":
        case "htm":
            markdown = await htmlToMarkdown(file);
            break;

        case "csv":
            markdown = await csvToMarkdown(file);
            break;

        case "json":
            markdown = await jsonToMarkdown(file);
            break;

        case "txt":
        case "md":
            markdown = await file.text();
            break;

        default:
            markdown =
                `Unsupported format: ${extension}`;
    }

    output.value = markdown;
}

dropzone.addEventListener("click", () => fileInput.click());

dropzone.addEventListener("dragover", e => {
    e.preventDefault();
    dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", e => {
    e.preventDefault();

    dropzone.classList.remove("dragover");

    const file = e.dataTransfer.files[0];

    if (file) {
        processFile(file);
    }
});

fileInput.addEventListener("change", e => {
    if (e.target.files[0]) {
        processFile(e.target.files[0]);
    }
});

document
    .getElementById("copyBtn")
    .addEventListener("click", async () => {

    await navigator.clipboard.writeText(
        output.value
    );
});

document
    .getElementById("downloadBtn")
    .addEventListener("click", () => {

    const blob = new Blob(
        [output.value],
        { type: "text/markdown" }
    );

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        "converted.md";

    link.click();
});