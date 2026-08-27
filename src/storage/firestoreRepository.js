import { db } from "../firebase.js";
import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { createEmptyAcademicOSData } from "../core/model.js";
import { validateDataShape } from "../core/validation.js";

const DOC_PATH = "shared/data";

export function createFirestoreRepository() {
  return {
    async load() {
      const ref = doc(db, DOC_PATH);
      const snap = await getDoc(ref);
      if (!snap.exists()) return createEmptyAcademicOSData();
      const data = snap.data().payload;
      validateDataShape(data);
      return data;
    },
    async save(data) {
      validateDataShape(data);
      const ref = doc(db, DOC_PATH);
      await setDoc(ref, { payload: data });
      return data;
    },
    async clear() {
      const ref = doc(db, DOC_PATH);
      await deleteDoc(ref);
    }
  };
}
