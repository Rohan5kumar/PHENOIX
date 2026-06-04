export type HealthState = "healthy" | "degraded" | "critical";

export interface ModelHealthStatus {
  model_id: string;
  accuracy: number;
  drift_detected: boolean;
  drifted_features: string[];
  state: HealthState;
  pipeline_signal?: string | null;
  system_status?: string | null;
  timestamp: string;
}

export const ACCURACY_ALERT_THRESHOLD = 0.85;

export function isAccuracyDegraded(accuracy: number): boolean {
  return accuracy < ACCURACY_ALERT_THRESHOLD;
}
