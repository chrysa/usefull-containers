import { setupWorker } from "msw/browser";
import { blueprintsHandlers } from "./handlers/blueprints.handlers";
import { gamedataHandlers } from "./handlers/gamedata.handlers";
import { plansHandlers } from "./handlers/plans.handlers";

export const worker = setupWorker(...blueprintsHandlers, ...gamedataHandlers, ...plansHandlers);
