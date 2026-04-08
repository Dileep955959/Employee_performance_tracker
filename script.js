const USERS_STORAGE_KEY = "pulseboard-users";
const SESSION_STORAGE_KEY = "pulseboard-session";
const EMPLOYEE_STORAGE_PREFIX = "pulseboard-employees";
const HISTORY_MONTHS = 6;

const routeMeta = {
  "/overview": { title: "Overview", eyebrow: "Workspace" },
  "/employees": { title: "Employees", eyebrow: "Team records" },
  "/analytics": { title: "Analytics", eyebrow: "Performance charts" },
  "/reports": { title: "Reports", eyebrow: "Manager exports" },
};

const sampleEmployees = [
  {
    id: crypto.randomUUID(),
    name: "Aarav Mehta",
    team: "Product",
    role: "Product Analyst",
    tasksCompleted: 82,
    qualityScore: 91,
    attendance: 97,
    initiative: 88,
    notes: "Brings structure to cross-team launches and consistently closes follow-ups.",
  },
  {
    id: crypto.randomUUID(),
    name: "Nisha Verma",
    team: "Support",
    role: "Support Lead",
    tasksCompleted: 74,
    qualityScore: 87,
    attendance: 93,
    initiative: 81,
    notes: "Excellent customer empathy and strong handoff discipline across shifts.",
  },
  {
    id: crypto.randomUUID(),
    name: "Kabir Singh",
    team: "Operations",
    role: "Coordinator",
    tasksCompleted: 51,
    qualityScore: 69,
    attendance: 79,
    initiative: 62,
    notes: "Needs coaching on consistency and proactive follow-through during busy weeks.",
  },
];

const authShell = document.getElementById("authShell");
const appShell = document.getElementById("appShell");
const authForm = document.getElementById("authForm");
const authIntro = document.getElementById("authIntro");
const authMessage = document.getElementById("authMessage");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const nameField = document.getElementById("nameField");
const showLoginButton = document.getElementById("showLogin");
const showSignupButton = document.getElementById("showSignup");

const logoutButton = document.getElementById("logoutButton");
const sidebarUser = document.getElementById("sidebarUser");
const pageEyebrow = document.getElementById("pageEyebrow");
const pageTitle = document.getElementById("pageTitle");
const welcomeText = document.getElementById("welcomeText");
const overviewTopList = document.getElementById("overviewTopList");
const reportPreview = document.getElementById("reportPreview");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));

const employeeForm = document.getElementById("employeeForm");
const employeeIdField = document.getElementById("employeeId");
const employeeList = document.getElementById("employeeList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const resetDataButton = document.getElementById("resetData");
const exportCsvButton = document.getElementById("exportCsv");
const exportPdfButton = document.getElementById("exportPdf");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEdit");
const monthlyTrendChart = document.getElementById("monthlyTrendChart");
const departmentChart = document.getElementById("departmentChart");
const rankingChart = document.getElementById("rankingChart");
const template = document.getElementById("employeeCardTemplate");

const routeViews = {
  "/overview": document.getElementById("routeOverview"),
  "/employees": document.getElementById("routeEmployees"),
  "/analytics": document.getElementById("routeAnalytics"),
  "/reports": document.getElementById("routeReports"),
};

const fieldMap = {
  name: document.getElementById("name"),
  team: document.getElementById("team"),
  role: document.getElementById("role"),
  tasksCompleted: document.getElementById("tasksCompleted"),
  qualityScore: document.getElementById("qualityScore"),
  attendance: document.getElementById("attendance"),
  initiative: document.getElementById("initiative"),
  notes: document.getElementById("notes"),
};

const metrics = {
  avgScore: document.getElementById("avgScore"),
  topPerformer: document.getElementById("topPerformer"),
  activeFocus: document.getElementById("activeFocus"),
  highPerformers: document.getElementById("highPerformers"),
  needsAttention: document.getElementById("needsAttention"),
  bestAttendance: document.getElementById("bestAttendance"),
};

let authMode = "login";
let currentUser = loadCurrentUser();
let employees = currentUser ? loadEmployeesForUser(currentUser.id) : [];

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function loadCurrentUser() {
  const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    return null;
  }

  return loadUsers().find((user) => user.id === sessionId) || null;
}

function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem(SESSION_STORAGE_KEY, user.id);
    employees = loadEmployeesForUser(user.id);
    return;
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
  employees = [];
}

function getEmployeeStorageKey(userId) {
  return `${EMPLOYEE_STORAGE_PREFIX}:${userId}`;
}

function loadEmployeesForUser(userId) {
  const raw = localStorage.getItem(getEmployeeStorageKey(userId));
  if (!raw) {
    const seededEmployees = seedEmployees(sampleEmployees);
    localStorage.setItem(getEmployeeStorageKey(userId), JSON.stringify(seededEmployees));
    return seededEmployees;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map(normalizeEmployee);
    }
  } catch {
    // Fall through to reseed with a safe default set.
  }

  const seededEmployees = seedEmployees(sampleEmployees);
  localStorage.setItem(getEmployeeStorageKey(userId), JSON.stringify(seededEmployees));
  return seededEmployees;
}

function saveEmployees() {
  if (currentUser) {
    localStorage.setItem(getEmployeeStorageKey(currentUser.id), JSON.stringify(employees));
  }
}

function seedEmployees(baseEmployees) {
  return baseEmployees.map((employee) => normalizeEmployee({ ...employee, id: crypto.randomUUID() }));
}

function calculateScore(employee) {
  const taskWeight = Math.min(employee.tasksCompleted, 100) * 0.28;
  const qualityWeight = employee.qualityScore * 0.32;
  const attendanceWeight = employee.attendance * 0.2;
  const initiativeWeight = employee.initiative * 0.2;
  return Math.round(taskWeight + qualityWeight + attendanceWeight + initiativeWeight);
}

function getStatus(score) {
  if (score >= 85) {
    return { label: "Excellent", key: "excellent", color: "rgba(15, 118, 110, 0.14)", text: "#0f766e" };
  }
  if (score >= 70) {
    return { label: "Solid", key: "solid", color: "rgba(212, 167, 44, 0.18)", text: "#9a6d00" };
  }
  return { label: "Needs attention", key: "watch", color: "rgba(194, 65, 12, 0.14)", text: "#c2410c" };
}

function getMonthKeys() {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const months = [];
  const today = new Date();

  for (let offset = HISTORY_MONTHS - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: formatter.format(date),
    });
  }

  return months;
}

function createHistoryForScore(score) {
  const months = getMonthKeys();
  const startScore = Math.max(45, score - 10);

  return months.map((month, index) => {
    const swing = ((index % 2) * 2 - 1) * 2;
    const value = Math.max(40, Math.min(98, startScore + index * 2 + swing));
    return { month: month.key, score: value };
  });
}

function syncHistory(history, currentScore) {
  const months = getMonthKeys();
  const baseHistory = Array.isArray(history) && history.length ? history : createHistoryForScore(currentScore);
  const byMonth = new Map(baseHistory.map((entry) => [entry.month, Number(entry.score) || currentScore]));
  const synced = months.map((month, index) => {
    const existingScore = byMonth.get(month.key);
    if (existingScore) {
      return { month: month.key, score: Math.round(existingScore) };
    }

    const previous = index > 0 ? months[index - 1] : null;
    const previousScore = previous ? byMonth.get(previous.key) : currentScore - 2;
    const fallbackScore = typeof previousScore === "number" ? previousScore : currentScore - 2;
    return {
      month: month.key,
      score: Math.max(40, Math.min(98, Math.round(fallbackScore + 2))),
    };
  });

  synced[synced.length - 1].score = currentScore;
  return synced;
}

function normalizeEmployee(employee) {
  const normalized = {
    id: employee.id || crypto.randomUUID(),
    name: employee.name || "",
    team: employee.team || "Unassigned",
    role: employee.role || "Employee",
    tasksCompleted: Number(employee.tasksCompleted) || 0,
    qualityScore: Number(employee.qualityScore) || 0,
    attendance: Number(employee.attendance) || 0,
    initiative: Number(employee.initiative) || 0,
    notes: employee.notes || "",
  };

  normalized.history = syncHistory(employee.history, calculateScore(normalized));
  return normalized;
}

function getSortedEmployees() {
  return [...employees].sort((a, b) => calculateScore(b) - calculateScore(a));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";
  showLoginButton.classList.toggle("active", !isSignup);
  showSignupButton.classList.toggle("active", isSignup);
  nameField.classList.toggle("hidden", !isSignup);
  authSubmit.textContent = isSignup ? "Create account" : "Login";
  authIntro.textContent = isSignup
    ? "Create a local account for this browser and open your protected dashboard."
    : "Use your account to open the protected dashboard.";
  authMessage.textContent = "";
  authMessage.className = "auth-message";
  authName.required = isSignup;
}

function setAuthMessage(message, type) {
  authMessage.textContent = message;
  authMessage.className = `auth-message ${type}`;
}

function getHashRoute() {
  const raw = window.location.hash.replace(/^#/, "") || "";
  if (!raw) {
    return currentUser ? "/overview" : "/login";
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function navigate(route) {
  const target = `#${route}`;
  if (window.location.hash === target) {
    handleRouteChange();
    return;
  }
  window.location.hash = target;
}

function handleRouteChange() {
  const requestedRoute = getHashRoute();
  const publicRoutes = ["/login", "/signup"];
  const privateRoutes = Object.keys(routeMeta);

  if (!currentUser) {
    const authRoute = publicRoutes.includes(requestedRoute) ? requestedRoute : "/login";
    if (`#${authRoute}` !== window.location.hash) {
      window.location.hash = `#${authRoute}`;
      return;
    }
    showAuthApp(authRoute);
    return;
  }

  const appRoute = privateRoutes.includes(requestedRoute) ? requestedRoute : "/overview";
  if (`#${appRoute}` !== window.location.hash) {
    window.location.hash = `#${appRoute}`;
    return;
  }
  showDashboard(appRoute);
}

function showAuthApp(route) {
  authShell.classList.remove("hidden");
  appShell.classList.add("hidden");
  setAuthMode(route === "/signup" ? "signup" : "login");
}

function showDashboard(route) {
  authShell.classList.add("hidden");
  appShell.classList.remove("hidden");

  Object.entries(routeViews).forEach(([key, view]) => {
    view.classList.toggle("hidden", key !== route);
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.route === route);
  });

  const meta = routeMeta[route];
  pageEyebrow.textContent = meta.eyebrow;
  pageTitle.textContent = meta.title;
  sidebarUser.textContent = currentUser ? currentUser.name : "-";
  welcomeText.textContent = currentUser ? `Welcome back, ${currentUser.name}` : "";
  renderAppData();
}

function registerUser(name, email, password) {
  const users = loadUsers();
  const normalizedEmail = email.toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    setAuthMessage("An account with this email already exists.", "error");
    return;
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email: normalizedEmail,
    password,
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);
  resetFormState();
  navigate("/overview");
}

function loginUser(email, password) {
  const normalizedEmail = email.toLowerCase();
  const user = loadUsers().find((entry) => entry.email === normalizedEmail && entry.password === password);
  if (!user) {
    setAuthMessage("Email or password is incorrect.", "error");
    return;
  }

  setCurrentUser(user);
  resetFormState();
  navigate("/overview");
}

function logoutUser() {
  setCurrentUser(null);
  authForm.reset();
  setAuthMode("login");
  navigate("/login");
}

function renderAppData() {
  const sortedEmployees = getSortedEmployees();
  updateInsights(sortedEmployees);
  renderOverviewList(sortedEmployees);
  renderEmployeeList(sortedEmployees);
  renderCharts(sortedEmployees);
  renderReportPreview(sortedEmployees);
}

function updateInsights(sortedEmployees) {
  const scores = sortedEmployees.map(calculateScore);
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const best = sortedEmployees[0];
  const bestAttendance = [...sortedEmployees].sort((a, b) => b.attendance - a.attendance)[0];

  metrics.avgScore.textContent = average;
  metrics.topPerformer.textContent = best ? best.name.split(" ")[0] : "-";
  metrics.activeFocus.textContent = sortedEmployees.length;
  metrics.highPerformers.textContent = sortedEmployees.filter((employee) => calculateScore(employee) >= 85).length;
  metrics.needsAttention.textContent = sortedEmployees.filter((employee) => calculateScore(employee) < 70).length;
  metrics.bestAttendance.textContent = bestAttendance ? `${bestAttendance.name.split(" ")[0]} (${bestAttendance.attendance}%)` : "-";
}

function renderOverviewList(sortedEmployees) {
  overviewTopList.innerHTML = "";
  if (!sortedEmployees.length) {
    overviewTopList.innerHTML = '<div class="empty-state">Add employees to see your top performers here.</div>';
    return;
  }

  sortedEmployees.slice(0, 4).forEach((employee, index) => {
    const score = calculateScore(employee);
    const row = document.createElement("div");
    row.className = "summary-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(`${index + 1}. ${employee.name}`)}</strong>
        <span class="section-note">${escapeHtml(`${employee.role} - ${employee.team}`)}</span>
      </div>
      <div>
        <strong>${score}/100</strong>
        <span class="section-note">${escapeHtml(getStatus(score).label)}</span>
      </div>
    `;
    overviewTopList.appendChild(row);
  });
}

function renderEmployeeList(sortedEmployees) {
  const query = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;
  const visibleEmployees = sortedEmployees.filter((employee) => {
    const score = calculateScore(employee);
    const status = getStatus(score);
    const haystack = `${employee.name} ${employee.team} ${employee.role}`.toLowerCase();
    return haystack.includes(query) && (filter === "all" || status.key === filter);
  });

  employeeList.innerHTML = "";
  if (!visibleEmployees.length) {
    employeeList.innerHTML = '<div class="empty-state">No employees match the current search or filter.</div>';
    return;
  }

  visibleEmployees.forEach((employee) => {
    const score = calculateScore(employee);
    const status = getStatus(score);
    const card = template.content.firstElementChild.cloneNode(true);

    card.querySelector(".employee-name").textContent = employee.name;
    card.querySelector(".employee-meta").textContent = `${employee.role} - ${employee.team}`;
    card.querySelector(".score-pill").textContent = status.label;
    card.querySelector(".score-pill").style.background = status.color;
    card.querySelector(".score-pill").style.color = status.text;
    card.querySelector(".score-value").textContent = `${score}/100`;
    card.querySelector(".progress-fill").style.width = `${score}%`;
    card.querySelector(".employee-notes").textContent = employee.notes || "No manager notes yet.";

    const metricWrap = card.querySelector(".mini-metrics");
    [
      `Tasks: ${employee.tasksCompleted}`,
      `Quality: ${employee.qualityScore}`,
      `Attendance: ${employee.attendance}%`,
      `Initiative: ${employee.initiative}`,
    ].forEach((metricText) => {
      const metric = document.createElement("span");
      metric.className = "metric";
      metric.textContent = metricText;
      metricWrap.appendChild(metric);
    });

    card.querySelector(".edit-btn").addEventListener("click", () => startEditEmployee(employee.id));
    card.querySelector(".delete-btn").addEventListener("click", () => {
      employees = employees.filter((entry) => entry.id !== employee.id);
      saveEmployees();
      if (employeeIdField.value === employee.id) {
        resetFormState();
      }
      renderAppData();
    });

    employeeList.appendChild(card);
  });
}
function renderCharts(sortedEmployees) {
  renderMonthlyTrend(sortedEmployees);
  renderDepartmentComparison(sortedEmployees);
  renderRankingChart(sortedEmployees);
}

function renderMonthlyTrend(sortedEmployees) {
  const months = getMonthKeys();
  monthlyTrendChart.innerHTML = "";

  if (!sortedEmployees.length) {
    monthlyTrendChart.innerHTML = '<div class="empty-state">Add employees to generate chart data.</div>';
    return;
  }

  const averages = months.map((month) => {
    const monthScores = sortedEmployees
      .map((employee) => employee.history.find((entry) => entry.month === month.key))
      .filter(Boolean)
      .map((entry) => entry.score);
    const average = monthScores.reduce((sum, score) => sum + score, 0) / monthScores.length;
    return { label: month.label, score: Math.round(average) };
  });

  averages.forEach((entry) => {
    const column = document.createElement("div");
    column.className = "trend-col";
    column.innerHTML = `
      <div class="trend-score">${entry.score}</div>
      <div class="trend-bar-wrap">
        <div class="trend-bar" style="height: ${Math.max(entry.score, 16)}%"></div>
      </div>
      <div class="trend-label">${entry.label}</div>
    `;
    monthlyTrendChart.appendChild(column);
  });
}

function renderDepartmentComparison(sortedEmployees) {
  departmentChart.innerHTML = "";

  if (!sortedEmployees.length) {
    departmentChart.innerHTML = '<div class="empty-state">Department comparison will appear here.</div>';
    return;
  }

  const departmentMap = new Map();
  sortedEmployees.forEach((employee) => {
    const team = employee.team || "Unassigned";
    const bucket = departmentMap.get(team) || [];
    bucket.push(calculateScore(employee));
    departmentMap.set(team, bucket);
  });

  [...departmentMap.entries()]
    .map(([team, scores]) => ({
      team,
      average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    }))
    .sort((a, b) => b.average - a.average)
    .forEach((entry) => {
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <div class="bar-label">${escapeHtml(entry.team)}</div>
        <div class="bar-track"><div class="bar-fill" style="width: ${entry.average}%"></div></div>
        <div class="trend-score">${entry.average}</div>
      `;
      departmentChart.appendChild(row);
    });
}

function renderRankingChart(sortedEmployees) {
  rankingChart.innerHTML = "";

  if (!sortedEmployees.length) {
    rankingChart.innerHTML = '<div class="empty-state">Top and bottom performers will appear here.</div>';
    return;
  }

  const ranked = sortedEmployees.map((employee) => ({ ...employee, score: calculateScore(employee) }));
  const topPerformers = ranked.slice(0, 3);
  const bottomPerformers = [...ranked].slice(-3).reverse();

  const topMarkup = topPerformers.map((employee) => `
    <div class="rank-item">
      <div>
        <div class="rank-label">${escapeHtml(employee.name)}</div>
        <div class="rank-track"><div class="rank-fill top" style="width: ${employee.score}%"></div></div>
      </div>
      <div class="trend-score">${employee.score}</div>
    </div>
  `).join("");

  const bottomMarkup = bottomPerformers.map((employee) => `
    <div class="rank-item">
      <div>
        <div class="rank-label">${escapeHtml(employee.name)}</div>
        <div class="rank-track"><div class="rank-fill bottom" style="width: ${employee.score}%"></div></div>
      </div>
      <div class="trend-score">${employee.score}</div>
    </div>
  `).join("");

  rankingChart.innerHTML = `
    <div class="rank-row">
      <div class="rank-group">
        <h4>Top performers</h4>
        ${topMarkup}
      </div>
      <div class="rank-group">
        <h4>Needs support</h4>
        ${bottomMarkup}
      </div>
    </div>
  `;
}

function renderReportPreview(sortedEmployees) {
  reportPreview.innerHTML = "";

  if (!sortedEmployees.length) {
    reportPreview.innerHTML = '<div class="empty-state">Add employees to build a report preview.</div>';
    return;
  }

  sortedEmployees.slice(0, 5).forEach((employee) => {
    const score = calculateScore(employee);
    const row = document.createElement("div");
    row.className = "report-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(employee.name)}</strong>
        <div class="section-note">${escapeHtml(`${employee.team} - ${employee.role}`)}</div>
      </div>
      <div>${escapeHtml(getStatus(score).label)}</div>
      <div><strong>${score}</strong></div>
    `;
    reportPreview.appendChild(row);
  });
}

function startEditEmployee(employeeId) {
  const employee = employees.find((entry) => entry.id === employeeId);
  if (!employee) {
    return;
  }

  if (getHashRoute() !== "/employees") {
    navigate("/employees");
  }

  employeeIdField.value = employee.id;
  fieldMap.name.value = employee.name;
  fieldMap.team.value = employee.team;
  fieldMap.role.value = employee.role;
  fieldMap.tasksCompleted.value = employee.tasksCompleted;
  fieldMap.qualityScore.value = employee.qualityScore;
  fieldMap.attendance.value = employee.attendance;
  fieldMap.initiative.value = employee.initiative;
  fieldMap.notes.value = employee.notes;
  submitButton.textContent = "Update employee";
  cancelEditButton.classList.remove("hidden");
  employeeForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetFormState() {
  employeeIdField.value = "";
  employeeForm.reset();
  fieldMap.tasksCompleted.value = 70;
  fieldMap.qualityScore.value = 85;
  fieldMap.attendance.value = 95;
  fieldMap.initiative.value = 78;
  submitButton.textContent = "Save employee";
  cancelEditButton.classList.add("hidden");
}

function getExistingHistory(employeeId) {
  if (!employeeId) {
    return null;
  }

  const currentEmployee = employees.find((entry) => entry.id === employeeId);
  return currentEmployee ? currentEmployee.history : null;
}

function buildEmployeeFromForm() {
  return normalizeEmployee({
    id: employeeIdField.value || crypto.randomUUID(),
    name: fieldMap.name.value.trim(),
    team: fieldMap.team.value.trim(),
    role: fieldMap.role.value.trim(),
    tasksCompleted: Number(fieldMap.tasksCompleted.value),
    qualityScore: Number(fieldMap.qualityScore.value),
    attendance: Number(fieldMap.attendance.value),
    initiative: Number(fieldMap.initiative.value),
    notes: fieldMap.notes.value.trim(),
    history: getExistingHistory(employeeIdField.value),
  });
}

function exportCsv() {
  const rows = [
    ["Name", "Team", "Role", "Tasks Completed", "Quality Score", "Attendance", "Initiative", "Performance Score", "Status", "Manager Notes"],
    ...getSortedEmployees().map((employee) => {
      const score = calculateScore(employee);
      return [
        employee.name,
        employee.team,
        employee.role,
        employee.tasksCompleted,
        employee.qualityScore,
        employee.attendance,
        employee.initiative,
        score,
        getStatus(score).label,
        employee.notes.replace(/\"/g, '""'),
      ];
    }),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell)}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "employee-performance-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}
function exportPdfReport() {
  const sortedEmployees = getSortedEmployees();
  const averageScore = sortedEmployees.length
    ? Math.round(sortedEmployees.reduce((sum, employee) => sum + calculateScore(employee), 0) / sortedEmployees.length)
    : 0;
  const today = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
  const reportRows = sortedEmployees.map((employee) => {
    const score = calculateScore(employee);
    return `
      <tr>
        <td>${escapeHtml(employee.name)}</td>
        <td>${escapeHtml(employee.team)}</td>
        <td>${escapeHtml(employee.role)}</td>
        <td>${score}</td>
        <td>${escapeHtml(getStatus(score).label)}</td>
        <td>${escapeHtml(employee.notes || "-")}</td>
      </tr>
    `;
  }).join("");

  const printWindow = window.open("", "_blank", "width=1200,height=900");
  if (!printWindow) {
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Employee Performance Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #1f2230; }
        h1 { margin-bottom: 8px; }
        .meta { color: #555; margin-bottom: 24px; }
        .stats { display: flex; gap: 16px; margin-bottom: 28px; }
        .stat { padding: 16px; border: 1px solid #ddd; border-radius: 12px; min-width: 180px; }
        .stat strong { display: block; font-size: 28px; margin-top: 6px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: top; }
        th { background: #f5efe8; }
      </style>
    </head>
    <body>
      <h1>Employee Performance Report</h1>
      <div class="meta">Generated on ${today}</div>
      <div class="stats">
        <div class="stat">Employees tracked<strong>${sortedEmployees.length}</strong></div>
        <div class="stat">Average score<strong>${averageScore}</strong></div>
        <div class="stat">Top performer<strong>${escapeHtml(sortedEmployees[0] ? sortedEmployees[0].name : "-")}</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Team</th>
            <th>Role</th>
            <th>Score</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${reportRows}</tbody>
      </table>
      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 250);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value.trim();

  if (authMode === "signup") {
    const name = authName.value.trim();
    if (!name || !email || !password) {
      setAuthMessage("Please complete all fields to create an account.", "error");
      return;
    }
    registerUser(name, email, password);
    return;
  }

  if (!email || !password) {
    setAuthMessage("Enter both email and password to continue.", "error");
    return;
  }
  loginUser(email, password);
});

showLoginButton.addEventListener("click", () => navigate("/login"));
showSignupButton.addEventListener("click", () => navigate("/signup"));
logoutButton.addEventListener("click", logoutUser);

employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const employee = buildEmployeeFromForm();
  const existingIndex = employees.findIndex((entry) => entry.id === employee.id);
  if (existingIndex >= 0) {
    employees[existingIndex] = employee;
  } else {
    employees = [employee, ...employees];
  }

  saveEmployees();
  resetFormState();
  renderAppData();
});

cancelEditButton.addEventListener("click", resetFormState);
searchInput.addEventListener("input", () => renderEmployeeList(getSortedEmployees()));
statusFilter.addEventListener("change", () => renderEmployeeList(getSortedEmployees()));
resetDataButton.addEventListener("click", () => {
  employees = seedEmployees(sampleEmployees);
  saveEmployees();
  resetFormState();
  renderAppData();
});
exportCsvButton.addEventListener("click", exportCsv);
exportPdfButton.addEventListener("click", exportPdfReport);
window.addEventListener("hashchange", handleRouteChange);

resetFormState();
handleRouteChange();
