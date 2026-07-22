
export interface PizzaData {
  industry?: string;
  work_setup_category?: string;
  work_setup?: {
    onsite_pct: number;
    hybrid_pct: number;
    remote_pct: number;
  };
  focus_hours?: number;
  meeting_overhead?: number;
  pizza_party_index?: number;
  age_group?: string;
  gender?: string;
  collaboration_score?: number;
  review_turnaround_hours?: number;
  [key: string]: any;
}
