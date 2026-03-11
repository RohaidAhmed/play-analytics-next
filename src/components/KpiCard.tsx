interface Props { label: string; value: string; delta?: string; icon: string }

export default function KpiCard({ label, value, delta, icon }: Props) {
    return (
        <div className="kpi-card">
            <div className="kpi-glow" />
            <span className="kpi-icon">{icon}</span>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{value}</span>
            {delta && <span className="kpi-delta">↑ {delta} vs prev period</span>}
        </div>
    );
}