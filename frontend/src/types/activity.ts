export type ActivityType = "fixed" | "single";
export type Priority = "low" | "medium" | "high";

export type Activity = {
  id: number;
  title: string;
  description: string;
  startTime: string;
  durationMinutes: number;
  type: ActivityType;
  date?: string;
  weekdays: number[];
  color?: string;
  category?: string;
  priority: Priority;
  completed: boolean;
  completedDates: string[];
  createdAt: string;
  updatedAt: string;
};

export type ActivityOccurrence = {
  activity: Activity;
  occurrenceDate: string;
  weekday: number;
  completed: boolean;
};

export type WeekStats = {
  total: number;
  completed: number;
  completionRate: number;
  totalMinutes: number;
};

export type WeekResponse = {
  weekStart: string;
  weekEnd: string;
  occurrences: ActivityOccurrence[];
  categories: string[];
  stats: WeekStats;
};

export type ActivityPayload = {
  title: string;
  description: string;
  startTime: string;
  durationMinutes: number;
  type: ActivityType;
  date?: string;
  weekdays: number[];
  color?: string;
  category?: string;
  priority: Priority;
};
