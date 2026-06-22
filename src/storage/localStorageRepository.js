import { createEmptyAcademicOSData } from "../core/model.js";
import { validateDataShape } from "../core/validation.js";

export const DEFAULT_STORAGE_KEY = "academicos:data:v1";

export function createLocalStorageRepository(storage, key = DEFAULT_STORAGE_KEY) {
  return {
    load() {
      const raw = storage.getItem(key);
      if (!raw) return createEmptyAcademicOSData();

      const data = JSON.parse(raw);
      validateDataShape(data);
      return data;
    },
    save(data) {
      validateDataShape(data);
      storage.setItem(key, JSON.stringify(data));
      return data;
    },
    clear() {
      storage.removeItem(key);
    }
  };
}

export function exportData(data) {
  validateDataShape(data);
  return JSON.stringify(data, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  validateDataShape(data);
  return data;
}
