import { MEDICAL_DISCLAIMER } from "@/lib/types";

export function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "text-sm text-muted-foreground" : "text-muted-foreground"}>
      {MEDICAL_DISCLAIMER}
    </p>
  );
}
