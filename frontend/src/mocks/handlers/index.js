import { authHandlers } from "./authHandlers";
import { classesHandlers } from "./classesHandlers";

export const handlers = [
  ...authHandlers,
  ...classesHandlers,
];
