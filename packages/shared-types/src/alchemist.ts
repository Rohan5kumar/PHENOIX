export interface AlchemistAction {
  diversity_score: number;
  bias_check_result: string;
  drifted_features: string[];
  row_count: number;
  batch_path: string;
  timestamp: string;
}
