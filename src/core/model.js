import { DEFAULT_CONVERSION_TABLE_ID, GRADE_AREAS, POINTS_15_CONVERSION_TABLE_ID, SCHEMA_VERSION } from "./constants.js";
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
        [DEFAULT_CONVERSION_TABLE_ID]: createDefaultPercentConversionTable(),
        [POINTS_15_CONVERSION_TABLE_ID]: createDefaultPoints15ConversionTable()
      }
    },
    order: {
      schoolYears: [],
      subjects: [],
      gradeEntries: [],
      events: [],
      projects: [],
      learningActivities: [],
      conversionTables: [DEFAULT_CONVERSION_TABLE_ID, POINTS_15_CONVERSION_TABLE_ID]
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

// Official conversion table between the Oberstufen-Punktesystem (0-15) and
// the 1-6 grade scale, per the standard KMK mapping used across German
// Gymnasiale Oberstufen.
export function createDefaultPoints15ConversionTable() {
  return {
    id: POINTS_15_CONVERSION_TABLE_ID,
    name: "Standard 15-Punkte zu Note",
    sourceKind: "points_0_to_15",
    targetKind: "grade_1_to_6",
    ranges: [
      { min: 15, max: 15, value: 1 },
      { min: 14, max: 14, value: 1 },
      { min: 13, max: 13, value: 1.3 },
      { min: 12, max: 12, value: 1.7 },
      { min: 11, max: 11, value: 2 },
      { min: 10, max: 10, value: 2.3 },
      { min: 9, max: 9, value: 2.7 },
      { min: 8, max: 8, value: 3 },
      { min: 7, max: 7, value: 3.3 },
      { min: 6, max: 6, value: 3.7 },
      { min: 5, max: 5, value: 4 },
      { min: 4, max: 4, value: 4.3 },
      { min: 3, max: 3, value: 4.7 },
      { min: 2, max: 2, value: 5 },
      { min: 1, max: 1, value: 5.7 },
      { min: 0, max: 0, value: 6 }
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
  // Only used when type is "zeugnis" or "rueckmeldung" and area is "oral"
  // or "written": which existing category (e.g. "exam", "test") this
  // official grade should be averaged into. Not used when area is "total",
  // since a total override bypasses categories entirely.
  overrideCategory = null,
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
    topics,
    overrideCategory
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
