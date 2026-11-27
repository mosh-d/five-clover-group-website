"use client";
"use no memo";

// Carried over from the branch PMS's admin_pages/AdminReports.jsx (2026-09-28).
import { useState, useCallback, useEffect } from "react";
import { IoBarChartOutline, IoDownloadOutline } from "react-icons/io5";
// IoMailOutline comes back with the Email Report button below, if it does.
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import PageHeader from "@/components/pms/PageHeader";
import PageTabs from "@/components/pms/PageTabs";
import StatusBadge from "@/components/pms/StatusBadge";
import { ACCOUNT_LABELS } from "@/components/pms/folioCharges";
import {
  fetchReportsDashboard,
  downloadReportsExport,
  // emailReportsDashboard, // parked with the Email Report button below
  fetchPaymentsAnalysis,
  fetchPmsReport,
  fetchAccommodationReport,
  fetchFoodSalesReport,
  downloadFoodSalesReportExport,
  fetchDrinkSalesReport,
  downloadDrinkSalesReportExport,
  fetchBarStockReport,
  downloadBarStockReportExport,
  downloadAnalysisExport,
  downloadPmsReportExport,
  downloadAccommodationReportExport,
} from "@/lib/pms/api/reports-api";
import { fetchStaffAccounts } from "@/lib/pms/api/staff-accounts-api";
import { addDaysISO, businessDateISO } from "@/lib/pms/dates";
import { isAccountant, isReceptionist, isStorekeeper, isWaitron } from "@/lib/pms/auth";

// money/pct/formatDate/formatDateTime plus the shared render bits below
// (ReportSection, TableHead, EmptyRow, SummaryCard, OccupancyBadge) moved
// out to utils/report-format.js and components/shared/reportUi.jsx so
// every report tab renders from one set of pieces rather than duplicating
// them — a plain component file can't co-export helper functions/consts
// alongside its default export (breaks Fast Refresh), so this couldn't just
// live here.
import { money, pct, formatDate, formatDateTime, formatPaymentMethod } from "@/lib/pms/format";
import { canViewAuditTrail } from "@/components/pms/pmsNavItems";
import { filter, page, table } from "@/components/pms/ui";
import { ReportScope, ReportExportAll, ExportActions } from "@/components/pms/ReportExport";
import ReportSignOff from "@/components/pms/signoff/ReportSignOff";
import { AuditLink, ReportSection, TableHead, EmptyRow, SummaryCard, OccupancyBadge, StaffActivitySection, MoneyKindTag } from "@/components/pms/reportUi";

import FilterBar, { DateField, DateRangeFields, FilterField, GenerateButton } from "@/components/pms/FilterBar";
import { MotionDiv, tabEnter } from "@/components/pms/motion";
import GuestName from "@/components/pms/GuestName";
import { Tip } from "@/components/pms/Tip";
import { useDraft } from "@/lib/pms/drafts";
// This business month, first to last day. By the hotel's business day (6am
// Lagos, server clock): before 6am on the 1st it is still last month. It used
// to read the device's local calendar and then toISOString(), which in Lagos
// (UTC+1) moved both ends back a day - the 30th of last month to the 30th.
function currentMonthRange() {
  const from = `${businessDateISO().slice(0, 7)}-01`;
  const [y, m] = from.split("-").map(Number);
  const to = addDaysISO(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`, -1);
  return { from, to };
}

const ALL_TABS = [
  { key: "dashboard", label: "Dashboard" },
  // Labels are deliberately crossed against the keys (2026-09-07): the
  // report keyed "manifest" is the arrivals/departures sheet, which the
  // hotel calls the Accommodation report, and the one keyed "accommodation"
  // is the per-room house register, which they call the Manifest. Renaming
  // the keys would mean renaming the API routes and every activeTab branch
  // below for a wording change, so only the display labels moved.
  // The Accommodation report (key "manifest") was taken out (owner,
  // 2026-11-26): "the manifest covers what we need for that".
  { key: "analysis", label: "Analysis" },
  { key: "pms", label: "PMS Report" },
  { key: "accommodation", label: "Manifest" },
  { key: "food-sales", label: "Food Sales" },
  { key: "drink-sales", label: "Drink Sales" },
  { key: "bar-stock", label: "Bar Stock" },
];

// Food/Drink Sales and Bar Stock are all F&B-only — a receptionist has no
// front-desk reason to see them, unlike every other tab here. Mirrors the
// backend's own gating (FOOD_DRINK_SALES_ROLES in ReportsController), which
// is the real enforcement; this just keeps a receptionist from seeing tabs
// that would 403 anyway. Same set the page-level Shift picker below uses to
// decide receptionist vs waitron roster/label.
const FNB_TABS = ["food-sales", "drink-sales", "bar-stock"];
// A waitron's whole job here is the F&B trio — everything else (occupancy,
// payments analysis, front-desk manifest) belongs to a role that runs the
// front desk, which a waitron doesn't.
// A store keeper gets the same F&B trio as a waitron — Bar Stock is
// literally their job, and Food/Drink Sales are what moves that stock.
// Everything else here (occupancy, payments analysis, front-desk manifest)
// belongs to a role that runs the front desk, which they don't.
const visibleTabs = () =>
  isWaitron() || isStorekeeper() ? ALL_TABS.filter((t) => FNB_TABS.includes(t.key))
  : isReceptionist() ? ALL_TABS.filter((t) => !FNB_TABS.includes(t.key))
  : ALL_TABS;


export default function AdminReportsPage() {
  // Whichever tab this role actually sees first, not a hardcoded "dashboard"
  // — a waitron has no Dashboard tab, so that default rendered the Dashboard
  // report under a tab strip where nothing was selected. Lazy initializer
  // because visibleTabs() reads the stored role, and the roster is fixed for
  // the life of a session.
  // The tab, the shift and each report's dates are kept as drafts
  // (lib/pms/drafts.js, owner 2026-11-27): back on Reports, the report you
  // were on, for the dates you picked. A remembered tab this role can't
  // open falls back to its first.
  const [savedTab, setActiveTab] = useDraft("reports:tab", () => visibleTabs()[0]?.key ?? "dashboard");
  const activeTab = visibleTabs().some((t) => t.key === savedTab) ? savedTab : (visibleTabs()[0]?.key ?? "dashboard");

  // Report-page-level, not per-tab — one shift selection covers whichever
  // report is currently active, and labels its Excel export with the shift
  // that produced it. Food Sales/Drink Sales/Bar Stock are
  // waitron territory (FNB_TABS above), so this picker swaps roster + label
  // for those three rather than always showing "receptionist on duty" on a
  // report a receptionist can't even open.
  const isFnbTab = FNB_TABS.includes(activeTab);
  const [receptionistStaff, setReceptionistStaff] = useState([]);
  const [waitronStaff, setWaitronStaff] = useState([]);
  const [shift, setShift] = useDraft("reports:shift", "");

  useEffect(() => {
    fetchStaffAccounts()
      .then((list) => setReceptionistStaff(list || []))
      .catch(() => setReceptionistStaff([]));
    fetchStaffAccounts("waitron")
      .then((list) => setWaitronStaff(list || []))
      .catch(() => setWaitronStaff([]));
  }, []);

  // A receptionist's name has no business riding along into a waitron-
  // attributed report, or vice versa, when switching between the two tab
  // groups - so the shift is cleared as the tab changes group.
  const openTab = (key) => {
    if (FNB_TABS.includes(key) !== isFnbTab) setShift("");
    setActiveTab(key);
  };

  const shiftRoster = isFnbTab ? waitronStaff : receptionistStaff;
  const shiftLabel = isFnbTab ? "Shift (waitron on duty)" : "Shift (receptionist on duty)";

  return (
    <div data-component="AdminReports" className="flex flex-col items-start gap-[3rem]">
      <PageHeader
        icon={IoBarChartOutline}
        tipId="reports.page"
        title="Reports"
        description={
          activeTab === "dashboard"
            ? "Revenue, occupancy, and stay totals for a custom date range."
            : activeTab === "analysis"
            ? "Every naira taken and paid back in a date range — guest payments, non-guest sales, refunds and credit refunds — by room, receipt number, and method. Net Total matches the Overview's Collected for the same dates."
            : activeTab === "pms"
            ? "The room occupancy report as on paper: every room as at 7:00 PM (Evening) or 7:00 AM (Morning) - occupied with its code, vacant, out of order and why - with the day's arrivals and departures."
            : activeTab === "accommodation"
            ? "The day's room sales: one row per room occupied that night — guest, room, tariff, payment, and whether they checked in today or stayed over from yesterday. Guests who checked out during the day are left off, and complementary and manager's rooms are listed separately under Non-Revenue Rooms."
            : activeTab === "food-sales"
            ? "Every food order for a given date — charged to a room's folio or a non-guest folio — with quantity, amount, payment status, and payment method."
            : activeTab === "drink-sales"
            ? "Every drink order for a given date — charged to a room's folio or a non-guest folio — with quantity, amount, payment status, and payment method."
            : "Every active drink item for a given date — opening, added, adjusted (damaged, corrected or returned to the store), sold, and closing stock, plus what sold for. Digitizes the paper Bar Analysis sheet."
        }
      >
        {/* One row of section switches (PageTabs) - owner, 2026-11-06. */}
        <PageTabs tabs={visibleTabs()} active={activeTab} onChange={openTab} />

        {/* Shift attributes a report to whichever front-desk shift sends it to
            the accountant — meaningless for an accountant's own session,
            since they're not sending anything to themselves. */}
        {!isAccountant() && (
          <FilterBar>
            <FilterField label={shiftLabel} tip="reports.shift" htmlFor="reports-shift">
              <select id="reports-shift" value={shift} onChange={(e) => setShift(e.target.value)} className={filter.select}>
                <option value="">-- Select --</option>
                {shiftRoster.map((s) => (
                  <option key={s.id} value={s.username}>{s.username} ({s.role})</option>
                ))}
              </select>
            </FilterField>
          </FilterBar>
        )}
      </PageHeader>

      <MotionDiv key={activeTab} className="w-full flex flex-col items-start gap-[3rem]" {...tabEnter}>
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "analysis" && <AnalysisTab />}
      {activeTab === "pms" && <PmsReportTab />}
      {activeTab === "accommodation" && <AccommodationReportTab shift={shift} />}
      {activeTab === "food-sales" && <FoodSalesReportTab shift={shift} />}
      {activeTab === "drink-sales" && <DrinkSalesReportTab shift={shift} />}
      {activeTab === "bar-stock" && <BarStockReportTab shift={shift} />}
      </MotionDiv>
    </div>
  );
}

// ─── Dashboard (existing report, unchanged) ──────────────────────────────────

function DashboardTab() {
  const defaultRange = currentMonthRange();
  const [from, setFrom] = useDraft("reports:dashboard:from", defaultRange.from);
  const [to, setTo] = useDraft("reports:dashboard:to", defaultRange.to);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  // Email Report is parked (owner, 2026-09-17): every account that can open
  // this page sees the reports live, with shift attribution, so mailing one
  // by hand earns nothing right now. Kept rather than deleted — bring back
  // this state, the handler, the two blocks in the markup, the icon and the
  // api helper together, and the backend endpoint with them.
  // const [showEmailForm, setShowEmailForm] = useState(false);
  // const [emailAddress, setEmailAddress] = useState("");
  // const [emailing, setEmailing] = useState(false);
  // const [emailError, setEmailError] = useState(null);
  // const [emailSuccess, setEmailSuccess] = useState(null);

  const loadReport = useCallback(async () => {
    if (!from || !to) return;
    try {
      setLoading(true);
      setError(null);
      const result = await fetchReportsDashboard(from, to);
      setData(result);
    } catch (err) {
      setError((err.response?.data?.message || "Failed to load report.") + " Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const handleExport = async () => {
    if (!from || !to) return;
    try {
      setExporting(true);
      setExportError(null);
      await downloadReportsExport(from, to);
    } catch (err) {
      setExportError(err.response?.data?.message || "Failed to export report.");
    } finally {
      setExporting(false);
    }
  };

  // Parked with the rest of Email Report — see the state above.
  // const handleEmailReport = async () => {
  //   if (!from || !to || !emailAddress.trim()) return;
  //   try {
  //     setEmailing(true);
  //     setEmailError(null);
  //     setEmailSuccess(null);
  //     await emailReportsDashboard(from, to, emailAddress.trim());
  //     setEmailSuccess(`Report sent to ${emailAddress.trim()}.`);
  //     setEmailAddress("");
  //     setTimeout(() => setEmailSuccess(null), 6000);
  //   } catch (err) {
  //     setEmailError(err.response?.data?.message || "Failed to send report email.");
  //   } finally {
  //     setEmailing(false);
  //   }
  // };

  const summary = data?.summary || {};
  const paymentMethods = data?.paymentMethods || [];
  const revenueByRoomType = data?.revenueByRoomType || [];
  const occupancy = data?.occupancy || [];
  const period = data?.period;

  const totalPaymentsCollected = paymentMethods.reduce((sum, m) => sum + (m.total || 0), 0);

  return (
    <div className="w-full flex flex-col items-start gap-[2.5rem]">
      {/* Date range picker (FilterBar, owner 2026-11-27). */}
      <FilterBar
        actions={
          <>
            <GenerateButton onClick={loadReport} loading={loading} />
            <button type="button" onClick={handleExport} disabled={exporting || !from || !to} className={filter.secondary}>
              <IoDownloadOutline size={20} /> {exporting ? "Exporting..." : "Export Excel"}
            </button>
          </>
        }
      >
        <DateRangeFields idPrefix="dash" from={from} to={to} onFrom={setFrom} onTo={setTo} fromTip="reports.from" toTip="reports.to" />
        {/* Email Report, parked — see the note by its state above.
        <Button
          onClick={() => setShowEmailForm((v) => !v)}
          disabled={!from || !to}
          variant="secondary"
          className={`text-xl! flex items-center gap-2 rounded-xl`}
        >
          <IoMailOutline size={20} /> Email Report
        </Button>
        */}
      </FilterBar>

      {/* The Email Report form, parked with its button above.
      {showEmailForm && (
        <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-wrap gap-4 items-end w-full">
          <div className="flex flex-col gap-2 flex-1 min-w-[16rem]">
            <label className="text-xl font-semibold text-[color:var(--text-color)]/76">Send report to</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
            />
          </div>
          <Button
            onClick={handleEmailReport}
            disabled={emailing || !emailAddress.trim()}
            variant="emphasis"
            className={`text-xl! ${emailing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {emailing ? "Sending..." : "Send"}
          </Button>
          {emailSuccess && <p className="text-green-700 text-xl w-full">{emailSuccess}</p>}
          {emailError && <p className="text-red-600 text-xl w-full">{emailError}</p>}
        </div>
      )}
      */}

      {exportError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">
          {exportError}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20 w-full">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && data && (
        <ReportScope from={period?.from || from} to={period?.to || to}>
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            {period && (
              <p className="text-2xl text-[color:var(--text-color)]/76">
                Showing data for <strong className="text-[color:var(--black)]">{period.from}</strong> to{" "}
                <strong className="text-[color:var(--black)]">{period.to}</strong> ({period.days} business day{period.days !== 1 ? "s" : ""}, 6am to 6am)
              </p>
            )}
            <ReportSignOff reportKey="dashboard" from={period?.from || from} to={period?.to || to} />
            <ReportExportAll />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Total Billed" tip="reports.dash.totalBilled" value={money(summary.total_billed)} sub="everything charged this period, guests and non-guests" />
            <SummaryCard label="Payments Received" tip="reports.dash.paymentsReceived" value={money(totalPaymentsCollected)} sub="collected this period" accent />
            {/* outstanding_in_period, not total_outstanding: this card is
                part of a report ABOUT the selected range, and the branch-wide
                figure ignored the dates entirely — it read the same whatever
                range was picked, and the same as the Overview page's own
                Outstanding card. The Overview keeps the branch-wide one,
                since its card links to the full Folios pending list. */}
            <SummaryCard label="Outstanding" tip="reports.dash.outstanding" value={money(summary.outstanding_in_period)} sub="still owed by stays that began this period" warn={Number(summary.outstanding_in_period) > 0} />
            <SummaryCard label="Completed Stays" tip="reports.dash.completedStays" value={summary.completed_stays ?? "—"} sub={`of ${summary.total_stays ?? 0} stays that began this period`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by room type */}
            <ReportSection report title="Revenue by Room Type" tip="reports.dash.revenueByType" subtitle="Room and breakfast charged for the nights in this period">
              {revenueByRoomType.length === 0 ? (
                <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No data for this period.</p>
              ) : (
                  <table className="w-full text-2xl">
                    <thead>
                      <tr className={table.headRow}>
                        <th className={`px-6 py-3 text-left text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide ${table.stickyTh}`}>Room Type<Tip id="reports.dash.col.roomType" /></th>
                        <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Stays<Tip id="reports.dash.col.stays" /></th>
                        <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Revenue<Tip id="reports.dash.col.revenue" /></th>
                        <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Avg / Stay<Tip id="reports.dash.col.avgStay" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByRoomType.map((row, i) => (
                        <tr key={i} className={table.row}>
                          <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{row.room_type_name}</td>
                          <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{row.total_stays}</td>
                          <td className="px-6 py-4 text-right font-semibold text-[color:var(--black)]">{money(row.total_revenue)}</td>
                          <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{money(row.avg_rate_per_stay)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              )}
            </ReportSection>

            {/* Payment methods */}
            <ReportSection report title="Payments by Method" tip="reports.dash.paymentsByMethod" subtitle="Payments and non-guest sales, less payment and credit refunds — the same total as Analysis">
              {paymentMethods.length === 0 ? (
                <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No payments recorded in this period.</p>
              ) : (
                  <table className="w-full text-2xl">
                    <thead>
                      <tr className={table.headRow}>
                        <th className={`px-6 py-3 text-left text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide ${table.stickyTh}`}>Method<Tip id="reports.dash.col.method" /></th>
                        <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Count<Tip id="reports.dash.col.count" /></th>
                        <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Total<Tip id="reports.dash.col.total" /></th>
                        <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Share<Tip id="reports.dash.col.share" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentMethods.map((row, i) => (
                        <tr key={i} className={table.row}>
                          <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{formatPaymentMethod(row.payment_method)}</td>
                          <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{row.count}</td>
                          <td className="px-6 py-4 text-right font-semibold text-[color:var(--black)]">{money(row.total)}</td>
                          <td className="px-6 py-4 text-right text-[color:var(--text-color)]/76">
                            {totalPaymentsCollected > 0 ? pct((row.total / totalPaymentsCollected) * 100) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-(--accent-2)">
                      <tr className="bg-[color:var(--text-color)]/3">
                        <td className={`px-6 py-4 font-bold text-[color:var(--black)] ${table.stickyTh}`}>Total</td>
                        <td className="px-6 py-4 text-right font-semibold text-[color:var(--text-color)]/84">
                          {paymentMethods.reduce((s, r) => s + r.count, 0)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[color:var(--black)]">{money(totalPaymentsCollected)}</td>
                        <td className="px-6 py-4 text-right text-[color:var(--text-color)]/68">100%</td>
                      </tr>
                    </tfoot>
                  </table>
              )}
            </ReportSection>
          </div>

          {/* Occupancy */}
          <ReportSection report title="Occupancy by Room Type" tip="reports.dash.occupancy" subtitle="Room nights booked (no-shows left out) vs available across the selected period">
            {occupancy.length === 0 ? (
              <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No data for this period.</p>
            ) : (
                <table className="w-full text-2xl">
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`px-6 py-3 text-left text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide ${table.stickyTh}`}>Room Type<Tip id="reports.dash.col.roomType" /></th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Capacity<Tip id="reports.dash.col.capacity" /></th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Avail. Nights<Tip id="reports.dash.col.availNights" /></th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Occupied<Tip id="reports.dash.col.occupied" /></th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/76 uppercase tracking-wide">Occ. %<Tip id="reports.dash.col.occPct" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupancy.map((row, i) => (
                      <tr key={i} className={table.row}>
                        <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{row.room_type_name}</td>
                        <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{row.max_capacity}</td>
                        <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{row.available_room_nights}</td>
                        <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{Number(row.occupied_room_nights).toFixed(1)}</td>
                        <td className="px-6 py-4 text-right">
                          <OccupancyBadge value={row.occupancy_pct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}
          </ReportSection>

          <StaffActivitySection activity={data.staff_activity} money={money} />
        </div>
        </ReportScope>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/60 text-2xl w-full">
          Select a date range and click <strong>Generate Report</strong> to view results.
        </div>
      )}
    </div>
  );
}

// A labelled figure at the foot of a report section, with an optional
// one-line note underneath saying what it counts. Left-justified, so a wide
// table's total is in view without scrolling to its far edge (owner,
// 2026-09-18).
function TotalLine({ label, amount, note, emphasis = false, tip }) {
  return (
    <div data-report-total className="flex flex-col items-start gap-1 px-6 py-4 border-t border-(--accent-2)">
      <p className="text-xl">
        <span data-total-part="label" className="text-[color:var(--text-color)]/68 uppercase tracking-wide font-semibold">{label}{tip && <Tip id={tip} />}</span>{" "}
        <span data-total-part="value" className={`font-bold ml-3 ${emphasis ? "text-[color:var(--emphasis)]" : "text-[color:var(--black)]"}`}>{money(amount)}</span>
      </p>
      {note && <p data-total-part="note" className="text-lg text-[color:var(--text-color)]/60">{note}</p>}
    </div>
  );
}

function analysisGroups(payments = []) {
  const groups = [
    { key: "room", title: "Room Sales", tip: "reports.analysis.room", rows: [] },
    { key: "fnb", title: "F&B Sales", tip: "reports.analysis.fnb", rows: [] },
    { key: "laundry", title: "Laundry Sales", tip: "reports.analysis.laundry", rows: [] },
    { key: "old", title: "Guest Bills (before accounts)", tip: "reports.analysis.oldWay", rows: [] },
  ];
  for (const p of payments) (groups.find((g) => g.key === p.paid_for) || groups[3]).rows.push(p);
  return groups
    .filter((g) => g.key !== "old" || g.rows.length > 0)
    .map((g) => ({ ...g, net: g.rows.reduce((sum, p) => sum + (p.status === "refunded" ? -1 : 1) * Number(p.amount || 0), 0) }));
}

function AnalysisTab() {
  const showAudit = canViewAuditTrail();
  const defaultRange = currentMonthRange();
  const [from, setFrom] = useDraft("reports:analysis:from", defaultRange.from);
  const [to, setTo] = useDraft("reports:analysis:to", defaultRange.to);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const load = useCallback(async () => {
    if (!from || !to) return;
    try {
      setLoading(true);
      setError(null);
      setData(await fetchPaymentsAnalysis(from, to));
    } catch (err) {
      setError((err.response?.data?.message || "Failed to load analysis.") + " Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const handleExport = async () => {
    if (!from || !to) return;
    try {
      setExporting(true);
      setExportError(null);
      await downloadAnalysisExport(from, to);
    } catch (err) {
      setExportError(err.response?.data?.message || "Failed to export analysis.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-start gap-[2.5rem]">
      <RangePicker from={from} to={to} setFrom={setFrom} setTo={setTo} onGenerate={load} loading={loading} />

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <ReportScope from={from} to={to}>
        <div className="w-full flex flex-col gap-[2.5rem]">
          <ReportSignOff reportKey="analysis" from={from} to={to} />
          <ExportActions full actions={[{ label: exporting ? "Exporting..." : "Export Excel", onClick: handleExport, disabled: exporting }]} />

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <SummaryCard label="Collected" tip="reports.analysis.collected" value={money(data.total_collected)} sub="guest payments and non-guest sales" accent />
            <SummaryCard label="Refunded" tip="reports.analysis.refunded" value={money(data.total_refunded)} sub="payment and credit refunds" warn={data.total_refunded > 0} />
            <SummaryCard label="Net Total" tip="reports.analysis.net" value={money(data.net_total)} sub="collected minus refunded" />
          </div>

          {/* Room, F&B and Laundry apart (owner, 2026-11-26), each with its
              own total; a payment that settled a bill the old way, as one,
              is listed on its own while any are in the range. */}
          {analysisGroups(data.payments).map((g) => (
            <ReportSection
              key={g.key}
              report
              title={g.title}
              tip={g.tip}
              subtitle={`${g.rows.length} transaction(s)`}
              footer={g.rows.length > 0 && <TotalLine label={`${g.title} Total`} amount={g.net} tip="reports.netTotal" />}
            >
              {g.rows.length === 0 ? (
                <EmptyRow />
              ) : (
                <table className="w-full text-xl">
                  <TableHead cells={["Room", "Receipt No.", "Reference", "Guest", "Method", "Date", "Amount", ...(showAudit ? ["Action"] : [])]} rightAlign={["Amount"]} tips={{ Room: "reports.analysis.col.room", "Receipt No.": "reports.analysis.col.receipt", Reference: "reports.analysis.col.reference", Guest: "reports.analysis.col.guest", Method: "reports.analysis.col.method", Date: "reports.analysis.col.date", Amount: "reports.analysis.col.amount" }} />
                  <tbody>
                    {/* row_key: rows come from several tables (guest payments,
                        non-guest sales, credit refunds), so their ids can repeat. */}
                    {g.rows.map((p) => (
                      <tr key={p.row_key || p.id} className={table.row}>
                        <td className={`px-6 py-4 text-[color:var(--text-color)]/84 ${table.stickyTd}`}>{p.room_numbers || "—"}</td>
                        <td className="px-6 py-4 text-[color:var(--text-color)]/84">{p.receipt_number || "—"}</td>
                        <td className="px-6 py-4 text-[color:var(--text-color)]/68 font-mono text-lg">{p.payment_reference}</td>
                        <td className="px-6 py-4 font-medium text-[color:var(--black)]">
                          <span className="flex items-center gap-2 flex-wrap">
                            <GuestName name={p.guest_name} tags={p.guest_tags} />
                            <MoneyKindTag row={p} />
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatPaymentMethod(p.payment_method)}</td>
                        {/* On one line (owner, 2026-11-26: it wrapped onto five). */}
                        <td className="px-6 py-4 text-[color:var(--text-color)]/84 whitespace-nowrap">{formatDateTime(p.payment_date)}</td>
                        <td className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${p.status === "refunded" ? "text-red-600" : "text-[color:var(--black)]"}`}>
                          {p.status === "refunded" ? "−" : ""}{money(p.amount)}
                        </td>
                        {showAudit && <td className="px-6 py-4"><AuditLink audit={p.audit} /></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ReportSection>
          ))}
          <TotalLine label="Net Total (all of the above)" amount={data.net_total} tip="reports.netTotal" />

          <StaffActivitySection activity={data.staff_activity} money={money} />
        </div>
        </ReportScope>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/60 text-2xl w-full">
          Select a date range and click <strong>Generate Report</strong> to view results.
        </div>
      )}
    </div>
  );
}

// ─── PMS Report (Evening / Morning) ─────────────────────────────────────────────

function PmsReportTab() {
  const [date, setDate] = useDraft("reports:pms:date", businessDateISO);
  const [variant, setVariant] = useDraft("reports:pms:variant", "evening");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const load = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true);
      setError(null);
      setData(await fetchPmsReport(date, variant));
    } catch (err) {
      setError((err.response?.data?.message || "Failed to load PMS report.") + " Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [date, variant]);

  const handleExport = async () => {
    if (!date) return;
    try {
      setExporting(true);
      setExportError(null);
      await downloadPmsReportExport(date, variant);
    } catch (err) {
      setExportError(err.response?.data?.message || "Failed to export PMS report.");
    } finally {
      setExporting(false);
    }
  };

  // The report as the message the front desk sends (owner, 2026-11-26: the
  // paper report is a WhatsApp message), ready to paste.
  const [copied, setCopied] = useState(false);
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(pmsMessage(data));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setExportError("Could not copy - your browser blocked it.");
    }
  };

  return (
    <div className="w-full flex flex-col items-start gap-[2.5rem]">
      <FilterBar actions={<GenerateButton onClick={load} loading={loading} />}>
        <DateField id="pms-date" tip="reports.date" value={date} onChange={setDate} />
        <FilterField label="Variant" tip="reports.pms.variant" htmlFor="pms-variant">
          <select id="pms-variant" value={variant} onChange={(e) => setVariant(e.target.value)} className={filter.select}>
            <option value="evening">Evening (7:00 PM)</option>
            <option value="morning">Morning (7:00 AM)</option>
          </select>
        </FilterField>
      </FilterBar>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <ReportScope date={data.report_date}>
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-2xl font-bold text-[color:var(--black)]">
                Room Occupancy Report ({data.variant === "evening" ? "Evening" : "Morning"})<Tip id="reports.pms.occupancy" />
              </p>
              <p className="text-xl text-[color:var(--text-color)]/76">
                Date: <strong className="text-[color:var(--black)]">{formatDate(`${data.report_date}T12:00:00Z`)}</strong> · Time:{" "}
                <strong className="text-[color:var(--black)]">{data.report_time}</strong>
                {data.live && <> · as at now, {formatDateTime(data.as_at)} (its time has not come yet)</>}
              </p>
            </div>
            <ReportSignOff reportKey="pms" from={data.report_date} to={data.report_date} />
            <ExportActions
              full
              actions={[
                { label: copied ? "Copied" : "Copy as Message", onClick: copyMessage },
                { label: exporting ? "Exporting..." : "Export Excel", onClick: handleExport, disabled: exporting },
              ]}
            />
          </div>

          {data.previous_night_audit !== undefined && (
            <div className={`p-5 rounded-xl border w-full text-xl ${data.previous_night_audit ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-700"}`}>
              {data.previous_night_audit
                ? `Previous night's audit ran at ${formatDateTime(data.previous_night_audit.audited_at)} — ${data.previous_night_audit.rooms_charged} room(s) charged, ${money(data.previous_night_audit.total_posted)} posted.`
                : "Previous night's audit has not been run yet."}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <SummaryCard label="Occupied Rooms" tip="reports.pms.occupied" value={data.counts.occupied} accent />
            <SummaryCard label="Vacant (VCLI)" tip="reports.pms.vacant" value={data.counts.vacant} />
            <SummaryCard label="Out of Order" tip="reports.pms.ooo" value={data.counts.out_of_order} warn={data.counts.out_of_order > 0} />
            <SummaryCard label="Total Rooms" tip="reports.pms.total" value={data.counts.total} sub="in the building" />
          </div>

          <ReportSection report title={`Occupied Rooms (${data.counts.occupied})`} tip="reports.pms.occupiedList">
            {data.occupied.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["No.", "Room", "Status", "Guest"]} tips={{ Status: "reports.pms.col.status", Guest: "reports.pms.col.guest" }} />
                <tbody>
                  {data.occupied.map((r, i) => (
                    <tr key={`${r.room_type_name}-${r.room_number}`} className={table.row}>
                      <td className={`px-6 py-4 text-[color:var(--text-color)]/68 ${table.stickyTd}`}>{i + 1}</td>
                      <td className="px-6 py-4 font-semibold text-[color:var(--black)]">{r.room_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[color:var(--text-color)]/84">
                        Occupied ({r.code}) <strong className="text-[color:var(--black)]">{PMS_TAG_LABELS[r.tag] || r.tag}</strong>
                      </td>
                      <td className="px-6 py-4 font-medium text-[color:var(--black)]">{r.guest_name ? <GuestName name={r.guest_name} tags={r.guest_tags} /> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <ReportSection report title={`Vacant Rooms (${data.counts.vacant})`} tip="reports.pms.vacantList">
            {data.vacant.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["No.", "Room", "Status"]} tips={{ Status: "reports.pms.col.vacantStatus" }} />
                <tbody>
                  {data.vacant.map((r, i) => (
                    <tr key={`${r.room_type_name}-${r.room_number}`} className={table.row}>
                      <td className={`px-6 py-4 text-[color:var(--text-color)]/68 ${table.stickyTd}`}>{i + 1}</td>
                      <td className="px-6 py-4 font-semibold text-[color:var(--black)]">{r.room_number}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <ReportSection report title={`Out of Order and Reason (${data.counts.out_of_order})`} tip="reports.pms.oooList">
            {data.out_of_order.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["No.", "Room", "Reason"]} />
                <tbody>
                  {data.out_of_order.map((r, i) => (
                    <tr key={`${r.room_type_name}-${r.room_number}`} className={table.row}>
                      <td className={`px-6 py-4 text-[color:var(--text-color)]/68 ${table.stickyTd}`}>{i + 1}</td>
                      <td className="px-6 py-4 font-semibold text-[color:var(--black)]">{r.room_number}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <ReportSection report title="Arrivals" tip="reports.pms.arrivals">
            {data.arrivals.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Room", "Guest", "Status"]} tips={{ Room: "reports.pms.col.room", Guest: "reports.pms.col.guest", Status: "reports.pms.arrivals.status" }} />
                <tbody>
                  {data.arrivals.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`px-6 py-4 font-semibold text-[color:var(--black)] ${table.stickyTd}`}>{r.room_numbers || "—"}</td>
                      <td className="px-6 py-4 font-medium text-[color:var(--black)]"><GuestName name={r.guest_name} tags={r.guest_tags} /></td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-lg font-bold ${r.arrived ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                          {r.arrived ? "Arrived" : "Still Expected"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <ReportSection report title="Departures" tip="reports.pms.departures">
            {data.departures.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Room", "Guest", "Status"]} tips={{ Room: "reports.pms.col.room", Guest: "reports.pms.col.guest", Status: "reports.pms.departures.status" }} />
                <tbody>
                  {data.departures.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`px-6 py-4 font-semibold text-[color:var(--black)] ${table.stickyTd}`}>{r.room_numbers || "—"}</td>
                      <td className="px-6 py-4 font-medium text-[color:var(--black)]"><GuestName name={r.guest_name} tags={r.guest_tags} /></td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-lg font-bold ${r.departed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                          {r.departed ? "Departed" : "Still In-House"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <StaffActivitySection activity={data.staff_activity} money={money} />
        </div>
        </ReportScope>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/60 text-2xl w-full">
          Pick a date and variant, then click <strong>Generate Report</strong>.
        </div>
      )}
    </div>
  );
}

// ─── Accommodation Report ───────────────────────────────────────────────────

function AccommodationReportTab({ shift }) {
  const showAudit = canViewAuditTrail();
  const [date, setDate] = useDraft("reports:accommodation:date", businessDateISO);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const load = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true);
      setError(null);
      setData(await fetchAccommodationReport(date));
    } catch (err) {
      setError((err.response?.data?.message || "Failed to load accommodation report.") + " Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  // An accountant session has no Shift selector at all (see AdminReportsPage)
  // — shift stays "" for them, which the backend already treats as optional
  // (falls back to a blank column), so export only actually needs a shift
  // from a front-office session.
  const shiftRequired = !isAccountant();

  const handleExport = async () => {
    if (!date || (shiftRequired && !shift)) return;
    try {
      setExporting(true);
      setExportError(null);
      await downloadAccommodationReportExport(date, shift);
    } catch (err) {
      setExportError(err.response?.data?.message || "Failed to export accommodation report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-start gap-[2.5rem]">
      <FilterBar actions={<GenerateButton onClick={load} loading={loading} />}>
        <DateField id="report-date" tip="reports.date" value={date} onChange={setDate} />
      </FilterBar>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <ReportScope date={data.report_date}>
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Manifest for <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <ReportSignOff reportKey="manifest" from={data.report_date} to={data.report_date} />
            <ExportActions full actions={[{ label: exporting ? "Exporting..." : "Export Excel", onClick: handleExport, disabled: exporting || (shiftRequired && !shift), title: shiftRequired && !shift ? "Select a shift at the top of the page first" : undefined }]} />
          </div>

          {/* Until the night audit closes the day (6am the next morning), its
              stay-over nights are not charged and PB credit is not applied, so
              the figures are incomplete - shown only while that is true
              (owner, 2026-09-18). */}
          {data.night_audit_done === false && (
            <div className="p-5 rounded-xl border w-full text-xl bg-orange-50 border-orange-200 text-orange-700">
              <strong>Not final yet:</strong> the night audit for this day runs at 6:00 AM the next morning.
              Until it does, stay-over nights are not charged and Paid Before (PB) credit is not applied, so
              Payment Status, Paid Today, Counted in Total and the Manifest Total are incomplete. Read this
              Manifest again after 6:00 AM tomorrow.
            </div>
          )}

          {/* The Manifest Total is what guests actually paid for their ROOMS
              today - partial or in full - not what the rooms cost. Breakfast is
              left out, and so is PB: that money is counted under Reservation
              (Credit) on the day it was paid, and counting it again here would
              count it twice (owner, 2026-09-18). */}
          <ReportSection
            report
            title="Rooms in Use"
            tip="reports.acc.rooms"
            footer={
              <TotalLine
                label="Manifest Total (excluding breakfast)"
                tip="reports.acc.manifestTotal"
                amount={data.manifest_total}
                note="The sum of Counted in Total: room money guests paid today. Paid Before (PB) is counted under Reservation (Credit), on the day it was paid."
              />
            }
          >
            {data.rows.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                {/* No Date column (it is always the date chosen above) and no
                    Breakfast Price: the Manifest Total leaves breakfast out.
                    Arrival and checkout each give a date and a time from the same
                    real moment; Checkout Time is blank until the guest has left
                    (owner, 2026-09-18). */}
                <TableHead cells={["Guest", "Room Type", "Room No.", "Arrival Date", "Arrival Time", "Checkout Date", "Checkout Time", "Room Tariff", "Late C/O", "Early C/I", "Payment Mode", "Payment Status", "Receipt No.", "Paid Today", "Counted in Total", "Refund", "Guest Status", "Remarks", ...(showAudit ? ["Action"] : [])]} tips={{ "Guest": "reports.acc.col.guest", "Room Type": "reports.acc.col.roomType", "Room No.": "reports.acc.col.roomNo", "Arrival Date": "reports.acc.col.arrivalDate", "Arrival Time": "reports.acc.col.arrivalTime", "Checkout Date": "reports.acc.col.checkoutDate", "Checkout Time": "reports.acc.col.checkoutTime", "Room Tariff": "reports.acc.col.tariff", "Late C/O": "reports.acc.col.lateCheckout", "Early C/I": "reports.acc.col.earlyCheckin", "Payment Mode": "reports.acc.col.paymentMode", "Payment Status": "reports.acc.col.paymentStatus", "Receipt No.": "reports.acc.col.receipt", "Paid Today": "reports.acc.col.paidToday", "Counted in Total": "reports.acc.col.counted", "Refund": "reports.acc.col.refund", "Guest Status": "reports.acc.col.guestStatus", "Remarks": "reports.acc.col.remarks" }} />
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={`${r.reservation_id}-${r.room_number}-${i}`} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}><GuestName name={r.guest_name} tags={r.guest_tags} /></td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.room_type_name}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.room_number}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84 whitespace-nowrap">{formatDate(r.arrival_date)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84 whitespace-nowrap">{r.arrival_time || "—"}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84 whitespace-nowrap">{formatDate(r.checkout_date)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84 whitespace-nowrap">{r.checkout_time || "—"}</td>
                      {/* Complementary rooms are listed under Non-Revenue Rooms below, so
                          every row here is a room that was sold. */}
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.room_price)}</td>
                      {/* Late check-out and early check-in fees posted for this
                          room that day (owner, 2026-11-26). */}
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{Number(r.late_checkout) ? money(r.late_checkout) : "—"}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{Number(r.early_checkin) ? money(r.early_checkin) : "—"}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatPaymentMethod(r.payment_mode)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.payment_status} />
                      </td>
                      {/* Receipt No.: the receipt of the payment that settled this night.
                          NIL while it is still owing. */}
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.receipt_number || "NIL"}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.amount_paid)}</td>
                      {/* Counted in Total: what this room adds to the Manifest Total -
                          its room money paid fresh today. A paid room adds its tariff,
                          an owing one the lesser of Paid Today and its tariff, a PB
                          one nothing. The column sums to the total below. */}
                      <td className="px-6 py-4 font-semibold text-[color:var(--black)]">{money(r.manifest_amount)}</td>
                      {/* Refund: money handed back to the guest that day, shown as what it
                          did to the drawer. NIL when nothing went back. */}
                      <td className={`px-6 py-4 whitespace-nowrap ${r.refund_amount ? "text-red-600 font-semibold" : "text-[color:var(--text-color)]/84"}`}>
                        {r.refund_amount ? `-${money(Math.abs(r.refund_amount))}` : "NIL"}
                      </td>
                      {/* Guest Status: where the guest is in the stay. Remarks: how the
                          booking came in (walk-in / website / OTA). No Shift column: it
                          repeated one name on every row, and the By Staff section and
                          the Action links now answer who did what. */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={r.guest_status} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.reservation_type || "—"}</td>
                      {showAudit && <td className="px-6 py-4"><AuditLink audit={r.audit} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          {/* Rooms someone stayed in that bring in no money: complementary guests,
              and any room set aside for a manager. Managers are never checked in,
              so there is no guest record to name; the row just says "Manager".
              Out-of-order rooms are not listed, since nobody stayed in them. */}
          <ReportSection report title="Non-Revenue Rooms" subtitle="Complementary stays and manager's rooms" tip="reports.acc.nonRevenue">
            {(data.non_revenue_rooms || []).length === 0 ? (
              <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No complementary rooms or manager rooms in use.</p>
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Room No.", "Name", "Status", ...(showAudit ? ["Action"] : [])]} tips={{ "Room No.": "reports.acc.nonRevenue.col.room", Name: "reports.acc.nonRevenue.col.name", Status: "reports.acc.nonRevenue.col.status" }} />
                <tbody>
                  {data.non_revenue_rooms.map((r) => (
                    <tr key={`${r.room_number}-${r.status}`} className={table.row}>
                      <td className={`px-6 py-4 text-[color:var(--text-color)]/84 ${table.stickyTd}`}>{r.room_number}</td>
                      <td className="px-6 py-4 font-medium text-[color:var(--black)]"><GuestName name={r.name} tags={r.guest_tags} /></td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                      {showAudit && <td className="px-6 py-4"><AuditLink audit={r.audit} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          {/* One section per payment method — the front desk reconciles the
              cash drawer separately from transfers and card takings, which a
              single mixed list makes tedious. The same rows as the Analysis
              report: non-guest sales counted in; a refund or a credit
              refund stays listed under its method, tagged, and is netted out
              of that method's total. */}
          {(data.payments_by_method || []).length === 0 ? (
            <ReportSection report title="Payments by Method" subtitle="Every payment, non-guest sale, refund and credit refund this business day, grouped" tip="reports.acc.byMethod">
              <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No payments recorded for this business day.</p>
            </ReportSection>
          ) : (
            data.payments_by_method.map((group) => (
              <ReportSection
            report
                key={group.payment_method}
                title={`Payments — ${formatPaymentMethod(group.payment_method)}`}
                tip="reports.acc.byMethod"
                subtitle={`${group.count} transaction(s) · ${money(group.total)}`}
              >
                <table className="w-full text-xl">
                  <TableHead cells={["Guest", "Room", "Amount", "Receipt No.", "Time", ...(showAudit ? ["Action"] : [])]} rightAlign={["Amount"]} tips={{ Guest: "reports.acc.byMethod.col.guest", Room: "reports.acc.byMethod.col.room", Amount: "reports.acc.byMethod.col.amount", "Receipt No.": "reports.acc.byMethod.col.receipt", Time: "reports.acc.byMethod.col.time" }} />
                  <tbody>
                    {group.payments.map((pmt) => (
                      <tr key={pmt.row_key || pmt.id} className={table.row}>
                        {/* No Status column: its only values were "completed" (money in)
                            and "refunded" (money out). A refund now reads as what it did to
                            the drawer: a negative amount, tagged. */}
                        <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>
                          <span className="flex items-center gap-2 flex-wrap">
                            <GuestName name={pmt.guest_name} tags={pmt.guest_tags} />
                            <MoneyKindTag row={pmt} />
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[color:var(--text-color)]/84">{pmt.room_numbers || "Unassigned"}</td>
                        <td className={`px-6 py-4 text-right ${pmt.status === "refunded" ? "text-red-600 font-semibold" : "text-[color:var(--text-color)]/84"}`}>
                          {pmt.status === "refunded" ? "-" : ""}{money(pmt.amount)}
                        </td>
                        <td className="px-6 py-4 text-[color:var(--text-color)]/84">{pmt.receipt_number || pmt.payment_reference || "—"}</td>
                        <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatDateTime(pmt.payment_date)}</td>
                        {showAudit && <td className="px-6 py-4"><AuditLink audit={pmt.audit} /></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ReportSection>
            ))
          )}

          {/* Both totals show even on a day with no advance payments, so the
              combined figure is always there to read off. */}
          <ReportSection
            report
            title="Reservation (Credit)"
            subtitle="Advance payments recorded this business day"
            tip="reports.acc.reservation"
            footer={
              <>
                <TotalLine label="Reservation Total" amount={data.reservation_total} tip="reports.acc.reservationTotal" />
                <TotalLine label="Manifest Total plus Reservation" amount={data.manifest_plus_reservation_total} emphasis tip="reports.acc.manifestPlusReservation" />
              </>
            }
          >
            {data.paid_before.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Guest", "Room", "Amount", "Method", "Status", "Receipt No.", ...(showAudit ? ["Action"] : [])]} rightAlign={["Amount"]} tips={{ Guest: "reports.acc.reservation.col.guest", Room: "reports.acc.reservation.col.room", Amount: "reports.acc.reservation.col.amount", Method: "reports.acc.reservation.col.method", Status: "reports.acc.reservation.col.status", "Receipt No.": "reports.acc.reservation.col.receipt" }} />
                <tbody>
                  {data.paid_before.map((d) => (
                    <tr key={d.id} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}><GuestName name={d.guest_name} tags={d.guest_tags} /></td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{d.room_numbers || "Unassigned"}</td>
                      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{money(d.amount)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatPaymentMethod(d.payment_method)}</td>
                      <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{d.receipt_number || "—"}</td>
                      {showAudit && <td className="px-6 py-4"><AuditLink audit={d.audit} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <ReportSection
            report
            title="Debt Recovery"
            subtitle="Old debt cleared by a payment received this business day"
            tip="reports.acc.debt"
            footer={<TotalLine label="Debt Recovery Total" amount={data.debt_recovery_total} tip="reports.acc.debtTotal" />}
          >
            {data.debt_recovery.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Guest", "Room", "Date Owed", "Total Owed", "Total Paid", "Method", "Reference", ...(showAudit ? ["Action"] : [])]} rightAlign={["Total Owed", "Total Paid"]} tips={{ Guest: "reports.acc.debt.col.guest", Room: "reports.acc.debt.col.room", "Date Owed": "reports.acc.debt.col.dateOwed", "Total Owed": "reports.acc.debt.col.owed", "Total Paid": "reports.acc.debt.col.paid", Method: "reports.acc.debt.col.method", Reference: "reports.acc.debt.col.reference" }} />
                <tbody>
                  {data.debt_recovery.map((d, i) => (
                    <tr key={i} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}><GuestName name={d.guest_name} tags={d.guest_tags} /></td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{d.room_numbers || "Unassigned"}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatDate(d.debt_date)}</td>
                      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{money(d.total_owed)}</td>
                      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{money(d.total_paid)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatPaymentMethod(d.payment_method)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{d.payment_reference}</td>
                      {showAudit && <td className="px-6 py-4"><AuditLink audit={d.audit} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          {/* One figure: the Manifest Total, advance money taken today
              (Reservation) and old debt paid off today (Debt Recovery),
              added together (owner, 2026-09-18). */}
          <ReportSection report title="Grand Total" subtitle="Manifest Total + Reservation Total + Debt Recovery Total" tip="reports.acc.grand">
            <TotalLine label="Manifest + Reservation + Debt Recovery" amount={data.grand_total} emphasis tip="reports.acc.grandLine" />
          </ReportSection>

          {/* Notes: everything charged today that is neither a room night nor
              food and drink — laundry, penalties, adjustments, corrections —
              with the description and remark it was posted with, followed by
              the guests' own notes (owner's ask, 2026-09-14). */}
          {/* Laundry sales that day, guest and non-guest (owner, 2026-11-26). */}
          <ReportSection
            report
            title="Laundry Sales"
            tip="reports.acc.laundry"
            footer={(data.laundry_sales || []).length > 0 && <TotalLine label="Laundry Sales Total" amount={data.laundry_sales_total} tip="reports.acc.laundryTotal" />}
          >
            {(data.laundry_sales || []).length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Customer", "Item", "Qty", "Amount", "Status", "Payment Method"]} rightAlign={["Amount"]} />
                <tbody>
                  {data.laundry_sales.map((l, i) => (
                    <tr key={`${l.source}-${i}`} className={table.row}>
                      <td className={`px-6 py-4 text-[color:var(--text-color)]/84 ${table.stickyTd}`}>{l.customer}</td>
                      <td className="px-6 py-4 capitalize text-[color:var(--text-color)]/84">{l.description}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{l.quantity}</td>
                      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{money(Number(l.amount) + Number(l.service_charge || 0))}</td>
                      <td className="px-6 py-4"><StatusBadge status={salesStatus(l.status)} /></td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatPaymentMethod(l.payment_method)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <ReportSection report title="Notes" tip="reports.acc.notes">
            {(data.other_charges || []).length === 0 && data.notes.length === 0 ? (
              <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No other charges or guest notes for this business day.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {(data.other_charges || []).length > 0 && (
                  <table className="w-full text-xl">
                    <TableHead
                      cells={["Guest", "Room", "Type", "Description", "Remarks", "Amount", ...(showAudit ? ["Action"] : [])]}
                      rightAlign={["Amount"]}
                      tips={{ Guest: "reports.acc.notes.col.guest", Room: "reports.acc.notes.col.room", Type: "reports.acc.notes.col.type", Description: "reports.acc.notes.col.description", Remarks: "reports.acc.notes.col.remarks", Amount: "reports.acc.notes.col.amount" }}
                    />
                    <tbody>
                      {data.other_charges.map((c) => (
                        <tr key={c.id} className={table.row}>
                          <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}><GuestName name={c.guest_name} tags={c.guest_tags} /></td>
                          <td className="px-6 py-4 text-[color:var(--text-color)]/84">{c.room_numbers || "—"}</td>
                          <td className="px-6 py-4 text-[color:var(--text-color)]/84">{c.type}</td>
                          <td className="px-6 py-4 text-[color:var(--text-color)]/84">{c.description || "—"}</td>
                          <td className="px-6 py-4 text-[color:var(--text-color)]/76">{c.remarks || "—"}</td>
                          {/* Adjustments and corrections are often negative — shown as
                              what they did to the bill. */}
                          <td className={`px-6 py-4 text-right whitespace-nowrap ${Number(c.amount) < 0 ? "text-red-600 font-semibold" : "text-[color:var(--text-color)]/84"}`}>
                            {Number(c.amount) < 0 ? "-" : ""}{money(Math.abs(Number(c.amount)))}
                          </td>
                          {showAudit && <td className="px-6 py-4"><AuditLink audit={c.audit} /></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {data.notes.length > 0 && (
                  <div data-report-note className="flex flex-col gap-2 px-6 py-4">
                    {data.notes.map((n, i) => (
                      <p key={i} className="text-xl">
                        <span className="font-bold"><GuestName name={n.guest_name} tags={n.guest_tags} /></span>{" "}
                        <span className="text-[color:var(--text-color)]/60">({n.booking_reference})</span> — {n.note}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ReportSection>

          <StaffActivitySection activity={data.staff_activity} money={money} />
        </div>
        </ReportScope>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/60 text-2xl w-full">
          Pick a date, then click <strong>Generate Report</strong>.
        </div>
      )}
    </div>
  );
}

// Shared by FoodSalesReportTab/DrinkSalesReportTab — the Total card plus the
// Payment Breakdown / By Staff sections both reports have, just above the
// report-specific itemized/aggregated table below it.
function SalesTotals({ data }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard label="Total" value={money(data.total)} accent tip="reports.sales.total" />
        {data.payment_breakdown.map((p, i) => (
          <SummaryCard
            key={i}
            label={formatPaymentMethod(p.payment_method)}
            tip="reports.sales.method"
            value={money(p.total)}
            sub={p.payment_method === "charged_to_room" ? undefined : `${p.count} sale${p.count === 1 ? "" : "s"}`}
          />
        ))}
      </div>
    </>
  );
}

// A written summary below the table, matching the paper version's own
// convention of a short notes block after the figures — Payment Methods
// restates SalesTotals' cards above as a plain line (that's the ask); PB/
// Owing/Total Sold/Total Service Charge aren't shown anywhere else on this
// report. lineTotal matches buildSalesTotals' own definition on the backend
// (amount + service_charge is the real, chargeable/paid total per row).
// Split out of SalesTotals so it can render at the BOTTOM of the report,
// where every other report puts its By Staff section (see
// StaffActivitySection in reportUi.jsx). It used to sit directly under the
// summary cards, which made Food/Drink the odd ones out.
function SalesByStaff({ data }) {
  const showAudit = canViewAuditTrail();
  return (
    <ReportSection report title="By Staff" subtitle="Who posted each charge" tip="reports.sales.byStaff">
      {data.staff_breakdown.length === 0 ? <EmptyRow /> : (
        <table className="w-full text-xl">
          <TableHead cells={["Staff", "Total", ...(showAudit ? ["Action"] : [])]} rightAlign={["Total"]} tips={{ Staff: "reports.sales.byStaff.col.staff", Total: "reports.sales.byStaff.col.total" }} />
          <tbody>
            {data.staff_breakdown.map((s, i) => (
              <tr key={i} className={table.row}>
                <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{s.staff_name}</td>
                <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{money(s.total)}</td>
                {showAudit && <td className="px-6 py-4"><AuditLink audit={s.audit} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ReportSection>
  );
}

const SALES_COLUMN_TIPS = {
  Customer: "reports.sales.col.customer",
  Qty: "reports.sales.col.qty",
  "Bill No": "reports.sales.col.billNo",
  Description: "reports.sales.col.description",
  Amount: "reports.sales.col.amount",
  "Service Charge": "reports.sales.col.serviceCharge",
  Status: "reports.sales.col.status",
  "Payment Method": "reports.sales.col.method",
  Remarks: "reports.sales.col.remarks",
};

// "room": an order the waitron charged to the guest's room (folio accounts,
// backend phase-103) - reception collects it with the room bill.
const salesStatus = (status) => (status === "room" ? "charged to room" : status);
// The rows a sales table shows: one per bill (backend groupByBill), or, from
// an older server, one per line.
const salesOrders = (data) => data.orders || data.rows;

function SalesNotes({ data }) {
  const rows = data.rows || [];
  const lineTotal = (r) => Number(r.amount) + Number(r.service_charge);
  // Breakfast's paid-or-owing is the room bill's, not F&B's: it is in Total
  // Sold (as on the paper report), but not F&B's own PB or debt.
  const ownRows = rows.filter((r) => r.source !== "breakfast");
  const pbTotal = ownRows.filter((r) => r.status === "PB").reduce((s, r) => s + lineTotal(r), 0);
  const owingTotal = ownRows.filter((r) => r.status === "owing").reduce((s, r) => s + lineTotal(r), 0);
  const roomTotal = rows.filter((r) => r.status === "room").reduce((s, r) => s + lineTotal(r), 0);
  // A Deposit is tomorrow's breakfast (today's arrivals, owner 2026-11-27):
  // listed, but never sold today.
  const soldRows = rows.filter((r) => r.status !== "deposit");
  const totalSold = soldRows.reduce((s, r) => s + lineTotal(r), 0);
  const totalServiceCharge = soldRows.reduce((s, r) => s + Number(r.service_charge), 0);

  return (
    <div data-report-section data-report-title="Notes" className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-col gap-3 w-full">
      <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/68">Notes<Tip id="reports.sales.notes" /></p>
      <ul data-report-body className="flex flex-col gap-2 text-xl text-[color:var(--text-color)]/84 list-disc pl-6">
        <li>
          Payment methods: {data.payment_breakdown.length === 0 ? "none" : data.payment_breakdown.map((p, i) => (
            <span key={i}>
              {formatPaymentMethod(p.payment_method)}: <strong className="text-[color:var(--black)]">{money(p.total)}</strong>
              {i < data.payment_breakdown.length - 1 ? " · " : ""}
            </span>
          ))}
        </li>
        <li>Paid Before (PB): <strong className="text-[color:var(--black)]">{money(pbTotal)}</strong></li>
        <li>Debt (Owing): <strong className="text-[color:var(--black)]">{money(owingTotal)}</strong></li>
        {roomTotal > 0 && <li>Charged to Room: <strong className="text-[color:var(--black)]">{money(roomTotal)}</strong></li>}
        <li>Total Sold: <strong className="text-[color:var(--black)]">{money(totalSold)}</strong></li>
        {/* Breakfast that came with the rooms (owner, 2026-11-26) - in Total
            Sold, as on the paper report; its money is taken with the room. */}
        {Number(data.breakfast_total) > 0 && (
          <li>of which Breakfast served (last night's guests): <strong className="text-[color:var(--black)]">{money(data.breakfast_total)}</strong></li>
        )}
        {Number(data.breakfast_deposit_total) > 0 && (
          <li>
            Breakfast Deposits (today's arrivals): <strong className="text-[color:var(--black)]">{money(data.breakfast_deposit_total)}</strong>
            <span className="text-[color:var(--text-color)]/60"> — served tomorrow, so tomorrow's sale</span>
          </li>
        )}
        <li>Total Service Charge: <strong className="text-[color:var(--black)]">{money(totalServiceCharge)}</strong></li>
        {/* Advance credit is spendable at reception OR the restaurant, so it
            shows here — but it is money taken for LATER use, so it is never
            part of the sales figures above. */}
        <li>
          Reservation (Credit) taken today: <strong className="text-[color:var(--black)]">{money(data.reservation_credit || 0)}</strong>
          <span className="text-[color:var(--text-color)]/60"> — not part of today's sales; counts when spent</span>
        </li>
      </ul>
    </div>
  );
}

function FoodSalesReportTab({ shift }) {
  const showAudit = canViewAuditTrail();
  const [date, setDate] = useDraft("reports:food:date", businessDateISO);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const load = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true);
      setError(null);
      setData(await fetchFoodSalesReport(date));
    } catch (err) {
      setError((err.response?.data?.message || "Failed to load food sales report.") + " Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  const shiftRequired = !isAccountant();

  const handleExport = async () => {
    if (!date || (shiftRequired && !shift)) return;
    try {
      setExporting(true);
      setExportError(null);
      await downloadFoodSalesReportExport(date, shift);
    } catch (err) {
      setExportError(err.response?.data?.message || "Failed to export food sales report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-start gap-[2.5rem]">
      <FilterBar actions={<GenerateButton onClick={load} loading={loading} />}>
        <DateField id="report-date" tip="reports.date" value={date} onChange={setDate} />
      </FilterBar>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <ReportScope date={data.report_date}>
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Food sales for <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <ReportSignOff reportKey="food-sales" from={data.report_date} to={data.report_date} />
            <ExportActions full actions={[{ label: exporting ? "Exporting..." : "Export Excel", onClick: handleExport, disabled: exporting || (shiftRequired && !shift), title: shiftRequired && !shift ? "Select a shift at the top of the page first" : undefined }]} />
          </div>

          <SalesTotals data={data} />

          {/* One row per bill (owner, 2026-11-27): the backend's orders. */}
          <ReportSection report title="Food Orders" tip="reports.sales.food">
            {data.rows.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Customer", "Qty", "Bill No", "Description", "Amount", "Service Charge", "Status", "Payment Method", "Remarks", ...(showAudit ? ["Action"] : [])]} tips={SALES_COLUMN_TIPS} />
                <tbody>
                  {salesOrders(data).map((r, i) => (
                    <tr key={i} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{r.customer}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.quantity}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.bill_no || "—"}</td>
                      <td className="px-6 py-4 capitalize text-[color:var(--text-color)]/84">{r.description}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.amount)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.service_charge)}</td>
                      <td className="px-6 py-4"><StatusBadge status={salesStatus(r.status)} /></td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatPaymentMethod(r.payment_method)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/76">{r.notes || "—"}</td>
                      {showAudit && <td className="px-6 py-4"><AuditLink audit={r.audit} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>
          <SalesNotes data={data} />

          <SalesByStaff data={data} />
        </div>
        </ReportScope>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/60 text-2xl w-full">
          Pick a date, then click <strong>Generate Report</strong>.
        </div>
      )}
    </div>
  );
}

function DrinkSalesReportTab({ shift }) {
  const showAudit = canViewAuditTrail();
  const [date, setDate] = useDraft("reports:drink:date", businessDateISO);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const load = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true);
      setError(null);
      setData(await fetchDrinkSalesReport(date));
    } catch (err) {
      setError((err.response?.data?.message || "Failed to load drink sales report.") + " Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  const shiftRequired = !isAccountant();

  const handleExport = async () => {
    if (!date || (shiftRequired && !shift)) return;
    try {
      setExporting(true);
      setExportError(null);
      await downloadDrinkSalesReportExport(date, shift);
    } catch (err) {
      setExportError(err.response?.data?.message || "Failed to export drink sales report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-start gap-[2.5rem]">
      <FilterBar actions={<GenerateButton onClick={load} loading={loading} />}>
        <DateField id="report-date" tip="reports.date" value={date} onChange={setDate} />
      </FilterBar>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <ReportScope date={data.report_date}>
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Drink sales for <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <ReportSignOff reportKey="drink-sales" from={data.report_date} to={data.report_date} />
            <ExportActions full actions={[{ label: exporting ? "Exporting..." : "Export Excel", onClick: handleExport, disabled: exporting || (shiftRequired && !shift), title: shiftRequired && !shift ? "Select a shift at the top of the page first" : undefined }]} />
          </div>

          <SalesTotals data={data} />

          {/* One row per bill (owner, 2026-11-27): the backend's orders. */}
          <ReportSection report title="Drink Orders" tip="reports.sales.drink">
            {data.rows.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Customer", "Qty", "Bill No", "Description", "Amount", "Service Charge", "Status", "Payment Method", "Remarks", ...(showAudit ? ["Action"] : [])]} tips={SALES_COLUMN_TIPS} />
                <tbody>
                  {salesOrders(data).map((r, i) => (
                    <tr key={i} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{r.customer}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.quantity}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.bill_no || "—"}</td>
                      <td className="px-6 py-4 capitalize text-[color:var(--text-color)]/84">{r.description}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.amount)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.service_charge)}</td>
                      <td className="px-6 py-4"><StatusBadge status={salesStatus(r.status)} /></td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatPaymentMethod(r.payment_method)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/76">{r.notes || "—"}</td>
                      {showAudit && <td className="px-6 py-4"><AuditLink audit={r.audit} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>
          <SalesNotes data={data} />

          <SalesByStaff data={data} />
        </div>
        </ReportScope>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/60 text-2xl w-full">
          Pick a date, then click <strong>Generate Report</strong>.
        </div>
      )}
    </div>
  );
}

function BarStockReportTab({ shift }) {
  const showAudit = canViewAuditTrail();
  // What a drink cost the hotel isn't the F&B floor's: a waitron's report
  // comes without it (Accounting, Step 12).
  const showCost = !isWaitron();
  const [date, setDate] = useDraft("reports:bar-stock:date", businessDateISO);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const load = useCallback(async () => {
    if (!date) return;
    try {
      setLoading(true);
      setError(null);
      setData(await fetchBarStockReport(date));
    } catch (err) {
      setError((err.response?.data?.message || "Failed to load bar stock report.") + " Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  const shiftRequired = !isAccountant();

  const handleExport = async () => {
    if (!date || (shiftRequired && !shift)) return;
    try {
      setExporting(true);
      setExportError(null);
      await downloadBarStockReportExport(date, shift);
    } catch (err) {
      setExportError(err.response?.data?.message || "Failed to export bar stock report.");
    } finally {
      setExporting(false);
    }
  };

  const totalSold = data ? data.rows.reduce((s, r) => s + r.sold_stock, 0) : 0;
  const totalAmount = data ? data.rows.reduce((s, r) => s + r.total_amount, 0) : 0;

  return (
    <div className="w-full flex flex-col items-start gap-[2.5rem]">
      <FilterBar actions={<GenerateButton onClick={load} loading={loading} />}>
        <DateField id="report-date" tip="reports.date" value={date} onChange={setDate} />
      </FilterBar>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <ReportScope date={data.report_date}>
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Bar stock for <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <ReportSignOff reportKey="bar-stock" from={data.report_date} to={data.report_date} />
            <ExportActions full actions={[{ label: exporting ? "Exporting..." : "Export Excel", onClick: handleExport, disabled: exporting || (shiftRequired && !shift), title: shiftRequired && !shift ? "Select a shift at the top of the page first" : undefined }]} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard label="Total Sold Stock" value={totalSold} accent tip="reports.bar.totalSold" />
            <SummaryCard label="Total Amount" value={money(totalAmount)} tip="reports.bar.totalAmount" />
          </div>

          <ReportSection report title="Stock" tip="reports.bar.stock">
            {data.rows.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Stock", "Opening", "Added", "Total (before sales)", "Adjusted", "Sold", "Unit Price", ...(showCost ? ["Unit Cost"] : []), "Total Amount", "Closing", "Service Charge", "Remark", ...(showAudit ? ["Action"] : [])]} tips={{ "Stock": "reports.bar.col.stock", "Opening": "reports.bar.col.opening", "Added": "reports.bar.col.added", "Total (before sales)": "reports.bar.col.totalBefore", "Adjusted": "reports.bar.col.adjusted", "Sold": "reports.bar.col.sold", "Unit Price": "reports.bar.col.unitPrice", "Unit Cost": "reports.bar.col.unitCost", "Total Amount": "reports.bar.col.totalAmount", "Closing": "reports.bar.col.closing", "Service Charge": "reports.bar.col.serviceCharge", "Remark": "reports.bar.col.remark" }} />
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.drink_item_id} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{r.stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.opening_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.added_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.total_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.adjusted_stock > 0 ? `+${r.adjusted_stock}` : r.adjusted_stock < 0 ? `−${-r.adjusted_stock}` : 0}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.sold_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.unit_price ?? r.unit_cost_price)}</td>
                      {showCost && (
                        <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.unit_cost === null || r.unit_cost === undefined ? "—" : money(r.unit_cost)}</td>
                      )}
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.total_amount)}</td>
                      <td className={`px-6 py-4 font-semibold ${r.closing_stock < 0 ? "text-red-600" : "text-[color:var(--black)]"}`}>{r.closing_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.service_charge)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/76">{r.remark || "—"}</td>
                      {showAudit && <td className="px-6 py-4"><AuditLink audit={r.audit} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          {data.summary && (
            <ReportSection report title="Daily Totals" subtitle="Combined Food + Drink figures for this business day" tip="reports.bar.daily">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                <SummaryCard label="Food" tip="reports.bar.food" value={money(data.summary.food)} />
                <SummaryCard label="Drink" tip="reports.bar.drink" value={money(data.summary.drink)} />
                <SummaryCard label="Service Charge" tip="reports.bar.serviceCharge" value={money(data.summary.service_charge)} />
                <SummaryCard label="Debt Recovered" tip="reports.bar.debtRecovered" value={money(data.summary.debt_recovered)} />
                <SummaryCard label="Cash" tip="reports.bar.cash" value={money(data.summary.cash)} />
                <SummaryCard label="POS" tip="reports.bar.pos" value={money(data.summary.pos)} />
                <SummaryCard label="Transfer" tip="reports.bar.transfer" value={money(data.summary.transfer)} />
                <SummaryCard label="Charged to Room" tip="reports.bar.chargedToRoom" value={money(data.summary.charged_to_room)} sub="billed to a guest folio" />
                <SummaryCard label="Reservation (Credit)" tip="reports.bar.reservationCredit" value={money(data.summary.reservation_credit)} sub="taken today, for future use" />
                <SummaryCard label="Debt" tip="reports.bar.debt" value={money(data.summary.debt)} warn={data.summary.debt > 0} />
                <SummaryCard label="Paid Before" tip="reports.bar.paidBefore" value={money(data.summary.paid_before)} />
                <SummaryCard label="Total" tip="reports.bar.total" value={money(data.summary.total)} sub="actually collected today" accent />
              </div>
            </ReportSection>
          )}
        </div>
        </ReportScope>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/60 text-2xl w-full">
          Pick a date, then click <strong>Generate Report</strong>.
        </div>
      )}
    </div>
  );
}

// What each occupied room's tag means, as the paper report spells it.
const PMS_TAG_LABELS = { JCI: "(JCI) Just Checked In", DO: "(DO) Due Out", "Stay Over": "Stay Over", Overstay: "Overstay (past due out)" };

// The PMS Report as the front desk's message, laid out like theirs.
function pmsMessage(d) {
  const evening = d.variant === "evening";
  const [y, m, dd] = d.report_date.split("-");
  const lines = [
    `Good ${evening ? "evening" : "morning"} sir/ma`,
    ...(d.branch_name ? [d.branch_name] : []),
    `Room occupancy report ${evening ? "PM" : "AM"}`,
    `Date: ${dd}/${m}/${y}`,
    `Time: ${d.report_time}`,
    "",
    `Occupied Rooms: ${d.counts.occupied}`,
    ...d.occupied.map((r, i) =>
      r.tag === "Complimentary" || r.tag === "Manager's complimentary" ? `${i + 1}. ${r.room_number}- ${r.tag} (${r.code})` : `${i + 1}. ${r.room_number}- Occupied (${r.code}) ${PMS_TAG_LABELS[r.tag] || r.tag}`,
    ),
    "",
    `Vacant Rooms (VCLI): ${d.counts.vacant} Rooms`,
    ...d.vacant.map((r, i) => `${i + 1}. ${r.room_number}- ${r.code}`),
    "",
    `Out of Order and Reason (${d.counts.out_of_order} Rooms)`,
    ...d.out_of_order.map((r, i) => `${i + 1}. ${r.room_number}- ${r.reason || "No reason given"}`),
    "",
    "ROOM DISCREPANCIES AND ANALYSIS",
    `OUT OF ORDER ROOMS: ${d.counts.out_of_order} Rooms`,
    `OCCUPIED ROOMS: ${d.counts.occupied} Rooms`,
    `VCLI: ${d.counts.vacant} Rooms`,
    `TOTAL ROOMS IN THE BUILDING: ${d.counts.total} Rooms`,
  ];
  return lines.join("\n");
}

// ─── Shared bits ────────────────────────────────────────────────────────────

function RangePicker({ from, to, setFrom, setTo, onGenerate, loading }) {
  return (
    <FilterBar actions={<GenerateButton onClick={onGenerate} loading={loading} />}>
      <DateRangeFields idPrefix="report" from={from} to={to} onFrom={setFrom} onTo={setTo} fromTip="reports.from" toTip="reports.to" />
    </FilterBar>
  );
}

// ReportSection, TableHead, EmptyRow, SummaryCard, OccupancyBadge and
// StaffActivitySection live in components/shared/reportUi.jsx (imported at
// the top of this file), shared by every report tab.
