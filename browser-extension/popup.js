import { mountConverter } from "./converters/index.js";

const $ = id => document.getElementById(id);

mountConverter({
    dropzone: $("dropzone"),
    fileInput: $("fileInput"),
    output: $("output"),
    copyBtn: $("copyBtn"),
    downloadBtn: $("downloadBtn")
});
