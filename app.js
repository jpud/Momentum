const store = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

let username = store.get("username", "");
let habits = store.get("habits", []);
let lockUntil = store.get("lockUntil", 0);
let index = store.get("index", 0);
// NEW: momentum streak state
let momentumStreak = store.get("momentumStreak", 0);

const buildSection = document.getElementById("buildSection");
const focusSection = document.getElementById("focusSection");
const habitList = document.getElementById("habitList");
const habitInput = document.getElementById("habitInput");
const addBtn = document.getElementById("addBtn");
const focusBtn = document.getElementById("focusBtn");
const lockHint = document.getElementById("lockHint");
const currentHabit = document.getElementById("currentHabit");
const completeBtn = document.getElementById("completeBtn");
const progressDots = document.getElementById("progressDots");
const doneAll = document.getElementById("doneAll");
const lockBadge = document.getElementById("lockBadge");
const userDisplay = document.getElementById("userDisplay");

const intro = document.getElementById("intro");
const usernameInput = document.getElementById("usernameInput");
const startIntro = document.getElementById("startIntro");

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");
const usernameEdit = document.getElementById("usernameEdit");
const saveUsername = document.getElementById("saveUsername");
const resetFocus = document.getElementById("resetFocus");

// NEW: streak value element
const streakValue = document.querySelector(".streak-value");

const AVAILABLE_APPS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitter",
  "Discord",
  "Reddit",
  "Snapchat",
  "Twitch",
  "Facebook",
  "Pinterest",
];
const appsState = {
  selected: JSON.parse(localStorage.getItem("lockedApps") || "[]"),
};
const appsTrigger = document.getElementById("appsTrigger");
const appsPanel = document.getElementById("appsPanel");
const appsClose = document.getElementById("appsClose");
const appsList = document.getElementById("appsList");
const appsSave = document.getElementById("appsSave");
const appsSummary = document.getElementById("appsSummary");
const lockedAppsBadge = document.getElementById("lockedAppsBadge");

function save() {
  store.set("username", username);
  store.set("habits", habits);
  store.set("lockUntil", lockUntil);
  store.set("index", index);
  // NEW: persist streak
  store.set("momentumStreak", momentumStreak);
}

function now() {
  return Date.now();
}
function locked() {
  return now() < Number(lockUntil || 0);
}

function resetIfUnlocked() {
  if (!locked() && lockUntil) {
    for (let i = 0; i < habits.length; i++) habits[i].done = false;
    lockUntil = 0;
    index = 0;
    save();
  }
}

// NEW: update streak display
function updateStreakUI() {
  if (!streakValue) return;
  if (momentumStreak > 0) {
    streakValue.textContent = String(momentumStreak);
  } else {
    streakValue.textContent = "—";
  }
}

function renderBuild() {
  userDisplay.textContent = username ? `@${username}` : "";
  habitList.innerHTML = "";
  for (let i = 0; i < habits.length; i++) {
    const li = document.createElement("li");
    li.className = "item";
    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = habits[i].title;
    const ctrls = document.createElement("div");
    ctrls.className = "item-ctrls";

    const up = document.createElement("button");
    up.className = "small";
    up.textContent = "↑";
    const down = document.createElement("button");
    down.className = "small";
    down.textContent = "↓";
    const del = document.createElement("button");
    del.className = "small";
    del.textContent = "×";

    up.onclick = () => {
      if (i > 0) {
        [habits[i - 1], habits[i]] = [habits[i], habits[i - 1]];
        save();
        renderBuild();
      }
    };
    down.onclick = () => {
      if (i < habits.length - 1) {
        [habits[i + 1], habits[i]] = [habits[i], habits[i + 1]];
        save();
        renderBuild();
      }
    };
    del.onclick = () => {
      habits.splice(i, 1);
      save();
      renderBuild();
    };

    ctrls.append(up, down, del);
    li.append(title, ctrls);
    habitList.append(li);
  }

  if (locked()) {
    const remaining = Number(lockUntil) - now();
    const hrs = Math.max(0, Math.floor(remaining / 3600000));
    const mins = Math.max(0, Math.floor((remaining % 3600000) / 60000));
    lockHint.textContent = `locked for ${hrs}h ${mins}m`;
    focusBtn.disabled = true;
    habitInput.disabled = true;
    addBtn.disabled = true;
    appsTrigger.disabled = true;
  } else {
    lockHint.textContent = "";
    focusBtn.disabled = habits.length === 0;
    habitInput.disabled = false;
    addBtn.disabled = false;
    appsTrigger.disabled = false;
  }
}

function renderFocus() {
  progressDots.innerHTML = "";
  for (let i = 0; i < habits.length; i++) {
    const d = document.createElement("div");
    d.className = "dot" + (i < index ? " done" : i === index ? " on" : "");
    progressDots.append(d);
  }

  if (index >= habits.length) {
    currentHabit.textContent = "";
    completeBtn.classList.add("hidden");
    doneAll.classList.remove("hidden");
  } else {
    currentHabit.textContent = habits[index].title;
    completeBtn.classList.remove("hidden");
    doneAll.classList.add("hidden");
  }

  if (locked()) {
    const remaining = Number(lockUntil) - now();
    const hrs = Math.max(0, Math.floor(remaining / 3600000));
    const mins = Math.max(0, Math.floor((remaining % 3600000) / 60000));
    lockBadge.textContent = `focus lock: ${hrs}h ${mins}m`;
  } else {
    lockBadge.textContent = "";
  }
}

function showBuild() {
  resetIfUnlocked();
  buildSection.classList.remove("hidden");
  focusSection.classList.add("hidden");
  lockedAppsBadge.textContent = "";
  lockedAppsBadge.classList.remove("show");
  renderBuild();
}

function showFocus() {
  buildSection.classList.add("hidden");
  focusSection.classList.remove("hidden");
  showLockedAppsInFocus();
  renderFocus();
}

function startFocus() {
  if (habits.length === 0 || locked()) return;
  lockUntil = now() + 12 * 60 * 60 * 1000;
  index = 0;
  save();
  showFocus();
}

function addHabit() {
  const t = (habitInput.value || "").trim();
  if (!t) return;
  habits.push({ title: t, done: false });
  habitInput.value = "";
  save();
  renderBuild();
}

function nextHabit() {
  if (!locked()) return;
  if (index >= habits.length) return;
  habits[index].done = true;
  index += 1;
  save();
  renderFocus();
}

addBtn.onclick = addHabit;
habitInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addHabit();
});
focusBtn.onclick = startFocus;
completeBtn.onclick = nextHabit;

settingsBtn.onclick = () => {
  usernameEdit.value = username || "";
  settingsPanel.classList.remove("hidden");
};
closeSettings.onclick = () => settingsPanel.classList.add("hidden");
saveUsername.onclick = () => {
  const v = (usernameEdit.value || "").trim();
  if (!v) return;
  username = v;
  save();
  userDisplay.textContent = `@${username}`;
  settingsPanel.classList.add("hidden");
};

// UPDATED: reset focus also increments momentum streak
resetFocus.onclick = () => {
  lockUntil = 0;
  for (let i = 0; i < habits.length; i++) habits[i].done = false;
  index = 0;

  // increment streak for MVP
  momentumStreak += 1;
  save();
  updateStreakUI();

  settingsPanel.classList.add("hidden");
  showBuild();
};

function boot() {
  // always reflect current streak on load
  updateStreakUI();

  const firstRun = !username;
  if (firstRun) {
    intro.classList.remove("hidden");
  } else {
    userDisplay.textContent = `@${username}`;
    if (locked()) showFocus();
    else showBuild();
  }
}

startIntro.onclick = () => {
  const v = (usernameInput.value || "").trim();
  if (!v) return;
  username = v;
  save();
  intro.classList.add("hidden");
  showBuild();
};

function renderAppsList() {
  appsList.innerHTML = AVAILABLE_APPS.map((name) => {
    const checked = appsState.selected.includes(name) ? "checked" : "";
    return `
        <li>
          <input type="checkbox" value="${name}" ${checked} id="lock-${name}">
          <label for="lock-${name}">${name}</label>
        </li>
      `;
  }).join("");
}

function updateAppsSummary() {
  if (!appsState.selected.length) {
    appsSummary.textContent = "No apps selected for lock.";
  } else {
    appsSummary.textContent = `Locked: ${appsState.selected.join(", ")}`;
  }
}

function openAppsPanel() {
  renderAppsList();
  appsPanel.setAttribute("aria-hidden", "false");
}

function closeAppsPanel() {
  appsPanel.setAttribute("aria-hidden", "true");
}

function collectSelectedApps() {
  const boxes = appsList.querySelectorAll('input[type="checkbox"]');
  appsState.selected = Array.from(boxes)
    .filter((b) => b.checked)
    .map((b) => b.value);
  localStorage.setItem("lockedApps", JSON.stringify(appsState.selected));
  updateAppsSummary();
}

function showLockedAppsInFocus() {
  const saved = JSON.parse(localStorage.getItem("lockedApps") || "[]");
  if (saved.length) {
    lockedAppsBadge.textContent = `Locked: ${saved.join(", ")}`;
    lockedAppsBadge.classList.add("show");
  } else {
    lockedAppsBadge.textContent = "";
    lockedAppsBadge.classList.remove("show");
  }
}

appsTrigger?.addEventListener("click", () => {
  const open = appsPanel.getAttribute("aria-hidden") === "false";
  open ? closeAppsPanel() : openAppsPanel();
});
appsClose?.addEventListener("click", closeAppsPanel);
appsSave?.addEventListener("click", () => {
  collectSelectedApps();
  closeAppsPanel();
});

updateAppsSummary();
boot();

setInterval(() => {
  if (locked()) {
    if (focusSection.classList.contains("hidden")) renderBuild();
    else renderFocus();
  } else if (lockUntil) {
    resetIfUnlocked();
    showBuild();
  }
}, 30000);
