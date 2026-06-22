import { EVENT_TYPES, GRADE_AREAS, GRADE_TYPES, PROJECT_STATUS, SCORE_KINDS } from "./constants.js";

const EPSILON = 0.000001;

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertKnownValue(value, allowed, label) {
  assert(Object.values(allowed).includes(value), `${label} is invalid: ${value}`);
}

export function assertIsoDate(value, label = "date") {
  assert(typeof value === "string" && value.length >= 10, `${label} must be an ISO date string`);
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  assert(!Number.isNaN(parsed.getTime()), `${label} must be a valid date`);
}

export function validateWeights(weights) {
  assert(weights && typeof weights === "object", "weights are required");
  assert(weights.areas && typeof weights.areas === "object", "area weights are required");
  assert(weights.categories && typeof weights.categories === "object", "category weights are required");

  assertPercentSum(weights.areas, "area weights");

  for (const area of Object.keys(weights.areas)) {
    assertKnownValue(area, GRADE_AREAS, "grade area");
    const categoryWeights = weights.categories[area] ?? {};
    assert(Object.keys(categoryWeights).length > 0, `category weights are required for ${area}`);
    assertPercentSum(categoryWeights, `category weights for ${area}`);
  }

  return true;
}

export function assertPercentSum(weightMap, label) {
  const values = Object.values(weightMap);
  assert(values.length > 0, `${label} must not be empty`);

  const total = values.reduce((sum, value) => {
    assert(Number.isFinite(value) && value >= 0, `${label} must contain non-negative numbers`);
    return sum + value;
  }, 0);

  assert(Math.abs(total - 100) <= EPSILON, `${label} must sum to 100, got ${total}`);
}

export function validateScore(score) {
  assert(score && typeof score === "object", "score is required");
  assertKnownValue(score.kind, SCORE_KINDS, "score kind");
  assert(Number.isFinite(score.value), "score value must be a number");

  if (score.kind === SCORE_KINDS.GRADE_1_TO_6) {
    assert(score.value >= 1 && score.value <= 6, "grade value must be between 1 and 6");
  }

  if (score.kind === SCORE_KINDS.PERCENT) {
    assert(score.value >= 0 && score.value <= 100, "percent value must be between 0 and 100");
  }

  if (score.kind === SCORE_KINDS.POINTS) {
    assert(Number.isFinite(score.max) && score.max > 0, "point score requires a positive max value");
    assert(score.value >= 0 && score.value <= score.max, "point value must be between 0 and max");
  }
}

export function validateGradeEntry(entry, data) {
  assert(entry && typeof entry === "object", "grade entry is required");
  assert(data.entities.schoolYears[entry.schoolYearId], `school year not found: ${entry.schoolYearId}`);
  const subject = data.entities.subjects[entry.subjectId];
  assert(subject, `subject not found: ${entry.subjectId}`);
  assert(subject.schoolYearId === entry.schoolYearId, "grade entry school year must match subject school year");
  assertKnownValue(entry.type, GRADE_TYPES, "grade type");
  assertKnownValue(entry.area, GRADE_AREAS, "grade area");
  assertIsoDate(entry.date, "grade date");
  validateScore(entry.score);
  assert(Array.isArray(entry.topics), "topics must be an array");
}

export function validateEvent(event, data) {
  assert(data.entities.schoolYears[event.schoolYearId], `school year not found: ${event.schoolYearId}`);
  if (event.subjectId) {
    const subject = data.entities.subjects[event.subjectId];
    assert(subject, `subject not found: ${event.subjectId}`);
    assert(subject.schoolYearId === event.schoolYearId, "event school year must match subject school year");
  }
  assertKnownValue(event.category, EVENT_TYPES, "event category");
  assertIsoDate(event.date, "event date");
}

export function validateProject(project, data) {
  assert(data.entities.schoolYears[project.schoolYearId], `school year not found: ${project.schoolYearId}`);
  if (project.subjectId) {
    const subject = data.entities.subjects[project.subjectId];
    assert(subject, `subject not found: ${project.subjectId}`);
    assert(subject.schoolYearId === project.schoolYearId, "project school year must match subject school year");
  }
  assertKnownValue(project.status, PROJECT_STATUS, "project status");
  assertIsoDate(project.dueDate, "project due date");
}

export function validateLearningActivity(activity, data) {
  assert(data.entities.schoolYears[activity.schoolYearId], `school year not found: ${activity.schoolYearId}`);
  const subject = data.entities.subjects[activity.subjectId];
  assert(subject, `subject not found: ${activity.subjectId}`);
  assert(subject.schoolYearId === activity.schoolYearId, "learning activity school year must match subject school year");
  assertIsoDate(activity.date, "learning activity date");
  assert(Number.isFinite(activity.durationMinutes) && activity.durationMinutes >= 0, "durationMinutes must be non-negative");
}

export function validateDataShape(data) {
  assert(data && typeof data === "object", "data is required");
  assert(Number.isInteger(data.schemaVersion), "schemaVersion is required");
  assert(data.entities && typeof data.entities === "object", "entities are required");
  assert(data.order && typeof data.order === "object", "order is required");

  for (const subject of Object.values(data.entities.subjects ?? {})) {
    assert(data.entities.schoolYears[subject.schoolYearId], `subject school year not found: ${subject.schoolYearId}`);
    validateWeights(subject.weights);
  }

  for (const entry of Object.values(data.entities.gradeEntries ?? {})) {
    validateGradeEntry(entry, data);
  }

  for (const event of Object.values(data.entities.events ?? {})) {
    validateEvent(event, data);
  }

  for (const project of Object.values(data.entities.projects ?? {})) {
    validateProject(project, data);
  }

  for (const activity of Object.values(data.entities.learningActivities ?? {})) {
    validateLearningActivity(activity, data);
  }

  return true;
}
