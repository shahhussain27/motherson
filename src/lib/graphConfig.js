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