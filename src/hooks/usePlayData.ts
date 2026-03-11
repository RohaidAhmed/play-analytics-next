"use client";

import { useState, useEffect, useCallback } from "react";
import type { AppAnalytics, AppsPayload, GcsPreviewPayload, PlayApp } from "@/types";
import { getAnalytics, getApps, getGcsPreview } from "@/lib/api";
import { getMockAnalytics, getMockAppsPayload } from "@/lib/mockData";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ── Generic async hook ────────────────────────────────────────────────────────

interface Async<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[]): Async<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rev, setRev] = useState(0);

    const refetch = useCallback(() => setRev(r => r + 1), []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        fetcher()
            .then(d => { if (active) { setData(d); setLoading(false); } })
            .catch(e => { if (active) { setError(e instanceof Error ? e.message : String(e)); setLoading(false); } });
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, rev]);

    return { data, loading, error, refetch };
}

// ── Public hooks ──────────────────────────────────────────────────────────────

export function useApps(): Async<AppsPayload> {
    return useAsync<AppsPayload>(async () => {
        if (USE_MOCK) { await delay(300); return getMockAppsPayload(); }
        return getApps();
    }, []);
}

export function useAnalytics(app: PlayApp | null): Async<AppAnalytics> {
    return useAsync<AppAnalytics>(async () => {
        if (!app) throw new Error("No app selected");
        if (USE_MOCK) { await delay(450); return getMockAnalytics(app.packageName); }
        return getAnalytics(app.packageName);
    }, [app?.packageName]);
}

export function useGcsPreview(uri: string | null): Async<GcsPreviewPayload> {
    return useAsync<GcsPreviewPayload>(async () => {
        if (!uri) throw new Error("No URI");
        if (USE_MOCK) {
            await delay(250);
            return {
                uri,
                headers: ["Date", "Package Name", "Daily Device Installs", "Daily Device Uninstalls", "Total Device Installs"],
                rows: Array.from({ length: 10 }, (_, i) => [
                    `2024-${String(i + 1).padStart(2, "0")}-01`,
                    uri.split("/").pop()?.replace(/_installs\.csv$/, "").replace(/_/g, ".") ?? "com.example.app",
                    String(Math.round(800 + Math.random() * 400)),
                    String(Math.round(50 + Math.random() * 60)),
                    String(Math.round(10000 + i * 800)),
                ]),
                total: 365,
            };
        }
        return getGcsPreview(uri);
    }, [uri]);
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));