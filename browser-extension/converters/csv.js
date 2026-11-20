import Papa from "papaparse";

export async function csvToMarkdown(file) {

    const text =
        await file.text();

    const parsed =
        Papa.parse(text);

    const rows = parsed.data;

    if (!rows.length) {
        return "";
    }

    const header = rows[0];

    const markdown = [];

    markdown.push(
        "| " + header.join(" | ") + " |"
    );

    markdown.push(
        "| " +
        header.map(() => "---").join(" | ")
        + " |"
    );

    for (const row of rows.slice(1)) {

        markdown.push(
            "| " + row.join(" | ") + " |"
        );
    }

    return markdown.join("\n");
}