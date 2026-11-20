export async function jsonToMarkdown(file) {

    const text =
        await file.text();

    const json =
        JSON.parse(text);

    return [
        "# JSON",
        "",
        "```json",
        JSON.stringify(json, null, 2),
        "```"
    ].join("\n");
}