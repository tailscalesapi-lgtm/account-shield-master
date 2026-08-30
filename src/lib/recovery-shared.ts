export const RECOVERY_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "failed",
] as const;

export type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  failed: "Unrecoverable",
};

export const SERVICE_TYPES = [
  { value: "office", label: "Microsoft Office document" },
  { value: "libreoffice", label: "LibreOffice / OpenDocument" },
  { value: "archive", label: "ZIP / RAR archive" },
  { value: "pdf", label: "PDF document" },
  { value: "other", label: "Other file type" },
] as const;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
