import TurndownService from "turndown";

export async function htmlToMarkdown(file) {
    const html = await file.text();

    const turndown =
        new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced" });

    return turndown.turndown(html);
}