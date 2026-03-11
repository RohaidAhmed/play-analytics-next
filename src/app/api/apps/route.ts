/**
 * app/api/apps/route.ts
 * GET /api/apps
 *
 * Returns all Android apps in the Play Console developer account.
 * Reads from Google Play Developer API (server-side only).
 */

import { NextResponse } from "next/server";
import { fetchApps, GCS_BUCKET_BASE } from "@/lib/playApi";
import type { ApiResult, AppsPayload } from "@/types";

export const dynamic = "force-dynamic"; // never cache — always fresh

export async function GET(): Promise<NextResponse<ApiResult<AppsPayload>>> {
    try {
        const accountId = requireEnv("PLAY_DEVELOPER_ACCOUNT_ID");
        const apps = await fetchApps(accountId);

        return NextResponse.json({
            ok: true,
            data: {
                apps,
                storageUriBase: `${GCS_BUCKET_BASE}_${accountId}/stats`,
            },
        } satisfies ApiResult<AppsPayload>);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[/api/apps]", err);
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