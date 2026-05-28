export type StudySubtopic = {
  id: number;
  topicId: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StudyTopic = {
  id: number;
  title: string;
  description?: string;
  subtopics: StudySubtopic[];
  totalSubtopics: number;
  completedCount: number;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
};

export type StudyTopicPayload = {
  title: string;
  description?: string;
};

export type StudySubtopicPayload = {
  title: string;
  description?: string;
};
