import { GRADE_AREAS, SCORE_KINDS } from "./constants.js";
import { validateGradeEntry, validateWeights } from "./validation.js";

export function normalizeScoreToGrade(score, conversionTables = {}) {
  if (score.kind === SCORE_KINDS.GRADE_1_TO_6) {
    return score.value;
  }

  if (score.kind === SCORE_KINDS.POINTS) {
    return normalizeScoreToGrade({ kind: SCORE_KINDS.PERCENT, value: (score.value / score.max) * 100 }, conversionTables);
  }

  if (score.kind === SCORE_KINDS.PERCENT) {
    const table = conversionTables[score.conversionTableId] ?? Object.values(conversionTables)[0];
    if (!table) {
      throw new Error("A conversion table is required for percent scores");
    }

    const range = table.ranges.find((item) => score.value >= item.min && score.value <= item.max);
    if (!range) {
      throw new Error(`No conversion range found for percent value ${score.value}`);
    }
    return range.value;
  }

  throw new Error(`Unsupported score kind: ${score.kind}`);
}

export function weightedAverage(items) {
  const present = items.filter((item) => Number.isFinite(item.value) && Number.isFinite(item.weight) && item.weight > 0);
  if (present.length === 0) return null;

  const totalWeight = present.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = present.reduce((sum, item) => sum + item.value * item.weight, 0);
  return weightedSum / totalWeight;
}

export function calculateSubjectGrade(data, subjectId) {
  const subject = data.entities.subjects[subjectId];
  if (!subject) {
    throw new Error(`subject not found: ${subjectId}`);
  }

  validateWeights(subject.weights);

  const entries = Object.values(data.entities.gradeEntries)
    .filter((entry) => entry.subjectId === subjectId)
    .map((entry) => {
      validateGradeEntry(entry, data);
      return {
        ...entry,
        normalizedGrade: normalizeScoreToGrade(entry.score, data.entities.conversionTables)
      };
    });

  const oral = calculateAreaGrade(entries, subject.weights, GRADE_AREAS.ORAL);
  const written = calculateAreaGrade(entries, subject.weights, GRADE_AREAS.WRITTEN);
  const total = weightedAverage([
    { value: oral, weight: subject.weights.areas[GRADE_AREAS.ORAL] },
    { value: written, weight: subject.weights.areas[GRADE_AREAS.WRITTEN] }
  ]);

  return {
    subjectId,
    oral,
    written,
    total,
    entryCount: entries.length
  };
}

export function calculateAreaGrade(entries, weights, area) {
  const areaEntries = entries.filter((entry) => entry.area === area);
  const categoryWeights = weights.categories[area] ?? {};

  const categoryResults = Object.entries(categoryWeights).map(([type, weight]) => {
    const categoryEntries = areaEntries.filter((entry) => entry.type === type);
    const categoryAverage = weightedAverage(categoryEntries.map((entry) => ({ value: entry.normalizedGrade, weight: 1 })));
    return { value: categoryAverage, weight };
  });

  return weightedAverage(categoryResults);
}

export function calculateSchoolYearAverage(data, schoolYearId) {
  const subjects = Object.values(data.entities.subjects).filter((subject) => subject.schoolYearId === schoolYearId);
  const subjectGrades = subjects.map((subject) => calculateSubjectGrade(data, subject.id));

  return {
    schoolYearId,
    average: weightedAverage(subjectGradeItems(subjectGrades)),
    subjects: subjectGrades
  };
}

export function subjectGradeItems(subjectGrades) {
  return subjectGrades
    .filter((result) => Number.isFinite(result.total))
    .map((result) => ({ value: result.total, weight: 1 }));
}

export function calculateRequiredNextGrade({
  currentAverage,
  targetAverage,
  existingWeight = 1,
  nextWeight = 1
}) {
  if (!Number.isFinite(currentAverage) || !Number.isFinite(targetAverage)) {
    return null;
  }

  const required = ((existingWeight + nextWeight) * targetAverage - existingWeight * currentAverage) / nextWeight;
  const requiredGrade = roundGrade(required);

  return {
    requiredGrade,
    reachable: requiredGrade >= 1 && requiredGrade <= 6
  };
}

export function roundGrade(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
