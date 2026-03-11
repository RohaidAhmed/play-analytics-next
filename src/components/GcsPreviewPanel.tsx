"use client";

import { useState } from "react";
import { useGcsPreview } from "@/hooks/usePlayData";

export default function GcsPreviewPanel({ initialUri }: { initialUri: string }) {
    const [draft, setDraft] = useState(initialUri);
    const [live, setLive] = useState<string | null>(null);
    const { data, loading, error } = useGcsPreview(live);

    return (
        <div className="gcs-panel">
            <div className="gcs-row">
                <span className="gcs-label">GCS URI</span>
                <div className="gcs-divider" />
                <input
                    className="gcs-input"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="gs://pubsite_prod_rev_.../stats/..."
                />
                <button className="gcs-btn" onClick={() => setLive(draft)}>LOAD</button>
            </div>

            {loading && <p className="gcs-status loading">READING FROM STORAGE…</p>}
            {error && <p className="gcs-status error">⚠ {error}</p>}
            {data && !loading && (
                <div className="gcs-table-wrap">
                    <p className="gcs-meta">{data.total} rows · showing first {data.rows.length}</p>
                    <table className="gcs-table">
                        <thead>
                            <tr>{data.headers.map(h => <th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {data.rows.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
                                    {row.map((cell, j) => <td key={j}>{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}