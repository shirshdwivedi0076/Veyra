// Tiny client-side bridge so the Ask VEYRA copilot can see the latest Operations analysis.
// Holds aggregate metrics only (no ticket descriptions).
export type OpsSummary = Record<string, unknown>;
let current: OpsSummary | null = null;
export const setOpsSummary = (s: OpsSummary | null) => { current = s; };
export const getOpsSummary = () => current;
