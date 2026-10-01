"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoStatsChartOutline, IoRefreshOutline } from "react-icons/io5";
import PageHeading from "@/components/pms/PageHeading";
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import { page, field } from "@/components/pms/ui";
import { fetchBranches, fetchHqMetric } from "@/lib/pms/api/hq-api";
import { PmsApiError } from "@/lib/pms/client";
import { METRIC_TABS, findTab, findMetric, tabOfMetric } from "./catalog";
import { METRIC_VIEWS } from "./views";
import { HowCounted, Choice } from "./parts";
import { RANGE_PRESETS, presetRange, periodText } from "./format";

// Metrics (Head Office, owner 2026-10-01): five tabs like a branch's Reports
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
    router.replace(`/pms/metrics?${next.toString()}`, { scroll: false });
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
        const message = err instanceof PmsApiError ? err.message : "Could not reach the server to load this metric. Check your connection and try again.";
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
    <div className={page.wrap}>
      <div>
        <PageHeading icon={IoStatsChartOutline}>Metrics</PageHeading>
        <p className={`text-2xl mt-2 ${page.muted}`}>
          Every branch side by side, one metric at a time, worked out the same way as the branches&apos; own reports.
        </p>
      </div>

      <div className="w-full flex flex-col gap-6">
        <div className="flex gap-3 text-xl flex-wrap" role="tablist" aria-label="Metric groups">
          {METRIC_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === tab.key}
              onClick={() => go({ tab: t.key, metric: t.metrics[0].key, branch: "" })}
              className={`px-6 py-3 rounded-lg font-bold cursor-pointer transition-all ${
                t.key === tab.key ? "bg-(--emphasis) text-white" : "bg-black/4 text-(--text-color) hover:bg-black/8"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className={`text-xl ${page.muted}`}>{tab.blurb}</p>
        <nav aria-label={`${tab.label} metrics`} className="hidden lg:flex flex-wrap gap-2">
          {tab.metrics.map((m) => {
            const active = m.key === metric.key;
            return (
              <button
                key={m.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => go({ tab: tab.key, metric: m.key, branch: "" })}
                className={`rounded-full border px-5 py-2 text-xl font-semibold cursor-pointer transition-colors ${
                  active ? "bg-(--text-color) border-(--text-color) text-white" : "border-(--accent-2) text-(--text-color) hover:bg-black/5"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </nav>
        <div className="lg:hidden flex flex-col gap-2">
          <label htmlFor="metric-select" className={field.label}>Metric</label>
          <select
            id="metric-select"
            value={metric.key}
            onChange={(e) => go({ tab: tab.key, metric: e.target.value, branch: "" })}
            className={`${field.select} w-full font-semibold`}
          >
            {tab.metrics.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full flex flex-wrap items-end gap-4">
        {metric.snapshot ? (
          <p className={`text-xl self-center ${page.muted}`}>
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
                    className={`rounded-lg border px-4 py-3 text-xl font-semibold cursor-pointer transition-colors text-(--text-color) ${
                      active ? "border-(--emphasis) bg-[color-mix(in_srgb,var(--emphasis)_14%,var(--card))]" : "border-(--accent-2) bg-(--card) hover:bg-black/5"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="metric-from" className={field.label}>From</label>
              <input
                id="metric-from"
                type="date"
                value={from}
                onChange={(e) => ISO_DATE.test(e.target.value) && go({ from: e.target.value })}
                className={`${field.input} w-auto`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="metric-to" className={field.label}>To</label>
              <input
                id="metric-to"
                type="date"
                value={to}
                onChange={(e) => ISO_DATE.test(e.target.value) && go({ to: e.target.value })}
                className={`${field.input} w-auto`}
              />
            </div>
          </>
        )}
        {metric.branchFilter && (
          <Choice id="metric-branch" label="Branch" value={branch} onChange={(v) => go({ branch: v })} options={[{ value: "", label: "All branches" }, ...branches]} />
        )}
        <button
          type="button"
          onClick={() => setRefresh((n) => n + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-(--accent-2) bg-(--card) px-4 py-3 text-xl font-semibold cursor-pointer text-(--text-color) hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && shown ? <LoadingSpinner size="sm" /> : <IoRefreshOutline aria-hidden="true" />}
          Refresh
        </button>
      </div>

      <section aria-labelledby="metric-title" className="w-full flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 id="metric-title" className={page.sectionTitle}>{metric.label}</h2>
          <p className={`text-xl ${page.muted}`}>
            {metric.about}
            {shown?.data?.period && !metric.snapshot ? ` ${periodText(shown.data.period)}.` : ""}
          </p>
        </div>

        {rangeError && <p className={field.error} role="alert">{rangeError}</p>}
        {fresh?.error && <p className={field.error} role="alert">{fresh.error}</p>}
        {!rangeError && !shown && !fresh?.error && (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        )}
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
