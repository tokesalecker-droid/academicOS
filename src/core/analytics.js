import { calculateSchoolYearAverage, calculateSubjectGrade, normalizeScoreToGrade, weightedAverage } from "./grades.js";
import { getEventsForSchoolYear, getLearningActivitiesForSubject, getProjectsForSchoolYear, getSubjectsForSchoolYear } from "./selectors.js";
import { daysUntil } from "./dates.js";

export function getWeakestSubjects(data, schoolYearId, limit = 3) {
  return getSubjectsForSchoolYear(data, schoolYearId)
    .map((subject) => ({
      subjectId: subject.id,
      name: subject.name,
      grade: calculateSubjectGrade(data, subject.id).total
    }))
    .filter((item) => Number.isFinite(item.grade))
    .sort((a, b) => b.grade - a.grade)
    .slice(0, limit);
}

export function getUpcomingEvents(data, schoolYearId, now = new Date(), limit = 5) {
  return getEventsForSchoolYear(data, schoolYearId)
    .map((event) => ({ ...event, daysUntil: daysUntil(event.date, now) }))
    .filter((event) => event.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

export function getUpcomingProjects(data, schoolYearId, now = new Date(), limit = 5) {
  return getProjectsForSchoolYear(data, schoolYearId)
    .map((project) => ({ ...project, daysUntil: daysUntil(project.dueDate, now) }))
    .filter((project) => project.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

export function calculateTopicStats(data, subjectId = null) {
  const entries = Object.values(data.entities.gradeEntries)
    .filter((entry) => !subjectId || entry.subjectId === subjectId);

  const topicMap = new Map();

  for (const entry of entries) {
    const grade = normalizeScoreToGrade(entry.score, data.entities.conversionTables);
    for (const topic of entry.topics) {
      const stats = topicMap.get(topic) ?? { topic, count: 0, gradeSum: 0, averageGrade: null };
      stats.count += 1;
      stats.gradeSum += grade;
      stats.averageGrade = stats.gradeSum / stats.count;
      topicMap.set(topic, stats);
    }
  }

  return [...topicMap.values()].map(({ gradeSum, ...stats }) => stats);
}

export function getWeakestTopics(data, subjectId = null, limit = 5) {
  return calculateTopicStats(data, subjectId)
    .filter((item) => Number.isFinite(item.averageGrade))
    .sort((a, b) => b.averageGrade - a.averageGrade)
    .slice(0, limit);
}

export function calculateSubjectStats(data, subjectId) {
  const entries = Object.values(data.entities.gradeEntries).filter((entry) => entry.subjectId === subjectId);
  const grades = entries.map((entry) => normalizeScoreToGrade(entry.score, data.entities.conversionTables));
  const learningActivities = getLearningActivitiesForSubject(data, subjectId);

  return {
    subjectId,
    bestGrade: grades.length ? Math.min(...grades) : null,
    worstGrade: grades.length ? Math.max(...grades) : null,
    averageGrade: weightedAverage(grades.map((grade) => ({ value: grade, weight: 1 }))),
    examCount: entries.filter((entry) => entry.type === "exam").length,
    testCount: entries.filter((entry) => entry.type === "test").length,
    learningActivityCount: learningActivities.length,
    totalLearningMinutes: learningActivities.reduce((sum, activity) => sum + activity.durationMinutes, 0)
  };
}

export function compareSchoolYears(data, fromSchoolYearId, toSchoolYearId) {
  const from = calculateSchoolYearAverage(data, fromSchoolYearId).average;
  const to = calculateSchoolYearAverage(data, toSchoolYearId).average;
  const improvement = Number.isFinite(from) && Number.isFinite(to) ? from - to : null;

  return {
    fromSchoolYearId,
    toSchoolYearId,
    fromAverage: from,
    toAverage: to,
    improvement
  };
}
