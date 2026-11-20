import { mountConverter } from "./converters/index.js";

const $ = id => document.getElementById(id);

// --- Storage: chrome.storage.local inside the extension, localStorage when previewing with `vite`.
const hasChrome = typeof chrome !== "undefined" && chrome.storage?.local;
const store = {
    async get(key, fallback) {
        if (hasChrome) return (await chrome.storage.local.get(key))[key] ?? fallback;
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    },
    set(key, value) {
        if (hasChrome) return chrome.storage.local.set({ [key]: value });
        localStorage.setItem(key, JSON.stringify(value));
    }
};

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

// --- Background: one of a few local gradients, changing once per day (no network calls).
const BACKGROUNDS = [
    "linear-gradient(135deg, #1e3c72, #2a5298)",
    "linear-gradient(135deg, #134e5e, #71b280)",
    "linear-gradient(135deg, #42275a, #734b6d)",
    "linear-gradient(135deg, #0f2027, #2c5364)",
    "linear-gradient(135deg, #614385, #516395)",
    "linear-gradient(135deg, #c04848, #480048)",
    "linear-gradient(135deg, #283c86, #45a247)"
];
const dayNumber = Math.floor(Date.now() / 86400000);
document.body.style.setProperty("--bg", BACKGROUNDS[dayNumber % BACKGROUNDS.length]);

// --- Clock and greeting
function tick() {
    const now = new Date();
    $("clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const h = now.getHours();
    $("greetWord").textContent = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
tick();
setInterval(tick, 1000);

// --- Editable name
const nameEl = $("name");
nameEl.textContent = await store.get("name", "friend");
nameEl.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); nameEl.blur(); }
});
nameEl.addEventListener("blur", () => {
    const value = nameEl.textContent.trim() || "friend";
    nameEl.textContent = value;
    store.set("name", value);
});

// --- Daily focus (resets automatically on a new day)
let focus = await store.get("focus", null);
if (focus?.date !== today()) focus = null;

function renderFocus() {
    const has = Boolean(focus);
    $("focusInput").hidden = has;
    $("focusLabel").textContent = has ? "Today" : "What is your main focus for today?";
    $("focusDone").hidden = !has;
    if (has) {
        $("focusText").textContent = focus.text;
        $("focusCheck").checked = focus.done;
        $("focusDone").classList.toggle("done", focus.done);
    }
}
$("focusInput").addEventListener("keydown", e => {
    const text = e.target.value.trim();
    if (e.key !== "Enter" || !text) return;
    focus = { text, done: false, date: today() };
    e.target.value = "";
    store.set("focus", focus);
    renderFocus();
});
$("focusCheck").addEventListener("change", e => {
    focus.done = e.target.checked;
    store.set("focus", focus);
    renderFocus();
});
$("focusClear").addEventListener("click", () => {
    focus = null;
    store.set("focus", null);
    renderFocus();
});
renderFocus();

// --- To-do list
let todos = await store.get("todos", []);

function renderTodos() {
    const list = $("todoList");
    list.replaceChildren(...todos.map((todo, i) => {
        const li = document.createElement("li");
        li.className = todo.done ? "done" : "";
        const box = Object.assign(document.createElement("input"), { type: "checkbox", checked: todo.done });
        box.addEventListener("change", () => { todo.done = box.checked; saveTodos(); });
        const text = Object.assign(document.createElement("span"), { textContent: todo.text });
        const del = Object.assign(document.createElement("button"), { className: "link", textContent: "×", title: "Delete" });
        del.addEventListener("click", () => { todos.splice(i, 1); saveTodos(); });
        li.append(box, text, del);
        return li;
    }));
    const open = todos.filter(t => !t.done).length;
    $("todoToggle").textContent = open ? `To-do (${open})` : "To-do";
}
function saveTodos() {
    store.set("todos", todos);
    renderTodos();
}
$("todoInput").addEventListener("keydown", e => {
    const text = e.target.value.trim();
    if (e.key !== "Enter" || !text) return;
    todos.push({ text, done: false });
    e.target.value = "";
    saveTodos();
});
renderTodos();

// --- Quote of the day (local list, no API)
const QUOTES = [
    ["Simplicity is prerequisite for reliability.", "Edsger W. Dijkstra"],
    ["Well begun is half done.", "Aristotle"],
    ["It always seems impossible until it's done.", "Nelson Mandela"],
    ["The secret of getting ahead is getting started.", "Mark Twain"],
    ["What gets measured gets managed.", "Peter Drucker"],
    ["First, solve the problem. Then, write the code.", "John Johnson"],
    ["Make it work, make it right, make it fast.", "Kent Beck"]
];
const [quote, author] = QUOTES[dayNumber % QUOTES.length];
$("quote").textContent = `“${quote}” — ${author}`;

// --- Panels (Markdown converter on the left, to-dos on the right)
function toggle(panelId) {
    const panel = $(panelId);
    panel.hidden = !panel.hidden;
}
$("mdToggle").addEventListener("click", () => toggle("mdPanel"));
$("todoToggle").addEventListener("click", () => toggle("todoPanel"));

const convertDropped = mountConverter({
    dropzone: $("dropzone"),
    fileInput: $("fileInput"),
    output: $("output"),
    copyBtn: $("copyBtn"),
    downloadBtn: $("downloadBtn")
});

// Dropping a file anywhere on the page opens the converter instead of navigating to the file.
window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("drop", e => {
    e.preventDefault();
    if (e.target.closest("#dropzone")) return;
    $("mdPanel").hidden = false;
    convertDropped(e.dataTransfer.files[0]);
});
