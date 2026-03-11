/**
 * app/api/gcs-preview/route.ts
 * GET /api/gcs-preview?uri=gs://...
 *
 * Server-side proxy that reads a GCS CSV export file and returns its rows
 * as JSON. Credentials never leave the server.
 */

import { NextRequest, NextResponse } from "next/server";
import { readGcsCsv } from "@/lib/playApi";
import type { ApiResult, GcsPreviewPayload } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResult<GcsPreviewPayload>>> {
    const uri = req.nextUrl.searchParams.get("uri");

    if (!uri) {
        return NextResponse.json(
            { ok: false, error: "uri query param is required" } satisfies ApiResult<never>,
            { status: 400 },
        );
    }

    if (!uri.startsWith("gs://")) {
        return NextResponse.json(
            { ok: false, error: "uri must begin with gs://" } satisfies ApiResult<never>,
            { status: 400 },
        );
    }

    try {
        const allRows = await readGcsCsv(uri);
        const headers = allRows[0] ?? [];
        const dataRows = allRows.slice(1, 101); // cap preview at 100 rows

        return NextResponse.json({
            ok: true,
            data: { uri, headers, rows: dataRows, total: allRows.length - 1 },
        } satisfies ApiResult<GcsPreviewPayload>);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[/api/gcs-preview]", err);
        return NextResponse.json(
            { ok: false, error: message } satisfies ApiResult<never>,
            { status: 500 },
        );
    }
}