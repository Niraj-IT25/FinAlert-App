// FinAlert design tokens
export const colors = {
  ink: "#14213D",       // brand navy: headers, primary buttons
  inkSoft: "#2B3A5C",
  paper: "#F5F6F8",     // screen background
  card: "#FFFFFF",
  line: "#E1E4EA",
  text: "#1B2433",
  muted: "#6B7588",
  alert: "#D8432C",     // pending / errors / destructive
  alertBg: "#FCE9E5",
  progress: "#B7791F",  // in progress
  progressBg: "#FBF0D9",
  ok: "#14805E",        // resolved / success
  okBg: "#DDF3EA",
  white: "#FFFFFF",
};

export const radius = { sm: 8, md: 12, lg: 16 };

export const statusStyle = {
  Pending: { fg: colors.alert, bg: colors.alertBg, icon: "alert-circle" },
  "In Progress": { fg: colors.progress, bg: colors.progressBg, icon: "construct" },
  Resolved: { fg: colors.ok, bg: colors.okBg, icon: "checkmark-circle" },
};

export const roleMeta = {
  super_admin: { label: "Super admin", color: "#D32F2F" },
  admin: { label: "Admin", color: "#F57C00" },
  technician: { label: "Technician", color: "#1976D2" },
  viewer: { label: "Viewer", color: "#388E3C" },
};

export const ISSUE_TYPES = [
  "Cash not dispensed",
  "Card stuck",
  "Screen not working",
  "Keypad not responding",
  "Network issue",
  "Other",
];
