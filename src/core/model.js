import { DEFAULT_CONVERSION_TABLE_ID, GRADE_AREAS, SCHEMA_VERSION } from "./constants.js";
import { createId } from "./id.js";

export function createEmptyAcademicOSData(now = new Date()) {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    user: {
      name: "",
      currentSchoolYearId: null,
      settings: {
        defaultConversionTableId: DEFAULT_CONVERSION_TABLE_ID
      }
    },
    entities: {
      schoolYears: {},
      subjects: {},
      gradeEntries: {},
      events: {},
      projects: {},
      learningActivities: {},
      conversionTables: {
        [DEFAULT_CONVERSION_TABLE_ID]: createDefaultPercentConversionTable()
      }
    },
    order: {
      schoolYears: [],
      subjects: [],
      gradeEntries: [],
      events: [],
      projects: [],
      learningActivities: [],
      conversionTables: [DEFAULT_CONVERSION_TABLE_ID]
    }
  };
}

export function createDefaultPercentConversionTable() {
  return {
    id: DEFAULT_CONVERSION_TABLE_ID,
    name: "Standard Prozent zu Note",
    sourceKind: "percent",
    targetKind: "grade_1_to_6",
    ranges: [
      { min: 90, max: 100, value: 1 },
      { min: 80, max: 89.999, value: 2 },
      { min: 65, max: 79.999, value: 3 },
      { min: 50, max: 64.999, value: 4 },
      { min: 25, max: 49.999, value: 5 },
      { min: 0, max: 24.999, value: 6 }
    ]
  };
}

export function createDefaultSubjectWeights() {
  return {
    areas: {
      [GRADE_AREAS.ORAL]: 40,
      [GRADE_AREAS.WRITTEN]: 60
    },
    categories: {
      [GRADE_AREAS.ORAL]: {
        participation: 50,
        test: 30,
        presentation: 20
      },
      [GRADE_AREAS.WRITTEN]: {
        exam: 70,
        test: 30
      }
    }
  };
}

export function createSchoolYear({ name, startDate = null, endDate = null, id = createId("year") }) {
  return {
    id,
    name,
    startDate,
    endDate,
    subjectIds: [],
    eventIds: [],
    projectIds: []
  };
}

export function createSubject({
  schoolYearId,
  name,
  color = "#4F8CFF",
  weights = createDefaultSubjectWeights(),
  id = createId("subject")
}) {
  return {
    id,
    schoolYearId,
    name,
    color,
    weights,
    topicIds: [],
    gradeEntryIds: [],
    learningActivityIds: []
  };
}

export function createGradeEntry({
  schoolYearId,
  subjectId,
  date,
  type,
  area,
  score,
  note = "",
  topics = [],
  id = createId("grade")
}) {
  return {
    id,
    schoolYearId,
    subjectId,
    date,
    type,
    area,
    score,
    note,
    topics
  };
}

export function createAcademicEvent({
  schoolYearId,
  subjectId = null,
  title,
  description = "",
  date,
  category,
  priority = "medium",
  id = createId("event")
}) {
  return {
    id,
    schoolYearId,
    subjectId,
    title,
    description,
    date,
    category,
    priority
  };
}

export function createProject({
  schoolYearId,
  subjectId = null,
  title,
  description = "",
  dueDate,
  status = "planned",
  id = createId("project")
}) {
  return {
    id,
    schoolYearId,
    subjectId,
    title,
    description,
    dueDate,
    status
  };
}

export function createLearningActivity({
  schoolYearId,
  subjectId,
  topic,
  date,
  durationMinutes,
  result = null,
  notes = "",
  id = createId("learn")
}) {
  return {
    id,
    schoolYearId,
    subjectId,
    topic,
    date,
    durationMinutes,
    result,
    notes
  };
}
