/** Steps for a first-time user (no project yet) */
export const STEPS_NEW = ["project", "backend", "gamedata", "first-plan", "done"] as const;
/** Steps when a project already exists but setup was not completed */
export const STEPS_EXISTING = ["backend", "gamedata", "first-plan", "done"] as const;

export type Step = (typeof STEPS_NEW)[number];

export type HealthStatus = "pending" | "online" | "offline";
