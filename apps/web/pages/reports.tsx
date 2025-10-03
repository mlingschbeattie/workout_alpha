import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import FormWrapper from "../components/FormWrapper";
import { api, API_BASE } from "../lib/api";

// Recharts (CSR only)
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const LineChart           = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line                = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const BarChart            = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar                 = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis               = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis               = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip             = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const CartesianGrid       = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Legend              = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false });

type VolumeRow = { week: string; volume: number };
type Grouped = { seriesKeys: string[]; rows: Array<Record<string, number | string>> };

type Plan = { id: string; name: string; weeks: number; days: any };
type User = {
  id: string;
  name: string;
  role: "ATHLETE" | "COACH" | "ADMIN";
  planId?: string | null;
  planStartDate?: string | null;
  completedDates?: string[];
};

function parseWeekNum(w: string) {
  const m = (w || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}
function daysBetweenUTC(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((db - da) / ms);
}

export default function ReportsPage() {
  // filters
  const [userId, setUserId] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "exercise" | "user">("none");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  // data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [data, setData] = useState<any>([]);
  const [err, setErr] = useState("");

  // compliance snapshot
  const [compliance, setCompliance] = useState<{ expected: number; completed: number; pct: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, u] = await Promise.all([api<Plan[]>("/plans"), api<User[]>("/auth/users")]);
        setPlans(p);
        setUsers(u);
      } catch (e: any) {
        setErr(`Failed to load plans/users: ${e?.message || e}`);
      }
    })();
  }, []);

  async function loadReport() {
    setErr("");
    try {
      const p = new URLSearchParams();
      if (userId) p.append("userId", userId);
      if (planId) p.append("planId", planId);
      if (exerciseId) p.append("exerciseId", exerciseId);
      if (startDate) p.append("startDate", startDate);
      if (endDate) p.append("endDate", endDate);

      if (groupBy === "none") {
        const rows = await api<VolumeRow[]>(`/reports/volume?${p.toString()}`);
        setData(rows);
      } else {
        p.append("groupBy", groupBy);
        const grouped = await api<Grouped>(`/reports/volume?${p.toString()}`);
        setData(grouped);
      }
    } catch (e: any) {
      setErr(`Failed to fetch report: ${e?.message || e}`);
      setData([]);
    }
  }

  const chartData = useMemo(() => {
    if (groupBy === "none") {
      return (data as VolumeRow[])
        .map((d) => ({ week: d.week, volume: Number(d.volume) || 0 }))
        .sort((a, b) => parseWeekNum(a.week) - parseWeekNum(b.week));
    } else {
      const g = data as Grouped;
      return (g?.rows || []);
    }
  }, [data, groupBy]);

  const seriesKeys = groupBy === "none" ? ["volume"] : (data?.seriesKeys || []);

  async function downloadCSV() {
    try {
      const p = new URLSearchParams();
      if (userId) p.append("userId", userId);
      const res = await fetch(`${API_BASE}/reports/export/csv?${p.toString()}`);

      const ctype = res.headers.get("content-type") || "";
      if (ctype.includes("text/csv")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "logs.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        const json = await res.json();
        console.log("CSV fallback (JSON):", json);
        alert("CSV not available; JSON printed to console.");
      }
    } catch (e: any) {
      console.error(e);
      alert(`Download failed: ${e?.message || e}`);
    }
  }

  // compliance calculation when user/plan changes
  useEffect(() => {
    (async () => {
      try {
        setCompliance(null);
        if (!userId) return;

        const u = await api<User>(`/auth/users/${userId}`);
        const plan =
          planId ? plans.find((p) => p.id === planId) : u.planId ? plans.find((p) => p.id === u.planId) : undefined;
        if (!u || !plan || !u.planStartDate) return;

        const totalDaysInPlan = Array.isArray(plan.days) ? plan.days.length : 0;
        if (!totalDaysInPlan || !plan.weeks) return;

        const start = new Date(u.planStartDate);
        const today = new Date();
        const elapsedDays = daysBetweenUTC(start, today) + 1;
        const maxDays = totalDaysInPlan * Math.max(1, plan.weeks);
        const expected = Math.max(0, Math.min(elapsedDays, maxDays));

        const compList = Array.isArray(u.completedDates) ? u.completedDates : [];
        const completed = compList.filter((d) => {
          const dt = new Date(d);
          return (
            dt >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
            dt <= new Date(today.getFullYear(), today.getMonth(), today.getDate())
          );
        }).length;

        const pct = expected > 0 ? Math.min(100, Math.max(0, Math.round((completed / expected) * 100))) : 0;
        setCompliance({ expected, completed, pct });
      } catch {
        // no-op
      }
    })();
  }, [userId, planId, plans]);

  return (
    <div className="ua-container ua-section">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-black/70">Filter by user, plan, exercise, and date. Group results and chart weekly volume.</p>
      </div>

      {err && (
        <div className="ua-card p-4 mb-4 border-red-200 bg-red-50 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Filters */}
      <FormWrapper
        title="Filters"
        description="Pick a user and (optionally) a plan, set your range, and load the report."
        onSubmit={(e) => {
          e.preventDefault();
          loadReport();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-6">
          <select className="ua-select sm:col-span-2" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">(User)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.role}
              </option>
            ))}
          </select>

          <select className="ua-select sm:col-span-2" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">(Plan)</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.weeks}w)
              </option>
            ))}
          </select>

          <input
            className="ua-input"
            placeholder="Exercise ID"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            <input type="date" className="ua-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="ua-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <select className="ua-select" value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
            <option value="none">No Group</option>
            <option value="exercise">By Exercise</option>
            <option value="user">By User</option>
          </select>

          <select className="ua-select" value={chartType} onChange={(e) => setChartType(e.target.value as any)}>
            <option value="line">Line</option>
            <option value="bar">Bar</option>
          </select>

          <div className="flex gap-2 sm:col-span-2">
            <button className="ua-btn ua-btn-primary" type="submit">
              Load
            </button>
            <button className="ua-btn ua-btn-ghost" type="button" onClick={downloadCSV} disabled={!userId}>
              Download CSV
            </button>
          </div>
        </div>
      </FormWrapper>

      {/* Compliance snapshot */}
      <div className="ua-card p-4 mt-4">
        <b>Compliance:&nbsp;</b>
        {userId ? (
          compliance ? (
            <>
              {compliance.completed}/{compliance.expected} days ({compliance.pct}%)
            </>
          ) : (
            <span className="text-black/60">Select a user with a plan + start date to compute.</span>
          )
        ) : (
          <span className="text-black/60">Select a user</span>
        )}
      </div>

      {/* Chart */}
      <div className="ua-card p-4 mt-4">
        <div className="h-[340px] w-full">
          {!chartData || chartData.length === 0 ? (
            <div className="text-black/60 p-3">No data yet. Set filters and click <b>Load</b>.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {seriesKeys.map((k) => (
                    <Line key={k} type="monotone" dataKey={k} name={k} dot />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {seriesKeys.map((k) => (
                    <Bar key={k} dataKey={k} name={k} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="ua-card p-4 mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {groupBy === "none" ? (
                <>
                  <th className="py-2 text-left">Week</th>
                  <th className="py-2 text-left">Volume</th>
                </>
              ) : (
                <>
                  <th className="py-2 text-left">Week</th>
                  {seriesKeys.map((k) => (
                    <th key={k} className="py-2 text-left">
                      {k}
                    </th>
                  ))}
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {groupBy === "none"
              ? (chartData as any[]).map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{r.week}</td>
                    <td className="py-2">{r.volume}</td>
                  </tr>
                ))
              : (chartData as any[]).map((r: any, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{r.week}</td>
                    {seriesKeys.map((k) => (
                      <td key={k} className="py-2">
                        {r[k] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
            {!chartData?.length && (
              <tr>
                <td className="py-6 text-center text-black/60" colSpan={seriesKeys.length + 1}>
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

