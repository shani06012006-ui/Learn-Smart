// frontend/src/mocks/handlers.js
import { authHandlers } from "./handlers/authHandlers";
import { classesHandlers } from "./handlers/classesHandlers";
import { materialsHandlers } from "./handlers/materialsHandlers";
import { analyticsHandlers } from "./handlers/analyticsHandlers";

export const handlers = [
  ...authHandlers,
  ...classesHandlers,
  ...materialsHandlers,
  ...analyticsHandlers,
];
