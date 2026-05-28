import type { Activity, ActivityPayload, WeekResponse } from "@/types/activity";
import type { StudySubtopicPayload, StudyTopic, StudyTopicPayload } from "@/types/study";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const CACHE_PREFIX = "myroutine:week:";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Erro inesperado" }));
    throw new Error(payload.error ?? "Erro inesperado");
  }

  return response.json() as Promise<T>;
}

export async function listWeek(weekStart: string, query: string, category: string) {
  const params = new URLSearchParams({ weekStart });
  if (query.trim()) params.set("query", query.trim());
  if (category !== "all") params.set("category", category);
  const cacheKey = `${CACHE_PREFIX}${params.toString()}`;

  try {
    const data = await request<WeekResponse>(`/activities?${params.toString()}`);
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (error) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as WeekResponse;
    throw error;
  }
}

export function createActivity(payload: ActivityPayload) {
  return request<Activity>("/activities", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateActivity(id: number, payload: ActivityPayload) {
  return request<Activity>(`/activities/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteActivity(id: number) {
  return request<{ ok: boolean }>(`/activities/${id}`, { method: "DELETE" });
}

export function deleteAllActivities() {
  return request<{ ok: boolean }>("/activities", { method: "DELETE" });
}

export function completeOccurrence(id: number, date: string, completed: boolean) {
  return request<Activity>(`/activities/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ date, completed }),
  });
}

export function moveOccurrence(id: number, date: string, weekday: number, fromWeekday: number, startTime: string) {
  return request<Activity>(`/activities/${id}/move`, {
    method: "PATCH",
    body: JSON.stringify({ date, weekday, fromWeekday, startTime }),
  });
}

export function listStudyTopics() {
  return request<StudyTopic[]>("/study/topics");
}

export function createStudyTopic(payload: StudyTopicPayload) {
  return request<StudyTopic>("/study/topics", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createStudySubtopic(topicId: number, payload: StudySubtopicPayload) {
  return request<StudyTopic>(`/study/topics/${topicId}/subtopics`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function completeStudySubtopic(id: number, completed: boolean) {
  return request<StudyTopic>(`/study/subtopics/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export function deleteStudyTopic(id: number) {
  return request<{ ok: boolean }>(`/study/topics/${id}`, { method: "DELETE" });
}

export function deleteStudySubtopic(id: number) {
  return request<StudyTopic>(`/study/subtopics/${id}`, { method: "DELETE" });
}
