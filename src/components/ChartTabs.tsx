"use client";

import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    PieChart, Pie, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { ChartCard, CustomTooltip, TOOLTIP_STYLE } from "./ChartHelpers";
import type { AppAnalytics } from "@/types";

// ── Installs ──────────────────────────────────────────────────────────────────

export function InstallsTab({ data }: { data: AppAnalytics }) {
    const combined = data.installs.map((d, i) => ({
        month: d.month, installs: d.value, active: data.activeUsers[i]?.value ?? 0,
    }));
    return (
        <div className="tab-grid">
            <ChartCard title="Monthly Installs" uri={data.storageUri}>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.installs}>
                        <defs>
                            <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22d3a6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#22d3a6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d40" />
                        <XAxis dataKey="month" tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <YAxis tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#22d3a6" fill="url(#ig)" strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly Active Users" uri={data.storageUri.replace("installs", "active_users")}>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.activeUsers}>
                        <defs>
                            <linearGradient id="aug" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d40" />
                        <XAxis dataKey="month" tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <YAxis tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#aug)" strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            <div className="col-span-2">
                <ChartCard title="Installs vs Active Users" uri={data.storageUri}>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={combined}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a2d40" />
                            <XAxis dataKey="month" tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                            <YAxis tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1a2d4040" }} />
                            <Legend wrapperStyle={{ fontFamily: "Space Mono", fontSize: 10, color: "#4a7fa5" }} />
                            <Bar dataKey="installs" fill="#22d3a6" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="active" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// ── Ratings ───────────────────────────────────────────────────────────────────

export function RatingsTab({ data }: { data: AppAnalytics }) {
    return (
        <div className="tab-grid">
            <ChartCard title="Average Rating Trend" uri={data.storageUri.replace("installs", "ratings")}>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.ratings}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d40" />
                        <XAxis dataKey="month" tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <YAxis domain={[1, 5]} tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <Tooltip content={<CustomTooltip suffix=" ★" />} />
                        <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Review Score Breakdown" uri={data.storageUri.replace("installs", "reviews")}>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie data={data.reviewBreakdown} cx="50%" cy="50%"
                            innerRadius={55} outerRadius={90} dataKey="count" nameKey="stars" paddingAngle={3}>
                            {data.reviewBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontFamily: "Space Mono", fontSize: 10, color: "#4a7fa5" }}
                            formatter={v => <span style={{ color: "#a8cce0" }}>{v}</span>} />
                    </PieChart>
                </ResponsiveContainer>
            </ChartCard>

            <div className="col-span-2">
                <ChartCard title="Review Count by Star Rating" uri={data.storageUri.replace("installs", "reviews_breakdown")}>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.reviewBreakdown} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a2d40" />
                            <XAxis type="number" tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                            <YAxis dataKey="stars" type="category" width={30} tick={{ fill: "#a8cce0", fontSize: 11, fontFamily: "Space Mono" }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1a2d4040" }} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                {data.reviewBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// ── Revenue ───────────────────────────────────────────────────────────────────

export function RevenueTab({ data }: { data: AppAnalytics }) {
    const corr = data.revenue.map((d, i) => ({
        month: d.month, revenue: d.value,
        installs: Math.round((data.installs[i]?.value ?? 0) / 100),
    }));
    return (
        <div className="tab-grid">
            <ChartCard title="Monthly Revenue ($)" uri={data.storageUri.replace("installs", "revenue")}>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.revenue}>
                        <defs>
                            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d40" />
                        <XAxis dataKey="month" tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <YAxis tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <Tooltip content={<CustomTooltip prefix="$" />} />
                        <Area type="monotone" dataKey="value" stroke="#a78bfa" fill="url(#rg)" strokeWidth={2.5} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Revenue vs Installs" uri={data.storageUri.replace("installs", "revenue_correlation")}>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={corr}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2d40" />
                        <XAxis dataKey="month" tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <YAxis tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#1e3a52" }} />
                        <Legend wrapperStyle={{ fontFamily: "Space Mono", fontSize: 10, color: "#4a7fa5" }} />
                        <Line type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="installs" stroke="#22d3a6" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            <div className="col-span-2">
                <ChartCard title="Monthly Revenue Bars" uri={data.storageUri.replace("installs", "revenue_monthly")}>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.revenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a2d40" />
                            <XAxis dataKey="month" tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                            <YAxis tick={{ fill: "#3b7ea6", fontSize: 10, fontFamily: "Space Mono" }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1a2d4040" }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {data.revenue.map((_, i) => <Cell key={i} fill={`hsl(${260 + i * 5},70%,${55 + i * 2}%)`} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}