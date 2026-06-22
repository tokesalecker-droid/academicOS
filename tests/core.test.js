import test from "node:test";
import assert from "node:assert/strict";

import {
  EVENT_TYPES,
  GRADE_AREAS,
  GRADE_TYPES,
  SCORE_KINDS,
  addEvent,
  addGradeEntry,
  addLearningActivity,
  addSchoolYear,
  addSubject,
  calculateRequiredNextGrade,
  calculateSchoolYearAverage,
  calculateSubjectGrade,
  calculateSubjectStats,
  compareSchoolYears,
  createEmptyAcademicOSData,
  exportData,
  formatCountdown,
  getUpcomingEvents,
  getWeakestSubjects,
  getWeakestTopics,
  importData,
  removeSubject,
  validateWeights
} from "../src/index.js";

function buildFixture() {
  let data = createEmptyAcademicOSData(new Date("2026-06-22T10:00:00"));

  data = addSchoolYear(data, { id: "year8", name: "8. Klasse" });
  data = addSchoolYear(data, { id: "year9", name: "9. Klasse" });
  data = addSubject(data, { id: "math8", schoolYearId: "year8", name: "Mathe" });
  data = addSubject(data, { id: "german8", schoolYearId: "year8", name: "Deutsch" });
  data = addSubject(data, { id: "math9", schoolYearId: "year9", name: "Mathe" });

  return data;
}

test("subject grades use only entries of the requested subject", () => {
  let data = buildFixture();
  data = addGradeEntry(data, {
    id: "math-good",
    schoolYearId: "year8",
    subjectId: "math8",
    date: "2026-06-01",
    type: GRADE_TYPES.EXAM,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.GRADE_1_TO_6, value: 1 },
    topics: ["Gleichungen"]
  });
  data = addGradeEntry(data, {
    id: "german-bad",
    schoolYearId: "year8",
    subjectId: "german8",
    date: "2026-06-01",
    type: GRADE_TYPES.EXAM,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.GRADE_1_TO_6, value: 6 },
    topics: ["Analyse"]
  });

  assert.equal(calculateSubjectGrade(data, "math8").written, 1);
  assert.equal(calculateSubjectGrade(data, "german8").written, 6);
});

test("weights must sum to 100 at each level", () => {
  assert.throws(() => validateWeights({
    areas: { oral: 50, written: 40 },
    categories: {
      oral: { participation: 100 },
      written: { exam: 100 }
    }
  }), /area weights must sum to 100/);
});

test("percent and point scores are converted before averaging", () => {
  let data = buildFixture();
  data = addGradeEntry(data, {
    schoolYearId: "year8",
    subjectId: "math8",
    date: "2026-06-01",
    type: GRADE_TYPES.EXAM,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.PERCENT, value: 95 },
    topics: []
  });
  data = addGradeEntry(data, {
    schoolYearId: "year8",
    subjectId: "math8",
    date: "2026-06-10",
    type: GRADE_TYPES.TEST,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.POINTS, value: 8, max: 10 },
    topics: []
  });

  assert.equal(calculateSubjectGrade(data, "math8").written, 1.3);
});

test("date countdown uses local calendar days", () => {
  assert.equal(formatCountdown("2026-06-29", new Date("2026-06-22T23:30:00")), "In 7 Tagen");
  assert.equal(formatCountdown("2026-06-22", new Date("2026-06-22T01:00:00")), "Heute");
});

test("analytics provide weak subjects, topics, events, stats and comparisons", () => {
  let data = buildFixture();
  data = addGradeEntry(data, {
    schoolYearId: "year8",
    subjectId: "math8",
    date: "2026-06-01",
    type: GRADE_TYPES.EXAM,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.GRADE_1_TO_6, value: 4 },
    topics: ["Bruchrechnung"]
  });
  data = addGradeEntry(data, {
    schoolYearId: "year8",
    subjectId: "german8",
    date: "2026-06-01",
    type: GRADE_TYPES.EXAM,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.GRADE_1_TO_6, value: 2 },
    topics: ["Analyse"]
  });
  data = addGradeEntry(data, {
    schoolYearId: "year9",
    subjectId: "math9",
    date: "2026-06-01",
    type: GRADE_TYPES.EXAM,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.GRADE_1_TO_6, value: 1 },
    topics: ["Funktionen"]
  });
  data = addLearningActivity(data, {
    schoolYearId: "year8",
    subjectId: "math8",
    date: "2026-06-12",
    topic: "Bruchrechnung",
    durationMinutes: 45,
    result: { kind: SCORE_KINDS.PERCENT, value: 36 }
  });
  data = addEvent(data, {
    schoolYearId: "year8",
    subjectId: "math8",
    title: "Mathe Klausur",
    date: "2026-06-29",
    category: EVENT_TYPES.EXAM
  });

  assert.equal(getWeakestSubjects(data, "year8")[0].subjectId, "math8");
  assert.equal(getWeakestTopics(data, "math8")[0].topic, "Bruchrechnung");
  assert.equal(getUpcomingEvents(data, "year8", new Date("2026-06-22T10:00:00"))[0].daysUntil, 7);
  assert.equal(calculateSubjectStats(data, "math8").totalLearningMinutes, 45);
  assert.equal(calculateSchoolYearAverage(data, "year8").subjects.length, 2);
  assert.equal(compareSchoolYears(data, "year8", "year9").improvement > 0, true);
});

test("required next grade calculation reports reachability", () => {
  const result = calculateRequiredNextGrade({
    currentAverage: 2.4,
    targetAverage: 2.0,
    existingWeight: 4,
    nextWeight: 1
  });

  assert.equal(result.requiredGrade, 0.4);
  assert.equal(result.reachable, false);
});

test("removing a subject deletes only related subject data", () => {
  let data = buildFixture();
  data = addGradeEntry(data, {
    id: "math-entry",
    schoolYearId: "year8",
    subjectId: "math8",
    date: "2026-06-01",
    type: GRADE_TYPES.EXAM,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.GRADE_1_TO_6, value: 1 },
    topics: []
  });
  data = addGradeEntry(data, {
    id: "german-entry",
    schoolYearId: "year8",
    subjectId: "german8",
    date: "2026-06-01",
    type: GRADE_TYPES.EXAM,
    area: GRADE_AREAS.WRITTEN,
    score: { kind: SCORE_KINDS.GRADE_1_TO_6, value: 2 },
    topics: []
  });
  data = addEvent(data, {
    id: "math-event",
    schoolYearId: "year8",
    subjectId: "math8",
    title: "Mathe Klausur",
    date: "2026-06-29",
    category: EVENT_TYPES.EXAM
  });

  const next = removeSubject(data, "math8");

  assert.equal(next.entities.subjects.math8, undefined);
  assert.equal(next.entities.gradeEntries["math-entry"], undefined);
  assert.equal(next.entities.events["math-event"].subjectId, null);
  assert.equal(next.entities.subjects.german8.name, "Deutsch");
  assert.equal(next.entities.gradeEntries["german-entry"].subjectId, "german8");
});

test("json export and import validate the full data shape", () => {
  const data = buildFixture();
  const json = exportData(data);
  const imported = importData(json);

  assert.equal(imported.entities.subjects.math8.name, "Mathe");
});
