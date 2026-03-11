import type { ReactNode } from "react";

export function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <div className="section-title">
            <div className="section-bar" />
            <span>{children}</span>
        </div>
    );
}

export function ChartCard({ title, uri, children }: { title: string; uri?: string; children: ReactNode }) {
    return (
        <div className="chart-card">
            <div className="chart-card-header">
                <span className="chart-card-title">{title}</span>
                {uri && (
                    <div className="uri-badge">
                        <span>📦</span>
                        <span className="uri-text">{uri}</span>
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}

export const TOOLTIP_STYLE = {
    background: "#0d1e2e",
    border: "1px solid #1e3a52",
    borderRadius: 8,
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: "#a8d4ee",
} as const;

interface TooltipPayloadItem {
    value?: number | string | null;
    name?: string;
    color?: string;
}

interface TipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string | number;
    prefix?: string;
    suffix?: string;
}

export function CustomTooltip({ active, payload, label, prefix = "", suffix = "" }: TipProps) {
    if (!active || !payload?.length) return null;
    const value = payload[0]?.value;
    return (
        <div style={TOOLTIP_STYLE}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e3a52", color: "#22d3a6" }}>{label}</div>
            <div style={{ padding: "8px 12px" }}>
                {prefix}{typeof value === "number" ? value.toLocaleString() : value ?? 0}{suffix}
            </div>
        </div>
    );
}