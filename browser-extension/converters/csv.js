import Papa from "papaparse";

// Escape pipes and flatten line breaks so a cell cannot break the Markdown table.
const cell = value => String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const row = cells => "| " + cells.map(cell).join(" | ") + " |";

export async function csvToMarkdown(file) {
    const { data: rows } = Papa.parse(await file.text(), { skipEmptyLines: true });
    if (!rows.length) return "";

    const [header, ...body] = rows;
    return [
        row(header),
        row(header.map(() => "---")),
        ...body.map(r => row(header.map((_, i) => r[i])))
    ].join("\n");
}
