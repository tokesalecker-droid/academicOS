export const SCHEMA_VERSION = 1;

export const GRADE_AREAS = Object.freeze({
  ORAL: "oral",
  WRITTEN: "written"
});

// Areas a grade entry can target. Includes GRADE_AREAS (oral/written) plus
// "total", which lets an official grade (Zeugnis/Rückmeldung) override the
// subject's overall grade directly, bypassing the oral/written weighting.
// NOTE: "total" is intentionally NOT part of GRADE_AREAS above, since
// GRADE_AREAS is also used as the key set for subject.weights.areas, which
// must sum to 100 and only ever describes oral/written.
export const ENTRY_AREAS = Object.freeze({
  ORAL: "oral",
  WRITTEN: "written",
  TOTAL: "total"
});

export const GRADE_TYPES = Object.freeze({
  EXAM: "exam",
  TEST: "test",
  PRESENTATION: "presentation",
  REPORT: "report",
  PROJECT: "project",
  HOMEWORK: "homework",
  PARTICIPATION: "participation",
  OTHER: "other",
  // Official grades reported by a teacher. These override previously
  // entered grades in the same area (see calculateAreaGrade /
  // calculateSubjectGrade) rather than simply averaging in.
  ZEUGNIS: "zeugnis",
  RUECKMELDUNG: "rueckmeldung"
});

// Grade types that represent an official, overriding grade rather than a
// single graded piece of work.
export const OVERRIDING_GRADE_TYPES = Object.freeze([
  GRADE_TYPES.ZEUGNIS,
  GRADE_TYPES.RUECKMELDUNG
]);

export const EVENT_TYPES = Object.freeze({
  EXAM: "exam",
  TEST: "test",
  PRESENTATION: "presentation",
  REPORT: "report",
  PROJECT: "project",
  DEADLINE: "deadline",
  OTHER: "other"
});

export const PROJECT_STATUS = Object.freeze({
  PLANNED: "planned",
  STARTED: "started",
  IN_PROGRESS: "in_progress",
  DONE: "done"
});

export const SCORE_KINDS = Object.freeze({
  GRADE_1_TO_6: "grade_1_to_6",
  PERCENT: "percent",
  POINTS: "points",
  // Oberstufen-Punktesystem (0-15 Punkte), as used in the German Gymnasiale
  // Oberstufe. Converted to the 1-6 scale via POINTS_15_CONVERSION_TABLE_ID
  // for internal averaging, independent of the percent conversion table.
  POINTS_0_TO_15: "points_0_to_15"
});

export const DEFAULT_CONVERSION_TABLE_ID = "default-percent-to-grade";
export const POINTS_15_CONVERSION_TABLE_ID = "default-points15-to-grade";
