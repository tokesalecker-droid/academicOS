import {
  createAcademicEvent,
  createGradeEntry,
  createLearningActivity,
  createProject,
  createSchoolYear,
  createSubject
} from "../core/model.js";
import { validateDataShape, validateEvent, validateGradeEntry, validateLearningActivity, validateProject, validateWeights } from "../core/validation.js";

export function touch(data, now = new Date()) {
  return {
    ...data,
    updatedAt: now.toISOString()
  };
}

export function updateUserProfile(data, input) {
  const next = structuredClone(data);
  next.user = {
    ...next.user,
    ...input
  };
  validateDataShape(next);
  return touch(next);
}

export function setCurrentSchoolYear(data, schoolYearId) {
  if (!data.entities.schoolYears[schoolYearId]) {
    throw new Error(`school year not found: ${schoolYearId}`);
  }

  const next = structuredClone(data);
  next.user.currentSchoolYearId = schoolYearId;
  validateDataShape(next);
  return touch(next);
}

export function addSchoolYear(data, input) {
  const schoolYear = createSchoolYear(input);
  const next = structuredClone(data);
  next.entities.schoolYears[schoolYear.id] = schoolYear;
  next.order.schoolYears.push(schoolYear.id);
  if (!next.user.currentSchoolYearId) {
    next.user.currentSchoolYearId = schoolYear.id;
  }
  validateDataShape(next);
  return touch(next);
}

export function addSubject(data, input) {
  const subject = createSubject(input);
  validateWeights(subject.weights);

  const next = structuredClone(data);
  if (!next.entities.schoolYears[subject.schoolYearId]) {
    throw new Error(`school year not found: ${subject.schoolYearId}`);
  }

  next.entities.subjects[subject.id] = subject;
  next.entities.schoolYears[subject.schoolYearId].subjectIds.push(subject.id);
  next.order.subjects.push(subject.id);
  validateDataShape(next);
  return touch(next);
}

export function addGradeEntry(data, input) {
  const entry = createGradeEntry(input);
  validateGradeEntry(entry, data);

  const next = structuredClone(data);
  next.entities.gradeEntries[entry.id] = entry;
  next.entities.subjects[entry.subjectId].gradeEntryIds.push(entry.id);
  next.order.gradeEntries.push(entry.id);
  validateDataShape(next);
  return touch(next);
}

export function addEvent(data, input) {
  const event = createAcademicEvent(input);
  validateEvent(event, data);

  const next = structuredClone(data);
  next.entities.events[event.id] = event;
  next.entities.schoolYears[event.schoolYearId].eventIds.push(event.id);
  next.order.events.push(event.id);
  validateDataShape(next);
  return touch(next);
}

export function addProject(data, input) {
  const project = createProject(input);
  validateProject(project, data);

  const next = structuredClone(data);
  next.entities.projects[project.id] = project;
  next.entities.schoolYears[project.schoolYearId].projectIds.push(project.id);
  next.order.projects.push(project.id);
  validateDataShape(next);
  return touch(next);
}

export function addLearningActivity(data, input) {
  const activity = createLearningActivity(input);
  validateLearningActivity(activity, data);

  const next = structuredClone(data);
  next.entities.learningActivities[activity.id] = activity;
  next.entities.subjects[activity.subjectId].learningActivityIds.push(activity.id);
  next.order.learningActivities.push(activity.id);
  validateDataShape(next);
  return touch(next);
}

export function removeSubject(data, subjectId) {
  const subject = data.entities.subjects[subjectId];
  if (!subject) return touch(structuredClone(data));

  const next = structuredClone(data);
  const relatedGradeIds = new Set(Object.values(next.entities.gradeEntries).filter((entry) => entry.subjectId === subjectId).map((entry) => entry.id));
  const relatedActivityIds = new Set(Object.values(next.entities.learningActivities).filter((activity) => activity.subjectId === subjectId).map((activity) => activity.id));

  for (const id of relatedGradeIds) delete next.entities.gradeEntries[id];
  for (const id of relatedActivityIds) delete next.entities.learningActivities[id];
  for (const event of Object.values(next.entities.events)) {
    if (event.subjectId === subjectId) event.subjectId = null;
  }
  for (const project of Object.values(next.entities.projects)) {
    if (project.subjectId === subjectId) project.subjectId = null;
  }

  delete next.entities.subjects[subjectId];
  next.entities.schoolYears[subject.schoolYearId].subjectIds = next.entities.schoolYears[subject.schoolYearId].subjectIds.filter((id) => id !== subjectId);
  next.order.subjects = next.order.subjects.filter((id) => id !== subjectId);
  next.order.gradeEntries = next.order.gradeEntries.filter((id) => !relatedGradeIds.has(id));
  next.order.learningActivities = next.order.learningActivities.filter((id) => !relatedActivityIds.has(id));

  validateDataShape(next);
  return touch(next);
}
