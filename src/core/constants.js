export const SCHEMA_VERSION = 1;

export const GRADE_AREAS = Object.freeze({
  ORAL: "oral",
  WRITTEN: "written"
});

export const GRADE_TYPES = Object.freeze({
  EXAM: "exam",
  TEST: "test",
  PRESENTATION: "presentation",
  REPORT: "report",
  PROJECT: "project",
  HOMEWORK: "homework",
  PARTICIPATION: "participation",
  OTHER: "other"
});

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
  POINTS: "points"
});

export const DEFAULT_CONVERSION_TABLE_ID = "default-percent-to-grade";
