const storageKey = "cordia-template-state";

const defaultState = {
  appName: "Cordia",
  theme: "system",
  items: [
    { id: crypto.randomUUID(), text: "Replace starter content", done: false },
    { id: crypto.randomUUID(), text: "Add app-specific data model", done: false },
    { id: crypto.randomUUID(), text: "Deploy public folder to Cloudflare Pages", done: true },
  ],
};

const elements = {
  appNameInput: document.querySelector("#app-name"),
  clearItemsButton: document.querySelector("#clear-items"),
  itemCount: document.querySelector("#item-count"),
  itemForm: document.querySelector("#item-form"),
  itemInput: document.querySelector("#item-input"),
  itemList: document.querySelector("#item-list"),
  navLinks: document.querySelectorAll(".nav a"),
  saveState: document.querySelector("#save-state"),
  themeSelect: document.querySelector("#theme-select"),
  title: document.querySelector(".topbar h1"),
};

let state = loadState();
let saveTimer;

function loadState() {
  try {
    const storedState = JSON.parse(localStorage.getItem(storageKey));
    return { ...defaultState, ...storedState };
  } catch {
    return defaultState;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  elements.saveState.textContent = "Saved locally";
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    elements.saveState.textContent = "Changes autosave";
  }, 1600);
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
}

function render() {
  document.title = `${state.appName} App Template`;
  elements.title.textContent = state.appName;
  elements.appNameInput.value = state.appName;
  elements.themeSelect.value = state.theme;
  elements.itemCount.textContent = state.items.length;
  applyTheme();
  renderItems();
}

function renderItems() {
  elements.itemList.replaceChildren();

  if (state.items.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No items yet. Add one to start shaping this template.";
    elements.itemList.append(emptyState);
    return;
  }

  state.items.forEach((item) => {
    const row = document.createElement("li");
    row.className = "item-row";
    row.dataset.done = item.done;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.done;
    checkbox.ariaLabel = `Mark ${item.text} complete`;
    checkbox.addEventListener("change", () => updateItem(item.id, { done: checkbox.checked }));

    const label = document.createElement("span");
    label.textContent = item.text;

    const removeButton = document.createElement("button");
    removeButton.className = "icon-button";
    removeButton.type = "button";
    removeButton.ariaLabel = `Remove ${item.text}`;
    removeButton.textContent = "x";
    removeButton.addEventListener("click", () => removeItem(item.id));

    row.append(checkbox, label, removeButton);
    elements.itemList.append(row);
  });
}

function updateItem(id, patch) {
  state = {
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  };
  saveState();
  render();
}

function removeItem(id) {
  state = {
    ...state,
    items: state.items.filter((item) => item.id !== id),
  };
  saveState();
  render();
}

function addItem(text) {
  state = {
    ...state,
    items: [{ id: crypto.randomUUID(), text, done: false }, ...state.items],
  };
  saveState();
  render();
}

elements.itemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.itemInput.value.trim();
  if (!text) return;
  addItem(text);
  elements.itemInput.value = "";
  elements.itemInput.focus();
});

elements.clearItemsButton.addEventListener("click", () => {
  state = { ...state, items: state.items.filter((item) => !item.done) };
  saveState();
  render();
});

elements.appNameInput.addEventListener("input", () => {
  state = { ...state, appName: elements.appNameInput.value.trim() || "Cordia" };
  saveState();
  render();
});

elements.themeSelect.addEventListener("change", () => {
  state = { ...state, theme: elements.themeSelect.value };
  saveState();
  render();
});

window.addEventListener("hashchange", updateCurrentNavLink);

function updateCurrentNavLink() {
  const currentHash = window.location.hash || "#overview";
  elements.navLinks.forEach((link) => {
    link.setAttribute("aria-current", link.getAttribute("href") === currentHash ? "page" : "false");
  });
}

render();
updateCurrentNavLink();
