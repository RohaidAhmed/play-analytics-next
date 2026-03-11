/**
 * app/api/analytics/route.ts
 * GET /api/analytics?packageName=<pkg>
 *
 * Returns full analytics bundle for a single app:
 *   installs, activeUsers, revenue, ratings, reviewBreakdown, kpis, storageUri
 */

import { NextRequest, NextResponse } from "next/server";
import { buildAppAnalytics, fetchApps } from "@/lib/playApi";
import type { ApiResult, AppAnalytics } from "@/types";

export const dynamic = "force-dynamic";

// Revalidate cached responses every 6 hours on the server
export const revalidate = 21600;

export async function GET(req: NextRequest): Promise<NextResponse<ApiResult<AppAnalytics>>> {
    const packageName = req.nextUrl.searchParams.get("packageName");

    if (!packageName) {
        return NextResponse.json(
            { ok: false, error: "packageName query param is required" } satisfies ApiResult<never>,
            { status: 400 },
        );
    }

    try {
        const accountId = requireEnv("PLAY_DEVELOPER_ACCOUNT_ID");

        // Resolve app metadata first
        const allApps = await fetchApps(accountId);
        const app = allApps.find(a => a.packageName === packageName);

        if (!app) {
            return NextResponse.json(
                { ok: false, error: `App '${packageName}' not found in account` } satisfies ApiResult<never>,
                { status: 404 },
            );
        }

        const analytics = await buildAppAnalytics(app, accountId);

        return NextResponse.json(
            { ok: true, data: analytics } satisfies ApiResult<AppAnalytics>,
            {
                headers: {
                    // Cache at CDN layer for 6 hours, stale-while-revalidate for 1 day
                    "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
                },
            },
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[/api/analytics]", err);
        return NextResponse.json(
            { ok: false, error: message } satisfies ApiResult<never>,
            { status: 500 },
        );
    }
}

function requireEnv(key: string): string {
    const val = process.env[key];
    if (!val) throw new Error(`Missing env var: ${key}`);
    return val;
}