"use client";

import { useState } from "react";
import type { PlayApp } from "@/types";
import { useApps, useAnalytics } from "@/hooks/usePlayData";
import KpiCard from "@/components/KpiCard";
import { SectionTitle } from "@/components/ChartHelpers";
import GcsPreviewPanel from "@/components/GcsPreviewPanel";
import { InstallsTab, RatingsTab, RevenueTab } from "@/components/ChartTabs";

type Tab = "installs" | "ratings" | "revenue";

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "installs", label: "Installs", icon: "📲" },
    { id: "ratings", label: "Ratings", icon: "⭐" },
    { id: "revenue", label: "Revenue", icon: "💰" },
];

export default function Dashboard() {
    const { data: appsData, loading: appsLoading, error: appsError } = useApps();
    const [selected, setSelected] = useState<PlayApp | null>(null);
    const [tab, setTab] = useState<Tab>("installs");

    const apps = appsData?.apps ?? [];
    const effectiveApp = selected ?? apps[0] ?? null;
    const { data: analytics, loading: analyticsLoading, error: analyticsError } = useAnalytics(effectiveApp);

    return (
        <main className="dash-root">
            {/* Header */}
            <header className="dash-header">
                <div className="dash-brand">
                    <div className="brand-icon">▶</div>
                    <div>
                        <p className="brand-name">Play Analytics</p>
                        <p className="brand-sub">GOOGLE PLAY CONSOLE · NEXT.JS API ROUTES · GCS STORAGE URI</p>
                    </div>
                </div>
                <div className="live-pill">
                    <span className="live-dot" />
                    <span>LIVE</span>
                </div>
            </header>

            <div className="dash-body">
                {/* Error banner */}
                {appsError && <div className="error-banner">⚠ Failed to load apps: {appsError}</div>}

                {/* App selector */}
                <div className="app-selector">
                    {appsLoading
                        ? [0, 1, 2].map(i => <div key={i} className="app-pill-skeleton" />)
                        : apps.map(app => {
                            const active = effectiveApp?.packageName === app.packageName;
                            return (
                                <button key={app.packageName}
                                    className={`app-pill ${active ? "active" : ""}`}
                                    onClick={() => setSelected(app)}>
                                    <span className="app-icon">{app.icon}</span>
                                    <div>
                                        <p className="app-title">{app.title}</p>
                                        <p className="app-cat">{app.category}</p>
                                    </div>
                                    {active && <span className="app-dot">●</span>}
                                </button>
                            );
                        })
                    }
                </div>

                {/* GCS URI preview */}
                {analytics && <GcsPreviewPanel initialUri={analytics.storageUri} />}

                {/* Loading spinner */}
                {analyticsLoading && (
                    <div className="spinner-wrap">
                        <div className="spinner" />
                        <span className="spinner-label">LOADING DATA…</span>
                    </div>
                )}

                {/* Analytics error */}
                {analyticsError && !analyticsLoading && (
                    <div className="error-banner">⚠ Failed to load analytics: {analyticsError}</div>
                )}

                {/* Dashboard content */}
                {analytics && !analyticsLoading && (
                    <div className="analytics-fade">
                        {/* KPIs */}
                        <SectionTitle>Key Metrics · {analytics.app.title}</SectionTitle>
                        <div className="kpi-grid">
                            <KpiCard label="Total Installs" value={analytics.kpis.totalInstalls} delta="8.4%" icon="📲" />
                            <KpiCard label="Avg Rating" value={`${analytics.kpis.avgRating} / 5`} delta="0.2" icon="⭐" />
                            <KpiCard label="Total Revenue" value={analytics.kpis.totalRevenue} delta="12.1%" icon="💰" />
                            <KpiCard label="Daily Active" value={analytics.kpis.dau} delta="5.3%" icon="👥" />
                            <KpiCard label="D7 Retention" value={analytics.kpis.retentionD7} icon="🔄" />
                            <KpiCard label="Review Count" value={analytics.kpis.reviewCount} delta="3.7%" icon="💬" />
                        </div>

                        {/* Tabs */}
                        <div className="tab-bar">
                            {TABS.map(t => (
                                <button key={t.id}
                                    className={`tab-btn ${tab === t.id ? "active" : ""}`}
                                    onClick={() => setTab(t.id)}>
                                    <span>{t.icon}</span>{t.label}
                                </button>
                            ))}
                        </div>

                        {tab === "installs" && <InstallsTab data={analytics} />}
                        {tab === "ratings" && <RatingsTab data={analytics} />}
                        {tab === "revenue" && <RevenueTab data={analytics} />}
                    </div>
                )}

                {/* Footer */}
                <footer className="dash-footer">
                    <span>PLAY ANALYTICS · NEXT.JS 14 · GCS STORAGE URI</span>
                    <span>{effectiveApp?.packageName}</span>
                </footer>
            </div>
        </main>
    );
}