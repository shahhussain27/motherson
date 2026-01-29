export const MANPOWER_TREND_Config = {
  required: {
    label: "required",
    color: "#2563eb",
  },
  available: {
    label: "available",
    color: "#60a5fa",
  },
};

export const EMPLOYEEMENT_TYPES = [
  { browser: "permanent", available: 275, fill: "#2563eb" },
  { browser: "temporary", available: 200, fill: "#60a5fa" },
];

export const EMPLOYEEMENT_TYPES_Config = {
  permanent: {
    label: "permanent",
  },
  temporary: {
    label: "temporary",
  },
};

export const ATTRITION_RATE_TREND_CONFIG = {
  rate: {
    label: "rate",
    color: "#2563eb",
  },
};
export const BUFFER_MANPOWER_AVAILABILITY_TREND_CONFIG = {
  rate: {
    label: "rate",
    color: "#2563eb",
  },
};
export const ABABSENDTEISM_RATE_TREND_CONFIG = {
  rate: {
    label: "rate",
    color: "#2563eb",
  },
};

// -----------------------------
// Effective Management Graph Config
// -----------------------------

export const joinedVsTrainedConfig = {
    joined: { label: "Joined", color: "var(--chart-1)" },
    trained: { label: "Trained", color: "var(--chart-5)" },
  };

  export const planVsActualConfig = {
    plan: { label: "Plan", color: "var(--chart-1)" },
    actual: { label: "Actual", color: "var(--chart-5)" },
  };

  export const defectsConfig = {
    totalDefects: { label: "Total Defects", color: "var(--destructive)" },
  };
  
  export const ctqConfig = {
    ctqRejection: { label: "CTQ Rejection", color: "var(--chart-5)" },
  };

  // -----------------------------
  // Mock Data
  // -----------------------------

  // Data for: Joined vs Trained AND Plan vs Actual
export const mockTrainingData = [
  { month: "Jan", joined: 45, trained: 40, plan: 50, actual: 42 },
  { month: "Feb", joined: 52, trained: 48, plan: 55, actual: 50 },
  { month: "Mar", joined: 38, trained: 35, plan: 45, actual: 40 },
  { month: "Apr", joined: 65, trained: 60, plan: 70, actual: 62 },
  { month: "May", joined: 48, trained: 45, plan: 60, actual: 48 },
  { month: "Jun", joined: 55, trained: 54, plan: 65, actual: 58 },
];

// Data for: Defects Trend AND CTQ Rejection
export const mockDefectsData = [
  { month: "Jan", totalDefects: 120, ctqRejection: 15 },
  { month: "Feb", totalDefects: 98, ctqRejection: 12 },
  { month: "Mar", totalDefects: 145, ctqRejection: 25 },
  { month: "Apr", totalDefects: 85, ctqRejection: 8 },
  { month: "May", totalDefects: 110, ctqRejection: 18 },
  { month: "Jun", totalDefects: 75, ctqRejection: 5 },
];