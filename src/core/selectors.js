export function getSchoolYear(data, schoolYearId) {
  return data.entities.schoolYears[schoolYearId] ?? null;
}

export function getSubjectsForSchoolYear(data, schoolYearId) {
  return Object.values(data.entities.subjects).filter((subject) => subject.schoolYearId === schoolYearId);
}

export function getGradeEntriesForSubject(data, subjectId) {
  return Object.values(data.entities.gradeEntries).filter((entry) => entry.subjectId === subjectId);
}

export function getGradeEntriesForSchoolYear(data, schoolYearId) {
  return Object.values(data.entities.gradeEntries).filter((entry) => entry.schoolYearId === schoolYearId);
}

export function getEventsForSchoolYear(data, schoolYearId) {
  return Object.values(data.entities.events).filter((event) => event.schoolYearId === schoolYearId);
}

export function getProjectsForSchoolYear(data, schoolYearId) {
  return Object.values(data.entities.projects).filter((project) => project.schoolYearId === schoolYearId);
}

export function getLearningActivitiesForSubject(data, subjectId) {
  return Object.values(data.entities.learningActivities).filter((activity) => activity.subjectId === subjectId);
}
