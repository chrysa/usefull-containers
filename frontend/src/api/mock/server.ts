import { setupWorker } from "msw/browser";
import { blueprintsHandlers } from "./handlers/blueprints.handlers";

export const worker = setupWorker(...blueprintsHandlers);
