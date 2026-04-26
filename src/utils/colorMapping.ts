import type { SchedulerEventColor } from "@mui/x-scheduler/models";

const HEX_TO_COLOR: Record<string, SchedulerEventColor> = {
    "#d32f2f": "red",
    "#c2185b": "pink",
    "#9c27b0": "purple",
    "#3f51b5": "indigo",
    "#1976d2": "blue",
    "#0097a7": "teal",
    "#2e7d32": "green",
    "#8bc34a": "lime",
    "#fbc02d": "amber",
    "#ed6c02": "orange",
    "#455a64": "grey",
};

export function hexToSchedulerColor(hex: string | null | undefined): SchedulerEventColor {
    if (!hex) return "teal";
    const normalized = hex.toLowerCase();
    if (normalized in HEX_TO_COLOR) return HEX_TO_COLOR[normalized];
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    let closest: SchedulerEventColor = "teal";
    let minDist = Infinity;
    for (const [h, name] of Object.entries(HEX_TO_COLOR)) {
        const hr = parseInt(h.slice(1, 3), 16);
        const hg = parseInt(h.slice(3, 5), 16);
        const hb = parseInt(h.slice(5, 7), 16);
        const dist = (r - hr) ** 2 + (g - hg) ** 2 + (b - hb) ** 2;
        if (dist < minDist) {
            minDist = dist;
            closest = name;
        }
    }
    return closest;
}
