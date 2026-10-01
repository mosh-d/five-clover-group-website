"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoStatsChartOutline, IoRefreshOutline } from "react-icons/io5";
import PageHeading from "@/components/admin/PageHeading";
import { fetchBranches, fetchHqMetric, HqApiError } from "@/lib/hq-api";
import { textColorStyle, mutedTextStyle, bodyText, errorBoxClass, cardBg } from "@/components/admin/adminStyles";
import { METRIC_TABS, findTab, findMetric, tabOfMetric } from "./catalog";
import { METRIC_VIEWS } from "./views";
import { HowCounted, Choice } from "./parts";
import { RANGE_PRESETS, presetRange, periodText } from "./format";

// The HQ Metrics page (owner, 2026-10-01): five tabs like the branch Reports
// page, and under each a sub-menu (a dropdown on smaller screens) to pick
// one metric at a time. Tab, metric, dates and branch live in the address,
// so a view can be bookmarked or shared and survives a refresh.
//
// Fetched when the choice changes and on Refresh - no polling. While new
// figures load, the last ones stay on screen, faded, rather than flashing
// empty.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 366;
const daysBetween = (from, to) => Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000) + 1;

const labelClass = "text-lg font-semibold uppercase tracking-wide";
const fieldClass = "border rounded-lg px-4 py-2.5 text-xl";
const fieldStyle = { borderColor: "var(--accent-2)", backgroundColor: cardBg, ...textColorStyle };

export default function MetricsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const metricParam = params.get("metric");
  const tab = findTab(params.get("tab") || tabOfMetric(metricParam));
  const metric = findMetric(tab.key, metricParam);
  const fallback = presetRange("last-30");
  const from = ISO_DATE.test(params.get("from") || "") ? params.get("from") : fallback.from;
  const to = ISO_DATE.test(params.get("to") || "") ? params.get("to") : fallback.to;
  const branch = metric.branchFilter ? params.get("branch") || "" : "";
  const rangeError = metric.snapshot
    ? null
    : from > to
      ? "The start date is after the end date."
      : daysBetween(from, to) > MAX_DAYS
        ? "Pick a range of a year or less."
        : null;

  const [branches, setBranches] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState({ key: null, metric: null, data: null, error: null });

  const go = (changes) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    router.replace(`/hq/metrics?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    fetchBranches()
      .then((list) => setBranches((list || []).map((b) => ({ value: String(b.id), label: b.name })).sort((a, b) => a.label.localeCompare(b.label))))
      .catch(() => setBranches([]));
  }, []);

  const queryKey = [metric.key, metric.snapshot ? "" : `${from}|${to}`, branch, refresh].join("|");
  useEffect(() => {
    if (rangeError) return undefined;
    let cancelled = false;
    const query = metric.snapshot ? { branch_id: branch } : { from, to, branch_id: branch };
    fetchHqMetric(metric.key, query)
      .then((data) => {
        if (!cancelled) setResult({ key: queryKey, metric: metric.key, data, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof HqApiError ? err.message : "Could not reach the server to load this metric. Check your connection and try again.";
        setResult({ key: queryKey, metric: metric.key, data: null, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, rangeError, metric.key, metric.snapshot, from, to, branch]);

  const fresh = result.key === queryKey ? result : null;
  // The last figures for this same metric stay up, faded, while new ones load.
  const shown = fresh || (result.metric === metric.key && result.data ? result : null);
  const loading = !fresh && !rangeError;
  const View = METRIC_VIEWS[metric.key];

  return (
    <div className="w-full flex flex-col gap-8">
      <div>
        <PageHeading icon={IoStatsChartOutline}>Metrics</PageHeading>
        <p className={`${bodyText} mt-2`} style={mutedTextStyle}>
          Every branch side by side, one metric at a time, worked out the same way as the branches&apos; own reports.
        </p>
      </div>

      <div className="flex gap-3 text-xl flex-wrap" role="tablist" aria-label="Metric groups">
        {METRIC_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tab.key}
            onClick={() => go({ tab: t.key, metric: t.metrics[0].key, branch: "" })}
            className={`px-6 py-3 rounded-lg font-bold cursor-pointer transition-all ${
              t.key === tab.key ? "bg-[color:var(--emphasis)] text-white" : "bg-black/4 text-[color:var(--text-color)] hover:bg-black/8"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <p className={bodyText} style={mutedTextStyle}>{tab.blurb}</p>
        <nav aria-label={`${tab.label} metrics`} className="hidden lg:flex flex-wrap gap-2">
          {tab.metrics.map((m) => {
            const active = m.key === metric.key;
            return (
              <button
                key={m.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => go({ tab: tab.key, metric: m.key, branch: "" })}
                className={`rounded-full border px-5 py-2 text-xl font-semibold cursor-pointer transition-colors ${active ? "text-white" : "hover:bg-black/5"}`}
                style={active ? { background: "var(--text-color)", borderColor: "var(--text-color)" } : { borderColor: "var(--accent-2)", ...textColorStyle }}
              >
                {m.label}
              </button>
            );
          })}
        </nav>
        <label htmlFor="metric-select" className="lg:hidden flex flex-col gap-1">
          <span className={labelClass} style={mutedTextStyle}>Metric</span>
          <select
            id="metric-select"
            value={metric.key}
            onChange={(e) => go({ tab: tab.key, metric: e.target.value, branch: "" })}
            className={`${fieldClass} font-semibold`}
            style={fieldStyle}
          >
            {tab.metrics.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {metric.snapshot ? (
          <p className={`${bodyText} self-center`} style={mutedTextStyle}>
            {metric.key === "top-guests" ? "All time" : "As things stand right now"} - the dates don&apos;t apply to this one.
          </p>
        ) : (
          <>
            <div role="group" aria-label="Quick dates" className="flex flex-wrap gap-2">
              {RANGE_PRESETS.map((p) => {
                const r = presetRange(p.key);
                const active = r.from === from && r.to === to;
                return (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => go({ from: r.from, to: r.to })}
                    className={`rounded-lg border px-4 py-2.5 text-xl font-semibold cursor-pointer transition-colors ${active ? "" : "hover:bg-black/5"}`}
                    style={active ? { borderColor: "var(--emphasis)", background: "hsla(38, 49%, 51%, 0.14)", ...textColorStyle } : { borderColor: "var(--accent-2)", ...textColorStyle }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <label htmlFor="metric-from" className="flex flex-col gap-1">
              <span className={labelClass} style={mutedTextStyle}>From</span>
              <input
                id="metric-from"
                type="date"
                value={from}
                onChange={(e) => ISO_DATE.test(e.target.value) && go({ from: e.target.value })}
                className={fieldClass}
                style={fieldStyle}
              />
            </label>
            <label htmlFor="metric-to" className="flex flex-col gap-1">
              <span className={labelClass} style={mutedTextStyle}>To</span>
              <input
                id="metric-to"
                type="date"
                value={to}
                onChange={(e) => ISO_DATE.test(e.target.value) && go({ to: e.target.value })}
                className={fieldClass}
                style={fieldStyle}
              />
            </label>
          </>
        )}
        {metric.branchFilter && (
          <Choice id="metric-branch" label="Branch" value={branch} onChange={(v) => go({ branch: v })} options={[{ value: "", label: "All branches" }, ...branches]} />
        )}
        <button
          type="button"
          onClick={() => setRefresh((n) => n + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xl font-semibold cursor-pointer hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: "var(--accent-2)", ...textColorStyle }}
        >
          <IoRefreshOutline aria-hidden="true" />
          {loading && shown ? "Updating..." : "Refresh"}
        </button>
      </div>

      <section aria-labelledby="metric-title" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 id="metric-title" className="text-3xl font-bold" style={textColorStyle}>{metric.label}</h2>
          <p className={bodyText} style={mutedTextStyle}>
            {metric.about}
            {shown?.data?.period && !metric.snapshot ? ` ${periodText(shown.data.period)}.` : ""}
          </p>
        </div>

        {rangeError && <p className={errorBoxClass} role="alert">{rangeError}</p>}
        {fresh?.error && <p className={errorBoxClass} role="alert">{fresh.error}</p>}
        {!rangeError && !shown && !fresh?.error && <p className={bodyText} style={mutedTextStyle}>Loading...</p>}
        {!rangeError && shown?.data && View && (
          <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
            <View key={metric.key} data={shown.data} branchOptions={branches} />
          </div>
        )}

        <HowCounted>{metric.how}</HowCounted>
      </section>
    </div>
  );
}
