import { createFirestoreRepository } from "../storage/firestoreRepository.js";
import {
  EVENT_TYPES,
  GRADE_AREAS,
  GRADE_TYPES,
  PROJECT_STATUS,
  SCORE_KINDS,
  addEvent,
  addGradeEntry,
  addLearningActivity,
  addProject,
  addSchoolYear,
  addSubject,
  calculateRequiredNextGrade,
  calculateSchoolYearAverage,
  calculateSubjectGrade,
  calculateSubjectStats,
  createEmptyAcademicOSData,
  exportData,
  formatCountdown,
  getEventsForSchoolYear,
  getProjectsForSchoolYear,
  getSubjectsForSchoolYear,
  getUpcomingEvents,
  getUpcomingProjects,
  getWeakestSubjects,
  getWeakestTopics,
  importData,
  normalizeScoreToGrade,
  removeSubject,
  setCurrentSchoolYear,
  updateUserProfile
} from "../index.js";
import { icon } from "./icons.js";

const app = document.querySelector("#app");
const repository = createFirestoreRepository();

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "subjects", label: "Fächer", icon: "book" },
  { id: "add", label: "Hinzufügen", icon: "plus" },
  { id: "events", label: "Termine", icon: "calendar" },
  { id: "analysis", label: "Analyse", icon: "chart" }
];

const typeLabels = {
  [GRADE_TYPES.EXAM]: "Klausur",
  [GRADE_TYPES.TEST]: "Test",
  [GRADE_TYPES.PRESENTATION]: "Präsentation",
  [GRADE_TYPES.REPORT]: "Referat",
  [GRADE_TYPES.PROJECT]: "Projekt",
  [GRADE_TYPES.HOMEWORK]: "Hausaufgabe",
  [GRADE_TYPES.PARTICIPATION]: "Mitarbeit",
  [GRADE_TYPES.OTHER]: "Sonstiges"
};

const areaLabels = {
  [GRADE_AREAS.ORAL]: "Mündlich",
  [GRADE_AREAS.WRITTEN]: "Schriftlich"
};

const eventLabels = {
  [EVENT_TYPES.EXAM]: "Klausur",
  [EVENT_TYPES.TEST]: "Test",
  [EVENT_TYPES.PRESENTATION]: "Präsentation",
  [EVENT_TYPES.REPORT]: "Referat",
  [EVENT_TYPES.PROJECT]: "Projekt",
  [EVENT_TYPES.DEADLINE]: "Abgabe",
  [EVENT_TYPES.OTHER]: "Sonstiges"
};

let state = {
  data: createEmptyAcademicOSData(),
  activeTab: "dashboard",
  addMode: "grade",
  subjectSort: "alphabetical",
  analysisSubjectId: null,
  analysisPeriod: "all",
  toast: null
};

// Zeige Ladescreen während Firestore lädt
app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;font-family:sans-serif;">Laden…</div>`;

loadInitialData().then((data) => {
  state.data = data;
  render();
});

async function loadInitialData() {
  try {
    const data = await repository.load();
    if (Object.keys(data.entities.schoolYears).length > 0) return data;
    return createStarterData(data);
  } catch (error) {
    console.error(error);
    return createStarterData(createEmptyAcademicOSData());
  }
}

function createStarterData(baseData) {
  let data = baseData;
  data = addSchoolYear(data, { id: "year_current", name: "9. Klasse" });
  data = addSubject(data, { id: "subject_math", schoolYearId: "year_current", name: "Mathe", color: "#4F8CFF" });
  data = addSubject(data, { id: "subject_german", schoolYearId: "year_current", name: "Deutsch", color: "#24C26A" });
  data = addSubject(data, { id: "subject_chemistry", schoolYearId: "year_current", name: "Chemie", color: "#FFB648" });
  data = addGradeEntry(data, {
    schoolYearId: "year_current",
    subjectId: "subject_math",
    date: "2026-06-01",
    type: GRADE_TYPES.EXAM,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.GRADE_1_TO_6, value: 2 },
    topics: ["Gleichungen", "Prozentrechnung"]
  });
  data = addGradeEntry(data, {
    schoolYearId: "year_current",
    subjectId: "subject_german",
    date: "2026-06-04",
    type: GRADE_TYPES.PARTICIPATION,
    area: GRADE_AREAS.ORAL,
    score: { kind: SCORE_KINDS.GRADE_1_TO_6, value: 3 },
    topics: ["Argumentation"]
  });
  data = addEvent(data, {
    schoolYearId: "year_current",
    subjectId: "subject_math",
    title: "Mathe Klausur",
    date: "2026-06-29",
    category: EVENT_TYPES.EXAM,
    priority: "high"
  });
  repository.save(data);
  return data;
}

function render() {
  const { data } = state;
  const currentYear = getCurrentYear();

  app.innerHTML = `
    <div class="app-shell">
      ${renderTopbar(data, currentYear)}
      <main class="main-view">${renderActiveView(currentYear)}</main>
      ${renderBottomNav()}
      ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
    </div>
  `;

  attachEvents();
}

function renderTopbar(data, currentYear) {
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">A</div>
        <div>
          <h1>AcademicOS</h1>
          <div class="muted">${formatLongDate(new Date())}</div>
        </div>
      </div>
      <div class="top-actions">
        <input class="input" id="user-name" value="${escapeAttribute(data.user.name)}" placeholder="Name" aria-label="Name">
        <select class="select" id="school-year-select" aria-label="Jahrgang">
          ${Object.values(data.entities.schoolYears).map((year) => `
            <option value="${year.id}" ${year.id === currentYear?.id ? "selected" : ""}>${escapeHtml(year.name)}</option>
          `).join("")}
        </select>
        <button class="icon-button" id="export-data" title="Daten exportieren" aria-label="Daten exportieren">${icon("download")}</button>
        <button class="icon-button" id="import-data" title="Daten importieren" aria-label="Daten importieren">${icon("upload")}</button>
        <input class="hidden-file" id="import-file" type="file" accept="application/json">
      </div>
    </header>
  `;
}

function renderActiveView(currentYear) {
  if (!currentYear) return renderNoYear();

  switch (state.activeTab) {
    case "subjects":
      return renderSubjects(currentYear);
    case "add":
      return renderAdd(currentYear);
    case "events":
      return renderEvents(currentYear);
    case "analysis":
      return renderAnalysis(currentYear);
    default:
      return renderDashboard(currentYear);
  }
}

function renderNoYear() {
  return `
    <section class="panel">
      <div class="section-title"><h3>Jahrgang</h3></div>
      <form id="year-form" class="form-grid">
        <label class="field">
          <span class="label">Name</span>
          <input class="input" name="name" required placeholder="9. Klasse">
        </label>
        <div class="field">
          <span class="label">&nbsp;</span>
          <button class="primary-button" type="submit">${icon("plus")} Anlegen</button>
        </div>
      </form>
    </section>
  `;
}

function renderDashboard(year) {
  const average = calculateSchoolYearAverage(state.data, year.id);
  const subjects = getSubjectsForSchoolYear(state.data, year.id);
  const upcomingEvent = getUpcomingEvents(state.data, year.id, new Date(), 1)[0];
  const upcomingProject = getUpcomingProjects(state.data, year.id, new Date(), 1)[0];

  return `
    <section class="view-header">
      <div>
        <h2>Willkommen${state.data.user.name ? `, ${escapeHtml(state.data.user.name)}` : ""}</h2>
        <div class="muted">${escapeHtml(year.name)}</div>
      </div>
      <button class="secondary-button" data-open-add="year">${icon("plus")} Jahrgang</button>
    </section>

    <section class="grid metrics">
      ${metric("Gesamtschnitt", formatGrade(average.average), `${average.subjects.filter((item) => Number.isFinite(item.total)).length} bewertete Fächer`)}
      ${metric("Fächer", subjects.length, "Aktueller Jahrgang")}
      ${metric("Nächste Prüfung", upcomingEvent ? escapeHtml(upcomingEvent.title) : "Keine", upcomingEvent ? formatCountdown(upcomingEvent.date) : "Alles ruhig")}
      ${metric("Nächstes Projekt", upcomingProject ? escapeHtml(upcomingProject.title) : "Keine", upcomingProject ? formatCountdown(upcomingProject.dueDate) : "Keine offene Abgabe")}
    </section>

    <section class="grid two" style="margin-top:16px">
      <div class="panel">
        <div class="section-title"><h3>Handlungsbedarf</h3></div>
        <div class="list">
          ${renderWeaknessList(year)}
        </div>
      </div>
      <div class="panel">
        <div class="section-title">
          <h3>Fachübersicht</h3>
          <select class="select" id="subject-sort" aria-label="Sortierung">
            <option value="alphabetical" ${state.subjectSort === "alphabetical" ? "selected" : ""}>Alphabetisch</option>
            <option value="best" ${state.subjectSort === "best" ? "selected" : ""}>Beste zuerst</option>
            <option value="weakest" ${state.subjectSort === "weakest" ? "selected" : ""}>Schwächste zuerst</option>
          </select>
        </div>
        <div class="list">${renderSubjectRows(year)}</div>
      </div>
    </section>
  `;
}

function metric(label, value, detail) {
  return `
    <div class="metric">
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}</div>
      <div class="metric-detail">${detail}</div>
    </div>
  `;
}

function renderWeaknessList(year) {
  const weakSubjects = getWeakestSubjects(state.data, year.id, 2);
  const weakTopics = getWeakestTopics(state.data, null, 2);
  const upcoming = getUpcomingEvents(state.data, year.id, new Date(), 2);
  const items = [
    ...weakSubjects.map((item) => ({ title: item.name, detail: `Gesamt ${formatGrade(item.grade)}` })),
    ...upcoming.map((item) => ({ title: item.title, detail: formatCountdown(item.date) })),
    ...weakTopics.map((item) => ({ title: item.topic, detail: `Thema ${formatGrade(item.averageGrade)}` }))
  ];

  if (!items.length) return `<div class="empty">Keine kritischen Punkte</div>`;

  return items.slice(0, 5).map((item) => `
    <div class="row">
      <div>
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="subline">${escapeHtml(item.detail)}</div>
      </div>
    </div>
  `).join("");
}

function renderSubjects(year) {
  return `
    <section class="view-header">
      <div>
        <h2>Fächer</h2>
        <div class="muted">${escapeHtml(year.name)}</div>
      </div>
      <button class="primary-button" data-open-add="subject">${icon("plus")} Fach</button>
    </section>
    <section class="panel">
      <div class="list">${renderSubjectRows(year, true)}</div>
    </section>
  `;
}

function renderSubjectRows(year, withActions = false) {
  const subjects = sortSubjects(getSubjectsForSchoolYear(state.data, year.id));

  if (!subjects.length) return `<div class="empty">Noch keine Fächer</div>`;

  return subjects.map((subject) => {
    const result = calculateSubjectGrade(state.data, subject.id);
    return `
      <div class="subject-row">
        <div class="swatch" style="background:${escapeAttribute(subject.color)}"></div>
        <div>
          <div class="title">${escapeHtml(subject.name)}</div>
          <div class="subline">${result.entryCount} Einträge</div>
        </div>
        <div class="grade-pill"><span class="caption">Mündlich</span><strong>${formatGrade(result.oral)}</strong></div>
        <div class="grade-pill"><span class="caption">Schriftlich</span><strong>${formatGrade(result.written)}</strong></div>
        <div class="grade-pill"><span class="caption">Gesamt</span><strong>${formatGrade(result.total)}</strong></div>
        ${withActions ? `<button class="danger-button" data-remove-subject="${subject.id}">${icon("trash")} Löschen</button>` : ""}
      </div>
    `;
  }).join("");
}

function sortSubjects(subjects) {
  return [...subjects].sort((a, b) => {
    if (state.subjectSort === "best") return safeGrade(a.id) - safeGrade(b.id);
    if (state.subjectSort === "weakest") return safeGrade(b.id) - safeGrade(a.id);
    return a.name.localeCompare(b.name, "de");
  });
}

function renderAdd(year) {
  const mode = state.addMode;
  return `
    <section class="view-header">
      <div>
        <h2>Hinzufügen</h2>
        <div class="muted">${escapeHtml(year.name)}</div>
      </div>
    </section>
    <section class="panel">
      <div class="tabs-inline">
        ${["grade", "subject", "event", "project", "learning", "year"].map((item) => `
          <button class="segment ${mode === item ? "active" : ""}" data-add-mode="${item}">${addModeLabel(item)}</button>
        `).join("")}
      </div>
    </section>
    <section style="margin-top:16px">
      ${renderAddForm(year, mode)}
    </section>
  `;
}

function renderAddForm(year, mode) {
  if (mode === "subject") return renderSubjectForm(year);
  if (mode === "event") return renderEventForm(year);
  if (mode === "project") return renderProjectForm(year);
  if (mode === "learning") return renderLearningForm(year);
  if (mode === "year") return renderYearForm();
  return renderGradeForm(year);
}

function renderGradeForm(year) {
  const subjects = getSubjectsForSchoolYear(state.data, year.id);
  return `
    <form id="grade-form" class="panel form-grid">
      ${subjectSelect(subjects)}
      ${selectField("type", "Typ", typeLabels)}
      ${selectField("area", "Bereich", areaLabels)}
      <label class="field">
        <span class="label">Datum</span>
        <input class="input" name="date" type="date" required value="${todayValue()}">
      </label>
      <label class="field">
        <span class="label">Notensystem</span>
        <select class="select" name="scoreKind">
          <option value="${SCORE_KINDS.GRADE_1_TO_6}">1-6</option>
          <option value="${SCORE_KINDS.PERCENT}">Prozent</option>
          <option value="${SCORE_KINDS.POINTS}">Punkte</option>
        </select>
      </label>
      <label class="field">
        <span class="label">Ergebnis</span>
        <input class="input" name="scoreValue" type="number" step="0.1" required placeholder="2">
      </label>
      <label class="field">
        <span class="label">Max. Punkte</span>
        <input class="input" name="scoreMax" type="number" step="0.1" placeholder="20">
      </label>
      <label class="field full">
        <span class="label">Themen</span>
        <input class="input" name="topics" placeholder="Bruchrechnung, Gleichungen">
      </label>
      <label class="field full">
        <span class="label">Notiz</span>
        <textarea class="textarea" name="note"></textarea>
      </label>
      <button class="primary-button" type="submit">${icon("plus")} Speichern</button>
    </form>
  `;
}

function renderSubjectForm(year) {
  return `
    <form id="subject-form" class="panel form-grid">
      <label class="field">
        <span class="label">Name</span>
        <input class="input" name="name" required placeholder="Biologie">
      </label>
      <label class="field">
        <span class="label">Farbe</span>
        <input class="input" name="color" type="color" value="#4F8CFF">
      </label>
      <label class="field">
        <span class="label">Mündlich %</span>
        <input class="input" name="oralWeight" type="number" value="40" min="0" max="100">
      </label>
      <label class="field">
        <span class="label">Schriftlich %</span>
        <input class="input" name="writtenWeight" type="number" value="60" min="0" max="100">
      </label>
      <button class="primary-button" type="submit">${icon("plus")} Speichern</button>
    </form>
  `;
}

function renderEventForm(year) {
  const subjects = getSubjectsForSchoolYear(state.data, year.id);
  return `
    <form id="event-form" class="panel form-grid">
      <label class="field full">
        <span class="label">Titel</span>
        <input class="input" name="title" required placeholder="Englisch Test">
      </label>
      ${subjectSelect(subjects, true)}
      ${selectField("category", "Kategorie", eventLabels)}
      <label class="field">
        <span class="label">Datum</span>
        <input class="input" name="date" type="date" required value="${todayValue()}">
      </label>
      <label class="field">
        <span class="label">Priorität</span>
        <select class="select" name="priority">
          <option value="low">Niedrig</option>
          <option value="medium" selected>Mittel</option>
          <option value="high">Hoch</option>
        </select>
      </label>
      <label class="field full">
        <span class="label">Beschreibung</span>
        <textarea class="textarea" name="description"></textarea>
      </label>
      <button class="primary-button" type="submit">${icon("plus")} Speichern</button>
    </form>
  `;
}

function renderProjectForm(year) {
  const subjects = getSubjectsForSchoolYear(state.data, year.id);
  return `
    <form id="project-form" class="panel form-grid">
      <label class="field full">
        <span class="label">Titel</span>
        <input class="input" name="title" required placeholder="Vulkanmodell">
      </label>
      ${subjectSelect(subjects, true)}
      <label class="field">
        <span class="label">Abgabe</span>
        <input class="input" name="dueDate" type="date" required value="${todayValue()}">
      </label>
      <label class="field">
        <span class="label">Status</span>
        <select class="select" name="status">
          <option value="${PROJECT_STATUS.PLANNED}">Geplant</option>
          <option value="${PROJECT_STATUS.STARTED}">Begonnen</option>
          <option value="${PROJECT_STATUS.IN_PROGRESS}">In Arbeit</option>
          <option value="${PROJECT_STATUS.DONE}">Abgeschlossen</option>
        </select>
      </label>
      <label class="field full">
        <span class="label">Beschreibung</span>
        <textarea class="textarea" name="description"></textarea>
      </label>
      <button class="primary-button" type="submit">${icon("plus")} Speichern</button>
    </form>
  `;
}

function renderLearningForm(year) {
  const subjects = getSubjectsForSchoolYear(state.data, year.id);
  return `
    <form id="learning-form" class="panel form-grid">
      ${subjectSelect(subjects)}
      <label class="field">
        <span class="label">Datum</span>
        <input class="input" name="date" type="date" required value="${todayValue()}">
      </label>
      <label class="field">
        <span class="label">Thema</span>
        <input class="input" name="topic" required placeholder="Organische Chemie">
      </label>
      <label class="field">
        <span class="label">Dauer Minuten</span>
        <input class="input" name="durationMinutes" type="number" required min="0" value="45">
      </label>
      <label class="field">
        <span class="label">Ergebnis %</span>
        <input class="input" name="result" type="number" min="0" max="100" placeholder="36">
      </label>
      <label class="field full">
        <span class="label">Notizen</span>
        <textarea class="textarea" name="notes"></textarea>
      </label>
      <button class="primary-button" type="submit">${icon("plus")} Speichern</button>
    </form>
  `;
}

function renderYearForm() {
  return `
    <form id="year-form" class="panel form-grid">
      <label class="field">
        <span class="label">Name</span>
        <input class="input" name="name" required placeholder="10. Klasse">
      </label>
      <label class="field">
        <span class="label">Start</span>
        <input class="input" name="startDate" type="date">
      </label>
      <label class="field">
        <span class="label">Ende</span>
        <input class="input" name="endDate" type="date">
      </label>
      <button class="primary-button" type="submit">${icon("plus")} Speichern</button>
    </form>
  `;
}

function renderEvents(year) {
  const events = getEventsForSchoolYear(state.data, year.id)
    .map((event) => ({ ...event, countdown: formatCountdown(event.date), dateValue: new Date(`${event.date}T00:00:00`).getTime() }))
    .sort((a, b) => a.dateValue - b.dateValue);
  const projects = getProjectsForSchoolYear(state.data, year.id)
    .map((project) => ({ ...project, countdown: formatCountdown(project.dueDate), dateValue: new Date(`${project.dueDate}T00:00:00`).getTime() }))
    .sort((a, b) => a.dateValue - b.dateValue);

  return `
    <section class="view-header">
      <div>
        <h2>Termine</h2>
        <div class="muted">${escapeHtml(year.name)}</div>
      </div>
      <button class="primary-button" data-open-add="event">${icon("plus")} Termin</button>
    </section>
    <section class="grid two">
      <div class="panel">
        <div class="section-title"><h3>Kalender</h3></div>
        <div class="list">${events.length ? events.map(renderEventRow).join("") : `<div class="empty">Keine Termine</div>`}</div>
      </div>
      <div class="panel">
        <div class="section-title"><h3>Projekte</h3></div>
        <div class="list">${projects.length ? projects.map(renderProjectRow).join("") : `<div class="empty">Keine Projekte</div>`}</div>
      </div>
    </section>
  `;
}

function renderAnalysis(year) {
  const subjects = getSubjectsForSchoolYear(state.data, year.id);
  const selectedSubject = subjects.find((subject) => subject.id === state.analysisSubjectId) ?? subjects[0];
  const stats = selectedSubject ? calculateSubjectStats(state.data, selectedSubject.id) : null;
  const required = selectedSubject ? calculateRequiredNextGrade({
    currentAverage: calculateSubjectGrade(state.data, selectedSubject.id).total,
    targetAverage: 2,
    existingWeight: Math.max(1, stats?.examCount + stats?.testCount || 1),
    nextWeight: 1
  }) : null;

  return `
    <section class="view-header">
      <div>
        <h2>Analyse</h2>
        <div class="muted">${escapeHtml(year.name)}</div>
      </div>
      <select class="select" id="analysis-subject" aria-label="Analysefach">
        ${subjects.map((subject) => `<option value="${subject.id}" ${subject.id === selectedSubject?.id ? "selected" : ""}>${escapeHtml(subject.name)}</option>`).join("")}
      </select>
    </section>

    <section class="grid three">
      ${metric("Beste Note", formatGrade(stats?.bestGrade), selectedSubject ? escapeHtml(selectedSubject.name) : "Kein Fach")}
      ${metric("Schlechteste Note", formatGrade(stats?.worstGrade), `${stats?.examCount ?? 0} Klausuren, ${stats?.testCount ?? 0} Tests`)}
      ${metric("Lernzeit", `${stats?.totalLearningMinutes ?? 0} min`, `${stats?.learningActivityCount ?? 0} Aktivitäten`)}
    </section>

    <section class="grid two" style="margin-top:16px">
      <div class="panel chart-wrap">
        <div class="section-title">
          <h3>Verlauf</h3>
          <div class="segmented">
            ${["30", "90", "180", "365", "all"].map((period) => `
              <button class="segment ${state.analysisPeriod === period ? "active" : ""}" data-period="${period}">${period === "all" ? "Gesamt" : `${period}T`}</button>
            `).join("")}
          </div>
        </div>
        ${selectedSubject ? renderTrendChart(selectedSubject.id) : `<div class="empty">Kein Fach ausgewählt</div>`}
      </div>
      <div class="panel">
        <div class="section-title"><h3>Prognose</h3></div>
        <div class="metric-value">${formatGrade(required?.requiredGrade)}</div>
        <div class="metric-detail">${required?.reachable ? "Ziel 2,0 erreichbar mit nächster Leistung" : "Ziel 2,0 braucht mehr als eine Leistung"}</div>
        <div class="section-title" style="margin-top:22px"><h3>Schwächste Themen</h3></div>
        <div class="list">${selectedSubject ? renderTopicRows(selectedSubject.id) : `<div class="empty">Keine Themen</div>`}</div>
      </div>
    </section>
  `;
}

function renderTrendChart(subjectId) {
  const entries = getTrendEntries(subjectId);
  if (!entries.length) return `<div class="empty">Noch kein Verlauf</div>`;

  const width = 640;
  const height = 260;
  const pad = 32;
  const minDate = Math.min(...entries.map((entry) => entry.time));
  const maxDate = Math.max(...entries.map((entry) => entry.time));
  const xFor = (time) => pad + ((time - minDate) / Math.max(1, maxDate - minDate)) * (width - pad * 2);
  const yFor = (grade) => pad + ((grade - 1) / 5) * (height - pad * 2);
  const points = entries.map((entry) => `${xFor(entry.time)},${yFor(entry.grade)}`).join(" ");

  return `
    <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Notenverlauf">
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="rgba(255,255,255,.12)"></line>
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="rgba(255,255,255,.12)"></line>
      ${[1, 2, 3, 4, 5, 6].map((grade) => `
        <line x1="${pad}" y1="${yFor(grade)}" x2="${width - pad}" y2="${yFor(grade)}" stroke="rgba(255,255,255,.05)"></line>
        <text class="axis-label" x="8" y="${yFor(grade) + 4}">${grade}</text>
      `).join("")}
      <polyline points="${points}" fill="none" stroke="#4F8CFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
      ${entries.map((entry) => `<circle cx="${xFor(entry.time)}" cy="${yFor(entry.grade)}" r="5" fill="#24C26A"></circle>`).join("")}
    </svg>
  `;
}

function getTrendEntries(subjectId) {
  const now = Date.now();
  const periodDays = state.analysisPeriod === "all" ? Infinity : Number(state.analysisPeriod);
  return Object.values(state.data.entities.gradeEntries)
    .filter((entry) => entry.subjectId === subjectId)
    .map((entry) => ({
      time: new Date(`${entry.date}T00:00:00`).getTime(),
      grade: normalizeScoreToGrade(entry.score, state.data.entities.conversionTables)
    }))
    .filter((entry) => Number.isFinite(periodDays) ? now - entry.time <= periodDays * 24 * 60 * 60 * 1000 : true)
    .sort((a, b) => a.time - b.time);
}

function renderTopicRows(subjectId) {
  const topics = getWeakestTopics(state.data, subjectId, 5);
  if (!topics.length) return `<div class="empty">Keine Themen</div>`;
  return topics.map((topic) => `
    <div class="row">
      <div>
        <div class="title">${escapeHtml(topic.topic)}</div>
        <div class="subline">${topic.count} Einträge</div>
      </div>
      <div class="grade-pill"><span class="caption">Ø</span><strong>${formatGrade(topic.averageGrade)}</strong></div>
    </div>
  `).join("");
}

function renderEventRow(event) {
  const subject = event.subjectId ? state.data.entities.subjects[event.subjectId] : null;
  return `
    <div class="event-row">
      <div>
        <div class="title">${escapeHtml(event.title)}</div>
        <div class="subline">${escapeHtml(eventLabels[event.category] ?? event.category)}${subject ? ` · ${escapeHtml(subject.name)}` : ""} · ${escapeHtml(event.date)}</div>
      </div>
      <div class="grade-pill"><strong>${escapeHtml(event.countdown)}</strong></div>
    </div>
  `;
}

function renderProjectRow(project) {
  const subject = project.subjectId ? state.data.entities.subjects[project.subjectId] : null;
  return `
    <div class="event-row">
      <div>
        <div class="title">${escapeHtml(project.title)}</div>
        <div class="subline">${escapeHtml(project.status.replace("_", " "))}${subject ? ` · ${escapeHtml(subject.name)}` : ""} · ${escapeHtml(project.dueDate)}</div>
      </div>
      <div class="grade-pill"><strong>${escapeHtml(project.countdown)}</strong></div>
    </div>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="Hauptnavigation">
      ${tabs.map((tab) => `
        <button class="nav-button ${state.activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}" aria-label="${tab.label}">
          ${icon(tab.icon)}
          <span>${tab.label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function attachEvents() {
  app.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      render();
    });
  });

  app.querySelector("#user-name")?.addEventListener("change", (event) => {
    commit(updateUserProfile(state.data, { name: event.target.value.trim() }), "Profil gespeichert");
  });

  app.querySelector("#school-year-select")?.addEventListener("change", (event) => {
    commit(setCurrentSchoolYear(state.data, event.target.value));
  });

  app.querySelector("#subject-sort")?.addEventListener("change", (event) => {
    state.subjectSort = event.target.value;
    render();
  });

  app.querySelector("#analysis-subject")?.addEventListener("change", (event) => {
    state.analysisSubjectId = event.target.value;
    render();
  });

  app.querySelectorAll("[data-period]").forEach((button) => {
    button.addEventListener("click", () => {
      state.analysisPeriod = button.dataset.period;
      render();
    });
  });

  app.querySelectorAll("[data-add-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.addMode = button.dataset.addMode;
      render();
    });
  });

  app.querySelectorAll("[data-open-add]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = "add";
      state.addMode = button.dataset.openAdd;
      render();
    });
  });

  app.querySelectorAll("[data-remove-subject]").forEach((button) => {
    button.addEventListener("click", () => {
      commit(removeSubject(state.data, button.dataset.removeSubject), "Fach gelöscht");
    });
  });

  app.querySelector("#export-data")?.addEventListener("click", handleExport);
  app.querySelector("#import-data")?.addEventListener("click", () => app.querySelector("#import-file")?.click());
  app.querySelector("#import-file")?.addEventListener("change", handleImport);

  attachForms();
}

function attachForms() {
  app.querySelector("#grade-form")?.addEventListener("submit", handleGradeSubmit);
  app.querySelector("#subject-form")?.addEventListener("submit", handleSubjectSubmit);
  app.querySelector("#event-form")?.addEventListener("submit", handleEventSubmit);
  app.querySelector("#project-form")?.addEventListener("submit", handleProjectSubmit);
  app.querySelector("#learning-form")?.addEventListener("submit", handleLearningSubmit);
  app.querySelector("#year-form")?.addEventListener("submit", handleYearSubmit);
}

function handleGradeSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const year = getCurrentYear();
  const subjectId = form.get("subjectId");
  const scoreKind = form.get("scoreKind");
  const score = {
    kind: scoreKind,
    value: Number(form.get("scoreValue"))
  };

  if (scoreKind === SCORE_KINDS.POINTS) score.max = Number(form.get("scoreMax"));

  commit(addGradeEntry(state.data, {
    schoolYearId: year.id,
    subjectId,
    date: form.get("date"),
    type: form.get("type"),
    area: form.get("area"),
    score,
    note: form.get("note"),
    topics: splitTopics(form.get("topics"))
  }), "Note gespeichert");
}

function handleSubjectSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const year = getCurrentYear();
  const oral = Number(form.get("oralWeight"));
  const written = Number(form.get("writtenWeight"));

  commit(addSubject(state.data, {
    schoolYearId: year.id,
    name: form.get("name").trim(),
    color: form.get("color"),
    weights: {
      areas: { oral, written },
      categories: {
        oral: { participation: 50, test: 30, presentation: 20 },
        written: { exam: 70, test: 30 }
      }
    }
  }), "Fach gespeichert");
}

function handleEventSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const year = getCurrentYear();
  commit(addEvent(state.data, {
    schoolYearId: year.id,
    subjectId: form.get("subjectId") || null,
    title: form.get("title").trim(),
    description: form.get("description"),
    date: form.get("date"),
    category: form.get("category"),
    priority: form.get("priority")
  }), "Termin gespeichert");
}

function handleProjectSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const year = getCurrentYear();
  commit(addProject(state.data, {
    schoolYearId: year.id,
    subjectId: form.get("subjectId") || null,
    title: form.get("title").trim(),
    description: form.get("description"),
    dueDate: form.get("dueDate"),
    status: form.get("status")
  }), "Projekt gespeichert");
}

function handleLearningSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const year = getCurrentYear();
  const resultValue = form.get("result");
  commit(addLearningActivity(state.data, {
    schoolYearId: year.id,
    subjectId: form.get("subjectId"),
    topic: form.get("topic").trim(),
    date: form.get("date"),
    durationMinutes: Number(form.get("durationMinutes")),
    result: resultValue ? { kind: SCORE_KINDS.PERCENT, value: Number(resultValue) } : null,
    notes: form.get("notes")
  }), "Lernzeit gespeichert");
}

function handleYearSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  commit(addSchoolYear(state.data, {
    name: form.get("name").trim(),
    startDate: form.get("startDate") || null,
    endDate: form.get("endDate") || null
  }), "Jahrgang gespeichert");
}

function handleExport() {
  const blob = new Blob([exportData(state.data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `academicos-backup-${todayValue()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    commit(importData(text), "Daten importiert");
  } catch (error) {
    showToast(error.message);
  }
}

async function commit(data, message = "") {
  try {
    await repository.save(data);
    state.data = data;
    if (message) showToast(message);
    render();
  } catch (error) {
    showToast(error.message);
  }
}

function showToast(message) {
  state.toast = message;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    state.toast = null;
    render();
  }, 2200);
}

function subjectSelect(subjects, optional = false) {
  return `
    <label class="field">
      <span class="label">Fach</span>
      <select class="select" name="subjectId" ${optional ? "" : "required"}>
        ${optional ? `<option value="">Ohne Fach</option>` : ""}
        ${subjects.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.name)}</option>`).join("")}
      </select>
    </label>
  `;
}

function selectField(name, label, options) {
  return `
    <label class="field">
      <span class="label">${label}</span>
      <select class="select" name="${name}">
        ${Object.entries(options).map(([value, text]) => `<option value="${value}">${escapeHtml(text)}</option>`).join("")}
      </select>
    </label>
  `;
}

function addModeLabel(mode) {
  return {
    grade: "Note",
    subject: "Fach",
    event: "Termin",
    project: "Projekt",
    learning: "Lernen",
    year: "Jahrgang"
  }[mode];
}

function getCurrentYear() {
  const id = state?.data.user.currentSchoolYearId;
  return id ? state.data.entities.schoolYears[id] : Object.values(state.data.entities.schoolYears)[0] ?? null;
}

function safeGrade(subjectId) {
  const grade = calculateSubjectGrade(state.data, subjectId).total;
  return Number.isFinite(grade) ? grade : Number.POSITIVE_INFINITY;
}

function formatGrade(value) {
  if (!Number.isFinite(value)) return "–";
  return value.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatLongDate(date) {
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function todayValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function splitTopics(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
