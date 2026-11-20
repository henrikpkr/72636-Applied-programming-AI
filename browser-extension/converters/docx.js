import mammoth from "mammoth";

export async function docxToMarkdown(file) {

    const buffer =
        await file.arrayBuffer();

    const result =
        await mammoth.convertToMarkdown({
            arrayBuffer: buffer
        });

    return result.value;
}