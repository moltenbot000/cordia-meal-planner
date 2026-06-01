const storageKey = "meal-planner-state-v1";

const defaultDailyGoal = {
  calories: 2500,
  carbohydrates: 125,
  protein: 250,
  fat: 111,
  fiber: 38,
};

const defaultGoalSettings = {
  cutting: {
    label: "Cutting",
    note: "Prioritize high protein, fiber, and a controlled calorie deficit.",
    targets: { calories: 2100, carbohydrates: 160, protein: 190, fat: 70, fiber: 38 },
  },
  dirtyBulking: {
    label: "Dirty Bulking",
    note: "Higher-calorie planning with fewer food restrictions.",
    targets: { calories: 3500, carbohydrates: 430, protein: 210, fat: 115, fiber: 35 },
  },
  intermittentFasting: {
    label: "Intermittent Fasting",
    note: "Cluster meals inside a shorter eating window with bigger servings.",
    targets: { calories: 2400, carbohydrates: 220, protein: 185, fat: 85, fiber: 34 },
  },
  reverseDieting: {
    label: "Reverse Dieting",
    note: "Increase calories gradually while keeping protein stable.",
    targets: { calories: 2600, carbohydrates: 280, protein: 180, fat: 80, fiber: 36 },
  },
};

const goalOrder = ["cutting", "dirtyBulking", "intermittentFasting", "reverseDieting"];
const meals = ["I", "II", "III", "IV"];
const recommendedFoodByMeal = {
  I: "greek-yogurt-berries",
  II: "chicken-shawarma-wrap",
  III: "salmon-rice-bowl",
  IV: "cottage-cheese-almonds",
};

const defaultFoods = [
  {
    id: "chicken-shawarma-wrap",
    name: "Chicken Shawarma Wrap",
    servingSize: "1 wrap",
    source: "Provided food item",
    nutrition: {
      calories: 720,
      protein: 45,
      carbohydrates: 58,
      fat: 34,
      fiber: 5,
      sugar: 4,
    },
  },
  {
    id: "greek-yogurt-berries",
    name: "Greek Yogurt with Berries",
    servingSize: "1 bowl",
    source: "Starter item",
    nutrition: {
      calories: 260,
      protein: 24,
      carbohydrates: 28,
      fat: 5,
      fiber: 4,
      sugar: 18,
    },
  },
  {
    id: "salmon-rice-bowl",
    name: "Salmon Rice Bowl",
    servingSize: "1 bowl",
    source: "Starter item",
    nutrition: {
      calories: 640,
      protein: 42,
      carbohydrates: 62,
      fat: 24,
      fiber: 6,
      sugar: 8,
    },
  },
  {
    id: "cottage-cheese-almonds",
    name: "Cottage Cheese with Almonds",
    servingSize: "1 bowl",
    source: "Starter item",
    nutrition: {
      calories: 340,
      protein: 32,
      carbohydrates: 18,
      fat: 16,
      fiber: 4,
      sugar: 10,
    },
  },
];

const elements = {
  calendarOpen: document.querySelector("#calendar-open"),
  clearDay: document.querySelector("#clear-day"),
  currentDate: document.querySelector("#current-date"),
  dailyBudget: document.querySelector("#daily-budget"),
  datePicker: document.querySelector("#date-picker"),
  dropZone: document.querySelector("#drop-zone"),
  foodSearch: document.querySelector("#food-search"),
  foodManagerSearch: document.querySelector("#food-manager-search"),
  foodForm: document.querySelector("#food-form"),
  foodFormTitle: document.querySelector("#food-form-title"),
  managedFoodList: document.querySelector("#managed-food-list"),
  newFood: document.querySelector("#new-food"),
  resetGoal: document.querySelector("#reset-goal"),
  goalEditorSelect: document.querySelector("#goal-editor-select"),
  goalForm: document.querySelector("#goal-form"),
  goalFormTitle: document.querySelector("#goal-form-title"),
  goalGrid: document.querySelector("#goal-grid"),
  goalNote: document.querySelector("#goal-note"),
  goalSelect: document.querySelector("#goal-select"),
  mealList: document.querySelector("#meal-list"),
  nextDay: document.querySelector("#next-day"),
  photoInput: document.querySelector("#photo-input"),
  photoResult: document.querySelector("#photo-result"),
  previousDay: document.querySelector("#previous-day"),
  searchResults: document.querySelector("#search-results"),
  totals: {
    calories: document.querySelector("#total-calories"),
    carbohydrates: document.querySelector("#total-carbs"),
    protein: document.querySelector("#total-protein"),
    fat: document.querySelector("#total-fat"),
    fiber: document.querySelector("#total-fiber"),
  },
  goalTargets: {
    calories: document.querySelector("#goal-calories"),
    carbohydrates: document.querySelector("#goal-carbs"),
    protein: document.querySelector("#goal-protein"),
    fat: document.querySelector("#goal-fat"),
    fiber: document.querySelector("#goal-fiber"),
  },
  remaining: {
    calories: document.querySelector("#remaining-calories"),
    carbohydrates: document.querySelector("#remaining-carbs"),
    protein: document.querySelector("#remaining-protein"),
    fat: document.querySelector("#remaining-fat"),
    fiber: document.querySelector("#remaining-fiber"),
  },
  entryDialog: document.querySelector("#entry-dialog"),
  entryForm: document.querySelector("#entry-form"),
  entryCancel: document.querySelector("#entry-cancel"),
  tabButtons: Array.from(document.querySelectorAll(".tab-button")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
};

let state = loadState();
let editingEntry = null;

function loadState() {
  const today = formatDateKey(new Date());
  const dateFromUrl = getUrlDate();
  try {
    const storedState = JSON.parse(localStorage.getItem(storageKey));
    return normalizeState({
      selectedDate: today,
      goal: "cutting",
      activeTab: "diary",
      goalTargets: getDefaultTargets(),
      foods: defaultFoods,
      deletedFoodIds: [],
      diary: {},
      ...storedState,
      selectedDate: dateFromUrl || storedState?.selectedDate || today,
    });
  } catch {
    return normalizeState({
      selectedDate: dateFromUrl || today,
      goal: "cutting",
      activeTab: "diary",
      goalTargets: getDefaultTargets(),
      foods: defaultFoods,
      deletedFoodIds: [],
      diary: {},
    });
  }
}

function getDefaultTargets() {
  return Object.fromEntries(
    goalOrder.map((goal) => [goal, { ...defaultGoalSettings[goal].targets }]),
  );
}

function normalizeGoalKey(goal) {
  return goalOrder.includes(goal) ? goal : goal === "bulking" ? "dirtyBulking" : "cutting";
}

function normalizeState(nextState) {
  const { dailyCaloricBudget, ...stateWithoutLegacyBudget } = nextState;
  const deletedFoodIds = Array.isArray(nextState.deletedFoodIds) ? nextState.deletedFoodIds : [];
  const mergedFoods = defaultFoods.filter((food) => !deletedFoodIds.includes(food.id));
  (nextState.foods || []).forEach((food) => {
    if (
      !deletedFoodIds.includes(food.id) &&
      !mergedFoods.some((defaultFood) => defaultFood.id === food.id)
    ) {
      mergedFoods.push(food);
    }
  });
  const goalTargets = getDefaultTargets();
  Object.entries(nextState.goalTargets || {}).forEach(([goal, targets]) => {
    const normalizedGoal = normalizeGoalKey(goal);
    goalTargets[normalizedGoal] = normalizeTargets(targets, goalTargets[normalizedGoal]);
  });
  if (Number.isFinite(Number(dailyCaloricBudget))) {
    goalTargets.cutting.calories = Math.max(0, Number(dailyCaloricBudget));
  }

  return {
    ...stateWithoutLegacyBudget,
    selectedDate: isValidDateKey(nextState.selectedDate)
      ? nextState.selectedDate
      : formatDateKey(new Date()),
    goal: normalizeGoalKey(nextState.goal),
    activeTab: ["diary", "goals", "food"].includes(nextState.activeTab)
      ? nextState.activeTab
      : "diary",
    goalTargets,
    foods: mergedFoods,
    deletedFoodIds,
    diary: nextState.diary || {},
  };
}

function normalizeTargets(targets, fallback = defaultDailyGoal) {
  return Object.fromEntries(
    Object.keys(defaultDailyGoal).map((key) => [
      key,
      Number.isFinite(Number(targets?.[key])) && Number(targets[key]) >= 0
        ? Number(targets[key])
        : fallback[key],
    ]),
  );
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || "")) return false;
  return formatDateKey(parseDateKey(dateKey)) === dateKey;
}

function getUrlDate() {
  const date = new URLSearchParams(window.location.search).get("date");
  return isValidDateKey(date) ? date : null;
}

function updateDateUrl(dateKey, mode = "push") {
  const url = new URL(window.location.href);
  url.searchParams.set("date", dateKey);
  const method = mode === "replace" ? "replaceState" : "pushState";
  window.history[method]({}, "", url);
}

function formatDisplayDate(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function shiftDate(days) {
  const nextDate = parseDateKey(state.selectedDate);
  nextDate.setDate(nextDate.getDate() + days);
  setSelectedDate(formatDateKey(nextDate));
}

function setSelectedDate(dateKey, mode = "push") {
  if (!isValidDateKey(dateKey)) return;
  state = { ...state, selectedDate: dateKey };
  saveState();
  updateDateUrl(dateKey, mode);
  render();
}

function getDayMeals() {
  return state.diary[state.selectedDate] || {};
}

function getMealItems(meal) {
  return getDayMeals()[meal] || [];
}

function setMealItems(meal, items) {
  state = {
    ...state,
    diary: {
      ...state.diary,
      [state.selectedDate]: {
        ...getDayMeals(),
        [meal]: items,
      },
    },
  };
  saveState();
  render();
}

function addFoodToMeal(foodId, meal) {
  const food = state.foods.find((item) => item.id === foodId);
  if (!food) return;

  const entry = {
    id: crypto.randomUUID(),
    foodId,
    name: food.name,
    servingSize: food.servingSize,
    nutrition: food.nutrition,
  };

  setMealItems(meal, [...getMealItems(meal), entry]);
}

function addRecommendedFoodToMeal(meal) {
  addFoodToMeal(recommendedFoodByMeal[meal], meal);
}

function removeMealEntry(meal, entryId) {
  setMealItems(
    meal,
    getMealItems(meal).filter((item) => item.id !== entryId),
  );
}

function updateMealEntry(meal, updatedEntry) {
  setMealItems(
    meal,
    getMealItems(meal).map((item) => (item.id === updatedEntry.id ? updatedEntry : item)),
  );
}

function addFood(food) {
  const existing = state.foods.find((item) => item.id === food.id);
  state = {
    ...state,
    foods: existing
      ? state.foods.map((item) => (item.id === food.id ? food : item))
      : [food, ...state.foods],
  };
  saveState();
  renderSearchResults();
  renderManagedFoods();
}

function updateFood(food) {
  state = {
    ...state,
    deletedFoodIds: state.deletedFoodIds.filter((id) => id !== food.id),
    foods: state.foods.some((item) => item.id === food.id)
      ? state.foods.map((item) => (item.id === food.id ? food : item))
      : [food, ...state.foods],
  };
  saveState();
  render();
}

function removeFood(foodId) {
  state = {
    ...state,
    deletedFoodIds: [...new Set([...state.deletedFoodIds, foodId])],
    foods: state.foods.filter((food) => food.id !== foodId),
  };
  saveState();
  resetFoodForm();
  render();
}

function getNutritionTotals() {
  return meals.reduce(
    (totals, meal) => {
      getMealItems(meal).forEach((entry) => {
        totals.calories += entry.nutrition.calories;
        totals.carbohydrates += entry.nutrition.carbohydrates;
        totals.protein += entry.nutrition.protein;
        totals.fat += entry.nutrition.fat;
        totals.fiber += entry.nutrition.fiber;
      });
      return totals;
    },
    { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: 0 },
  );
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("en-US");
}

function render() {
  elements.currentDate.textContent = formatDisplayDate(state.selectedDate);
  elements.dailyBudget.value = getCurrentGoalTargets().calories;
  elements.datePicker.value = state.selectedDate;
  elements.goalSelect.value = state.goal;
  elements.goalNote.textContent = defaultGoalSettings[state.goal].note;

  renderTabs();
  renderMeals();
  renderTotals();
  renderSearchResults();
  renderGoalOptions();
  renderGoals();
  renderManagedFoods();
}

function renderTabs() {
  elements.tabButtons.forEach((button) => {
    const tab = button.id.replace("-tab", "");
    button.setAttribute("aria-selected", String(tab === state.activeTab));
  });
  elements.tabPanels.forEach((panel) => {
    panel.hidden = panel.id !== `${state.activeTab}-panel`;
  });
}

function renderMeals() {
  elements.mealList.replaceChildren();

  meals.forEach((meal) => {
    const mealSection = document.createElement("section");
    mealSection.className = "meal-section";
    mealSection.setAttribute("aria-labelledby", `meal-${meal}`);

    const title = document.createElement("h3");
    title.id = `meal-${meal}`;
    title.textContent = meal;

    const entries = document.createElement("div");
    entries.className = "meal-entries";

    const mealItems = getMealItems(meal);
    if (mealItems.length === 0) {
      const empty = document.createElement("p");
      empty.className = "meal-empty";
      empty.textContent = "No food logged.";
      entries.append(empty);
    } else {
      mealItems.forEach((entry) => {
        entries.append(createMealEntry(entry, meal));
      });
    }

    const actions = document.createElement("div");
    actions.className = "meal-actions";

    const addLink = document.createElement("button");
    addLink.type = "button";
    addLink.textContent = "Add Food";
    addLink.addEventListener("click", () => {
      elements.foodSearch.focus();
      elements.foodSearch.dataset.targetMeal = meal;
    });

    const quickTools = document.createElement("button");
    quickTools.type = "button";
    quickTools.textContent = "Recommended";
    quickTools.addEventListener("click", () => addRecommendedFoodToMeal(meal));

    actions.append(addLink, quickTools);
    mealSection.append(title, entries, actions);
    elements.mealList.append(mealSection);
  });
}

function createMealEntry(entry, meal) {
  const row = document.createElement("div");
  row.className = "food-row";

  const details = document.createElement("div");
  details.className = "food-details";

  const name = document.createElement("strong");
  name.textContent = entry.name;

  const serving = document.createElement("small");
  serving.textContent = entry.servingSize;

  details.append(name, serving);

  const values = [
    entry.nutrition.calories,
    entry.nutrition.carbohydrates,
    entry.nutrition.protein,
    entry.nutrition.fat,
    entry.nutrition.fiber,
  ].map((value) => {
    const cell = document.createElement("span");
    cell.textContent = formatNumber(value);
    return cell;
  });

  const actionGroup = document.createElement("div");
  actionGroup.className = "entry-actions";

  const editButton = document.createElement("button");
  editButton.className = "entry-action";
  editButton.type = "button";
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => openEntryEditor(meal, entry));

  const removeButton = document.createElement("button");
  removeButton.className = "entry-action";
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => removeMealEntry(meal, entry.id));

  actionGroup.append(editButton, removeButton);
  row.append(details, ...values, actionGroup);
  return row;
}

function renderTotals() {
  const totals = getNutritionTotals();
  const dailyGoal = getCurrentGoalTargets();
  Object.entries(elements.goalTargets).forEach(([key, element]) => {
    element.textContent = formatNumber(dailyGoal[key]);
  });
  Object.entries(elements.totals).forEach(([key, element]) => {
    element.textContent = formatNumber(totals[key]);
  });
  Object.entries(elements.remaining).forEach(([key, element]) => {
    element.textContent = formatNumber(dailyGoal[key] - totals[key]);
  });
}

function getCurrentGoalTargets() {
  return state.goalTargets[state.goal] || defaultGoalSettings[state.goal].targets;
}

function setGoalTargets(goal, targets) {
  state = {
    ...state,
    goalTargets: {
      ...state.goalTargets,
      [goal]: normalizeTargets(targets, state.goalTargets[goal]),
    },
  };
  saveState();
  render();
}

function renderGoalOptions() {
  const goalSelects = [elements.goalSelect, elements.goalEditorSelect];
  goalSelects.forEach((select) => {
    if (select.options.length === goalOrder.length) return;
    select.replaceChildren(
      ...goalOrder.map((goal) => {
        const option = document.createElement("option");
        option.value = goal;
        option.textContent = defaultGoalSettings[goal].label;
        return option;
      }),
    );
  });
  elements.goalSelect.value = state.goal;
  elements.goalEditorSelect.value = state.goal;
}

function renderGoals() {
  elements.goalGrid.replaceChildren();
  goalOrder.forEach((goal) => {
    const settings = defaultGoalSettings[goal];
    const targets = state.goalTargets[goal];
    const card = document.createElement("article");
    card.className = "goal-card";
    if (goal === state.goal) card.dataset.active = "true";

    const title = document.createElement("h3");
    title.textContent = settings.label;
    const note = document.createElement("p");
    note.textContent = settings.note;
    const macros = document.createElement("small");
    macros.textContent = `${targets.calories} kcal | P ${targets.protein}g C ${targets.carbohydrates}g F ${targets.fat}g`;
    const button = document.createElement("button");
    button.className = "button secondary";
    button.type = "button";
    button.textContent = goal === state.goal ? "Current" : "Set current";
    button.addEventListener("click", () => {
      state = { ...state, goal };
      saveState();
      render();
    });

    card.append(title, note, macros, button);
    elements.goalGrid.append(card);
  });

  elements.goalFormTitle.textContent = defaultGoalSettings[state.goal].label;
  const form = elements.goalForm.elements;
  const targets = getCurrentGoalTargets();
  form.goal.value = state.goal;
  Object.entries(targets).forEach(([key, value]) => {
    form[key].value = value;
  });
}

function renderManagedFoods() {
  const query = elements.foodManagerSearch.value.trim().toLowerCase();
  const matches = state.foods.filter((food) => !query || food.name.toLowerCase().includes(query));
  elements.managedFoodList.replaceChildren();

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No foods found.";
    elements.managedFoodList.append(empty);
    return;
  }

  matches.forEach((food) => {
    const row = document.createElement("article");
    row.className = "managed-food";

    const summary = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = food.name;
    const meta = document.createElement("small");
    meta.textContent = `${food.servingSize} | ${food.nutrition.calories} kcal | P ${food.nutrition.protein}g C ${food.nutrition.carbohydrates}g F ${food.nutrition.fat}g`;
    summary.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "managed-actions";
    const edit = document.createElement("button");
    edit.className = "button secondary";
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => populateFoodForm(food));
    const remove = document.createElement("button");
    remove.className = "button secondary";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeFood(food.id));
    actions.append(edit, remove);

    row.append(summary, actions);
    elements.managedFoodList.append(row);
  });
}

function populateFoodForm(food) {
  elements.foodFormTitle.textContent = "Edit food";
  const form = elements.foodForm.elements;
  form.id.value = food.id;
  form.name.value = food.name;
  form.servingSize.value = food.servingSize;
  form.calories.value = food.nutrition.calories;
  form.carbohydrates.value = food.nutrition.carbohydrates;
  form.protein.value = food.nutrition.protein;
  form.fat.value = food.nutrition.fat;
  form.fiber.value = food.nutrition.fiber;
  form.sugar.value = food.nutrition.sugar || 0;
  form.name.focus();
}

function resetFoodForm() {
  elements.foodFormTitle.textContent = "Add food";
  elements.foodForm.reset();
  elements.foodForm.elements.id.value = "";
}

function openEntryEditor(meal, entry) {
  editingEntry = { meal, entryId: entry.id };
  elements.entryForm.elements.name.value = entry.name;
  elements.entryForm.elements.servingSize.value = entry.servingSize;
  elements.entryForm.elements.calories.value = entry.nutrition.calories;
  elements.entryForm.elements.carbohydrates.value = entry.nutrition.carbohydrates;
  elements.entryForm.elements.protein.value = entry.nutrition.protein;
  elements.entryForm.elements.fat.value = entry.nutrition.fat;
  elements.entryForm.elements.fiber.value = entry.nutrition.fiber;
  elements.entryForm.elements.sugar.value = entry.nutrition.sugar || 0;
  elements.entryDialog.showModal();
  elements.entryForm.elements.name.focus();
}

function closeEntryEditor() {
  editingEntry = null;
  elements.entryDialog.close();
}

function renderSearchResults() {
  const query = elements.foodSearch.value.trim().toLowerCase();
  const matches = state.foods
    .filter((food) => !query || food.name.toLowerCase().includes(query))
    .slice(0, 8);

  elements.searchResults.replaceChildren();

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No foods found.";
    elements.searchResults.append(empty);
    return;
  }

  matches.forEach((food) => {
    const item = document.createElement("article");
    item.className = "result-card";

    const summary = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = food.name;
    const meta = document.createElement("small");
    meta.textContent = `${food.servingSize} | ${food.nutrition.calories} kcal | P ${food.nutrition.protein}g C ${food.nutrition.carbohydrates}g F ${food.nutrition.fat}g`;
    summary.append(name, meta);

    const controls = document.createElement("div");
    controls.className = "add-buttons";
    meals.forEach((meal) => {
      const button = document.createElement("button");
      button.className = meal === elements.foodSearch.dataset.targetMeal ? "selected" : "";
      button.type = "button";
      button.textContent = meal;
      button.ariaLabel = `Add ${food.name} to meal ${meal}`;
      button.addEventListener("click", () => addFoodToMeal(food.id, meal));
      controls.append(button);
    });

    item.append(summary, controls);
    elements.searchResults.append(item);
  });
}

function estimateFoodFromImage(file, imageMetrics = {}) {
  const lowerName = file.name.toLowerCase();
  const imageHints = [
    {
      terms: ["wrap", "shawarma", "gyro", "burrito"],
      food: {
        name: "Photo Estimate: Chicken Shawarma Wrap",
        servingSize: "1 wrap",
        nutrition: { calories: 720, protein: 45, carbohydrates: 58, fat: 34, fiber: 5, sugar: 4 },
      },
    },
    {
      terms: ["salad", "greens"],
      food: {
        name: "Photo Estimate: Protein Salad",
        servingSize: "1 plate",
        nutrition: { calories: 430, protein: 32, carbohydrates: 26, fat: 22, fiber: 8, sugar: 7 },
      },
    },
    {
      terms: ["pizza"],
      food: {
        name: "Photo Estimate: Pizza Slices",
        servingSize: "2 slices",
        nutrition: { calories: 620, protein: 28, carbohydrates: 70, fat: 24, fiber: 4, sugar: 8 },
      },
    },
    {
      terms: ["rice", "bowl"],
      food: {
        name: "Photo Estimate: Rice Bowl",
        servingSize: "1 bowl",
        nutrition: { calories: 680, protein: 38, carbohydrates: 78, fat: 22, fiber: 7, sugar: 9 },
      },
    },
  ];

  const match = imageHints.find((hint) => hint.terms.some((term) => lowerName.includes(term)));
  const visualMatch =
    !match &&
    (imageMetrics.greenRatio > 0.2
      ? imageHints[1]
      : imageMetrics.warmRatio > 0.33 && imageMetrics.redRatio > 0.12
        ? imageHints[2]
        : imageMetrics.warmRatio > 0.24
          ? imageHints[0]
          : null);
  const fallback = {
    name: "Photo Estimate: Mixed Meal Plate",
    servingSize: "1 plate",
    nutrition: { calories: 650, protein: 35, carbohydrates: 58, fat: 28, fiber: 6, sugar: 8 },
  };

  const estimate = match ? match.food : visualMatch ? visualMatch.food : fallback;
  return {
    id: `photo-${slugify(estimate.name)}-${Date.now()}`,
    source: "Photo estimate",
    ...estimate,
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function analyzeImagePixels(image) {
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  let green = 0;
  let warm = 0;
  let red = 0;
  let visible = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const alpha = pixels[index + 3];
    if (alpha < 20) continue;
    visible += 1;
    if (g > r * 1.08 && g > b * 1.12) green += 1;
    if (r > 115 && g > 70 && b < 120) warm += 1;
    if (r > g * 1.18 && r > b * 1.18) red += 1;
  }

  return {
    greenRatio: green / visible,
    warmRatio: warm / visible,
    redRatio: red / visible,
  };
}

function handlePhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const previewUrl = URL.createObjectURL(file);
  const image = document.createElement("img");
  image.src = previewUrl;
  image.alt = "";
  image.addEventListener(
    "load",
    () => {
      const food = estimateFoodFromImage(file, analyzeImagePixels(image));
      addFood(food);
      URL.revokeObjectURL(previewUrl);

      elements.photoResult.hidden = false;
      elements.photoResult.replaceChildren();

      const summary = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = food.name;
      const macros = document.createElement("small");
      macros.textContent = `${food.nutrition.calories} kcal | P ${food.nutrition.protein}g C ${food.nutrition.carbohydrates}g F ${food.nutrition.fat}g`;
      const note = document.createElement("p");
      note.textContent = "Added to searchable foods.";
      summary.append(title, macros, note);

      elements.photoResult.append(image, summary);
    },
    { once: true },
  );
}

elements.previousDay.addEventListener("click", () => shiftDate(-1));
elements.nextDay.addEventListener("click", () => shiftDate(1));

elements.calendarOpen.addEventListener("click", () => {
  if (typeof elements.datePicker.showPicker === "function") {
    elements.datePicker.showPicker();
  } else {
    elements.datePicker.focus();
    elements.datePicker.click();
  }
});

elements.datePicker.addEventListener("change", () => {
  setSelectedDate(elements.datePicker.value || state.selectedDate);
});

elements.dailyBudget.addEventListener("change", () => {
  const targets = getCurrentGoalTargets();
  state = {
    ...state,
    goalTargets: {
      ...state.goalTargets,
      [state.goal]: {
        ...targets,
        calories: Math.max(0, Number(elements.dailyBudget.value) || 0),
      },
    },
  };
  saveState();
  render();
});

elements.clearDay.addEventListener("click", () => {
  const { [state.selectedDate]: removed, ...remainingDiary } = state.diary;
  state = { ...state, diary: remainingDiary };
  saveState();
  render();
});

elements.foodSearch.addEventListener("input", renderSearchResults);
elements.foodManagerSearch.addEventListener("input", renderManagedFoods);

elements.goalSelect.addEventListener("change", () => {
  state = { ...state, goal: elements.goalSelect.value };
  saveState();
  render();
});

elements.goalEditorSelect.addEventListener("change", () => {
  state = { ...state, goal: elements.goalEditorSelect.value };
  saveState();
  render();
});

elements.goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = elements.goalForm.elements;
  setGoalTargets(form.goal.value, {
    calories: form.calories.value,
    carbohydrates: form.carbohydrates.value,
    protein: form.protein.value,
    fat: form.fat.value,
    fiber: form.fiber.value,
  });
});

elements.resetGoal.addEventListener("click", () => {
  setGoalTargets(state.goal, defaultGoalSettings[state.goal].targets);
});

elements.tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state = { ...state, activeTab: button.id.replace("-tab", "") };
    saveState();
    render();
  });
});

elements.newFood.addEventListener("click", resetFoodForm);

elements.foodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = elements.foodForm.elements;
  const name = form.name.value.trim();
  if (!name) return;
  const id = form.id.value || slugify(name) || crypto.randomUUID();
  updateFood({
    id,
    name,
    servingSize: form.servingSize.value.trim(),
    source: "User food item",
    nutrition: {
      calories: Number(form.calories.value) || 0,
      carbohydrates: Number(form.carbohydrates.value) || 0,
      protein: Number(form.protein.value) || 0,
      fat: Number(form.fat.value) || 0,
      fiber: Number(form.fiber.value) || 0,
      sugar: Number(form.sugar.value) || 0,
    },
  });
  populateFoodForm(state.foods.find((food) => food.id === id));
});

elements.entryCancel.addEventListener("click", closeEntryEditor);

elements.entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editingEntry) return;
  const current = getMealItems(editingEntry.meal).find((item) => item.id === editingEntry.entryId);
  if (!current) {
    closeEntryEditor();
    return;
  }

  const form = elements.entryForm.elements;
  updateMealEntry(editingEntry.meal, {
    ...current,
    name: form.name.value.trim(),
    servingSize: form.servingSize.value.trim(),
    nutrition: {
      ...current.nutrition,
      calories: Number(form.calories.value) || 0,
      carbohydrates: Number(form.carbohydrates.value) || 0,
      protein: Number(form.protein.value) || 0,
      fat: Number(form.fat.value) || 0,
      fiber: Number(form.fiber.value) || 0,
      sugar: Number(form.sugar.value) || 0,
    },
  });
  closeEntryEditor();
});

elements.dropZone.addEventListener("click", () => elements.photoInput.click());
elements.dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.photoInput.click();
  }
});
elements.photoInput.addEventListener("change", () => handlePhoto(elements.photoInput.files[0]));

["dragenter", "dragover"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.dataset.dragging = "true";
  });
});

["dragleave", "drop"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.dataset.dragging = "false";
  });
});

elements.dropZone.addEventListener("drop", (event) => {
  handlePhoto(event.dataTransfer.files[0]);
});

window.addEventListener("popstate", () => {
  const dateFromUrl = getUrlDate();
  if (!dateFromUrl || dateFromUrl === state.selectedDate) return;
  state = { ...state, selectedDate: dateFromUrl };
  saveState();
  render();
});

updateDateUrl(state.selectedDate, "replace");
render();
