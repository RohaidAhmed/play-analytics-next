/**
 * lib/api.ts  — CLIENT SIDE
 * Typed fetch helpers for the Next.js API routes.
 */

import type { ApiResult, AppAnalytics, AppsPayload, GcsPreviewPayload } from "@/types";

async function apiFetch<T>(path: string): Promise<T> {
    const res = await fetch(path);
    const json = (await res.json()) as ApiResult<T>;
    if (!json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
    return json.data;
}

export const getApps = () => apiFetch<AppsPayload>("/api/apps");
export const getAnalytics = (pkg: string) =>
    apiFetch<AppAnalytics>(`/api/analytics?packageName=${encodeURIComponent(pkg)}`);
export const getGcsPreview = (uri: string) =>
    apiFetch<GcsPreviewPayload>(`/api/gcs-preview?uri=${encodeURIComponent(uri)}`);