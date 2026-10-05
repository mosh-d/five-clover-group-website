"use client";
"use no memo";

// Carried over from the branch PMS's admin_pages/AdminReports.jsx (2026-09-28).
import { useState, useCallback, useEffect } from "react";
import { IoBarChartOutline, IoDownloadOutline } from "react-icons/io5";
// IoMailOutline comes back with the Email Report button below, if it does.
import LoadingSpinner from "@/components/pms/LoadingSpinner";
import Button from "@/components/pms/Button";
import PageHeading from "@/components/pms/PageHeading";
import StatusBadge from "@/components/pms/StatusBadge";
import {
  fetchReportsDashboard,
  downloadReportsExport,
  // emailReportsDashboard, // parked with the Email Report button below
  fetchManifest,
  fetchPaymentsAnalysis,
  fetchPmsReport,
  fetchAccommodationReport,
  fetchFoodSalesReport,
  downloadFoodSalesReportExport,
  fetchDrinkSalesReport,
  downloadDrinkSalesReportExport,
  fetchBarStockReport,
  downloadBarStockReportExport,
  downloadManifestExport,
  downloadAnalysisExport,
  downloadPmsReportExport,
  downloadAccommodationReportExport,
} from "@/lib/pms/api/reports-api";
import { fetchStaffAccounts } from "@/lib/pms/api/staff-accounts-api";
import { adminTodayISO } from "@/lib/pms/dates";
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
import { table } from "@/components/pms/ui";
import { AuditLink, ReportSection, TableHead, EmptyRow, SummaryCard, OccupancyBadge, StaffActivitySection, MoneyKindTag } from "@/components/pms/reportUi";

import DateInput from "@/components/pms/DateInput";
import { MotionDiv, tabEnter } from "@/components/pms/motion";
import GuestName from "@/components/pms/GuestName";
import { Tip } from "@/components/pms/Tip";
function currentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

const ALL_TABS = [
  { key: "dashboard", label: "Dashboard" },
  // Labels are deliberately crossed against the keys (2026-09-07): the
  // report keyed "manifest" is the arrivals/departures sheet, which the
  // hotel calls the Accommodation report, and the one keyed "accommodation"
  // is the per-room house register, which they call the Manifest. Renaming
  // the keys would mean renaming the API routes and every activeTab branch
  // below for a wording change, so only the display labels moved.
  { key: "manifest", label: "Accommodation" },
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
  const [activeTab, setActiveTab] = useState(() => visibleTabs()[0]?.key ?? "dashboard");

  // Report-page-level, not per-tab — one shift selection covers whichever
  // report is currently active, and labels its Excel export with the shift
  // that produced it. Food Sales/Drink Sales/Bar Stock are
  // waitron territory (FNB_TABS above), so this picker swaps roster + label
  // for those three rather than always showing "receptionist on duty" on a
  // report a receptionist can't even open.
  const isFnbTab = FNB_TABS.includes(activeTab);
  const [receptionistStaff, setReceptionistStaff] = useState([]);
  const [waitronStaff, setWaitronStaff] = useState([]);
  const [shift, setShift] = useState("");

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
      <PageHeading icon={IoBarChartOutline} tipId="reports.page">Reports</PageHeading>

      <div className="flex gap-3 text-xl flex-wrap">
        {visibleTabs().map((t) => (
          <button
            key={t.key}
            onClick={() => openTab(t.key)}
            className={`px-6 py-3 rounded-lg font-bold cursor-pointer transition-all ${
              activeTab === t.key ? "bg-[color:var(--emphasis)] text-white" : "bg-black/4 text-[color:var(--text-color)] hover:bg-black/8"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xl text-[color:var(--text-color)]/76">
        {activeTab === "dashboard"
          ? "Revenue, occupancy, and stay totals for a custom date range."
          : activeTab === "manifest"
          ? "Arrivals and departures for a date range, with room price, receipt numbers, and deposits — the daily front-desk arrivals and departures sheet, digitized."
          : activeTab === "analysis"
          ? "Every naira taken and paid back in a date range — guest payments, non-guest sales, refunds and credit refunds — by room, receipt number, and method. Net Total matches the Overview's Collected for the same dates."
          : activeTab === "pms"
          ? "A shift-handoff snapshot: room status (vacant/occupied/out-of-order/reserved/complementary) plus arrivals and departures — pick Evening for end-of-day or Morning to see the previous night's audit."
          : activeTab === "accommodation"
          ? "The day's room sales: one row per room occupied that night — guest, room, tariff, payment, and whether they checked in today or stayed over from yesterday. Guests who checked out during the day are left off, and complementary and manager's rooms are listed separately under Non-Revenue Rooms."
          : activeTab === "food-sales"
          ? "Every food order for a given date — charged to a room's folio or a non-guest folio — with quantity, amount, payment status, and payment method."
          : activeTab === "drink-sales"
          ? "Every drink order for a given date — charged to a room's folio or a non-guest folio — with quantity, amount, payment status, and payment method."
          : "Every active drink item for a given date — opening, added, damaged, sold, and closing stock, plus what sold for. Digitizes the paper Bar Analysis sheet."}
      </p>

      {/* Shift attributes a report to whichever front-desk shift sends it to
          the accountant — meaningless for an accountant's own session,
          since they're not sending anything to themselves. */}
      {!isAccountant() && (
        <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-col gap-2 w-full max-w-sm">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">{shiftLabel}<Tip id="reports.shift" /></label>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          >
            <option value="">-- Select --</option>
            {shiftRoster.map((s) => (
              <option key={s.id} value={s.username}>{s.username} ({s.role})</option>
            ))}
          </select>
        </div>
      )}

      <MotionDiv key={activeTab} className="w-full flex flex-col items-start gap-[3rem]" {...tabEnter}>
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "manifest" && <ManifestTab />}
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
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
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
      {/* Date range picker */}
      <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-wrap gap-4 items-end w-full">
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">From<Tip id="reports.from" /></label>
          <DateInput
            value={from}
            onChange={(e) => {
              const newFrom = e.target.value;
              setFrom(newFrom);
              // Keep "to" from ever being pushed before "from" when "from" moves later.
              if (newFrom && to && newFrom > to) setTo(newFrom);
            }}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">To<Tip id="reports.to" /></label>
          <DateInput
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <Button
          onClick={loadReport}
          disabled={loading}
          variant="emphasis"
          className={`text-xl! pb-5 pt-4.5 rounded-xl ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className="inline-flex items-center gap-2">{loading && <LoadingSpinner size="sm" light />}Generate Report</span>
        </Button>
        <Button
          onClick={handleExport}
          disabled={exporting || !from || !to}
          variant="secondary"
          className={`text-xl! flex items-center gap-2 rounded-xl ${exporting ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <IoDownloadOutline size={20} /> {exporting ? "Exporting..." : "Export Excel"}
        </Button>
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
      </div>

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
        <div className="w-full flex flex-col gap-[2.5rem]">
          {period && (
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Showing data for <strong className="text-[color:var(--black)]">{period.from}</strong> to{" "}
              <strong className="text-[color:var(--black)]">{period.to}</strong> ({period.days} business day{period.days !== 1 ? "s" : ""}, 6am to 6am)
            </p>
          )}

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
            <div className="bg-(--card) rounded-xl border border-(--accent-2) overflow-hidden">
              <div className="px-6 py-5 border-b border-(--accent-2)">
                <h2 className="text-3xl font-bold text-[color:var(--black)]">Revenue by Room Type<Tip id="reports.dash.revenueByType" /></h2>
                <p className="text-xl text-[color:var(--text-color)]/68 mt-1">Room and breakfast charged for the nights in this period</p>
              </div>
              {revenueByRoomType.length === 0 ? (
                <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No data for this period.</p>
              ) : (
                <div className="overflow-x-auto">
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
                </div>
              )}
            </div>

            {/* Payment methods */}
            <div className="bg-(--card) rounded-xl border border-(--accent-2) overflow-hidden">
              <div className="px-6 py-5 border-b border-(--accent-2)">
                <h2 className="text-3xl font-bold text-[color:var(--black)]">Payments by Method<Tip id="reports.dash.paymentsByMethod" /></h2>
                <p className="text-xl text-[color:var(--text-color)]/68 mt-1">Payments and non-guest sales, less payment and credit refunds — the same total as Analysis</p>
              </div>
              {paymentMethods.length === 0 ? (
                <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No payments recorded in this period.</p>
              ) : (
                <div className="overflow-x-auto">
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
                </div>
              )}
            </div>
          </div>

          {/* Occupancy */}
          <div className="bg-(--card) rounded-xl border border-(--accent-2) overflow-hidden">
            <div className="px-6 py-5 border-b border-(--accent-2)">
              <h2 className="text-3xl font-bold text-[color:var(--black)]">Occupancy by Room Type<Tip id="reports.dash.occupancy" /></h2>
              <p className="text-xl text-[color:var(--text-color)]/68 mt-1">Room nights booked (no-shows left out) vs available across the selected period</p>
            </div>
            {occupancy.length === 0 ? (
              <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No data for this period.</p>
            ) : (
              <div className="overflow-x-auto">
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
              </div>
            )}
          </div>

          <StaffActivitySection activity={data.staff_activity} money={money} />
        </div>
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
    <div className="flex flex-col items-start gap-1 px-6 py-4 border-t border-(--accent-2)">
      <p className="text-xl">
        <span className="text-[color:var(--text-color)]/68 uppercase tracking-wide font-semibold">{label}{tip && <Tip id={tip} />}</span>{" "}
        <span className={`font-bold ml-3 ${emphasis ? "text-[color:var(--emphasis)]" : "text-[color:var(--black)]"}`}>{money(amount)}</span>
      </p>
      {note && <p className="text-lg text-[color:var(--text-color)]/60">{note}</p>}
    </div>
  );
}

// Room revenue only: breakfast is excluded because these reports are read
// for room revenue and breakfast is accounted for separately, and
// complementary rooms are excluded because their price was waived (which is
// why both tables render it struck through). The figure is computed by the
// backend's sumRoomRevenue so the screen and the Excel export can't drift.
function RoomRevenueTotal({ amount }) {
  return <TotalLine label="Total Room Revenue (excluding breakfast)" amount={amount} tip="reports.roomRevenueTotal" />;
}

// ─── Manifest ─────────────────────────────────────────────────────────────────

function ManifestTab() {
  const showAudit = canViewAuditTrail();
  const [date, setDate] = useState(adminTodayISO());
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
      setData(await fetchManifest(date));
    } catch (err) {
      setError((err.response?.data?.message || "Failed to load manifest.") + " Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  const handleExport = async () => {
    if (!date) return;
    try {
      setExporting(true);
      setExportError(null);
      await downloadManifestExport(date);
    } catch (err) {
      setExportError(err.response?.data?.message || "Failed to export manifest.");
    } finally {
      setExporting(false);
    }
  };

  const renderRow = (r) => (
    <tr key={r.id} className={table.row}>
      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}><GuestName name={r.guest_name} tags={r.guest_tags} /></td>
      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.room_numbers || "Unassigned"}</td>
      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{money(r.room_price)}</td>
      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{money(r.breakfast_price)}</td>
      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.receipt_numbers || "—"}</td>
      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/84">{money(r.amount_deposited)}</td>
      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatDateTime(r.actual_check_in || r.check_in)}</td>
      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatDateTime(r.actual_check_out || r.check_out)}</td>
      {/* Already cased for reading ("OTA, Walk-in"), so no capitalize —
          it would turn "Walk-in" into "Walk-In". */}
      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.source_label || r.source || "—"}</td>
      {showAudit && <td className="px-6 py-4"><AuditLink audit={r.audit} /></td>}
    </tr>
  );

  const headers = ["Guest", "Room", "Room Price", "Breakfast Price", "Receipt No.", "Res. Credit", "Arrival", "Check-Out", "Source", ...(showAudit ? ["Action"] : [])];
  const headerTips = {
    Guest: "reports.manifest.col.guest",
    Room: "reports.manifest.col.room",
    "Room Price": "reports.manifest.col.roomPrice",
    "Breakfast Price": "reports.manifest.col.breakfast",
    "Receipt No.": "reports.manifest.col.receipt",
    "Res. Credit": "reports.manifest.col.resCredit",
    Arrival: "reports.manifest.col.arrival",
    "Check-Out": "reports.manifest.col.checkOut",
    Source: "reports.manifest.col.source",
  };

  return (
    <div className="w-full flex flex-col items-start gap-[2.5rem]">
      <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-wrap gap-4 items-end w-full">
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">Date<Tip id="reports.date" /></label>
          <DateInput
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <Button onClick={load} disabled={loading} variant="emphasis" className={`text-xl! pb-5 pt-4.5 rounded-xl ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
          <span className="inline-flex items-center gap-2">{loading && <LoadingSpinner size="sm" light />}Generate Report</span>
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Accommodation report for <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={handleExport} disabled={exporting} variant="secondary" className="text-xl! flex items-center rounded-xl gap-2">
                <IoDownloadOutline size={20} /> {exporting ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </div>

          <ReportSection
            title="Check-Ins"
            subtitle="Everyone due to arrive this business day"
            tip="reports.manifest.checkIns"
            footer={<RoomRevenueTotal amount={data.check_ins_room_total} />}
          >
            {data.check_ins.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={headers} tips={headerTips} />
                <tbody>{data.check_ins.map(renderRow)}</tbody>
              </table>
            )}
          </ReportSection>

          <ReportSection
            title="Check-Outs"
            subtitle="Everyone due to depart this business day"
            tip="reports.manifest.checkOuts"
            footer={<RoomRevenueTotal amount={data.check_outs_room_total} />}
          >
            {data.check_outs.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={headers} tips={headerTips} />
                <tbody>{data.check_outs.map(renderRow)}</tbody>
              </table>
            )}
          </ReportSection>

          <StaffActivitySection activity={data.staff_activity} money={money} />
        </div>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/60 text-2xl w-full">
          Pick a date, then click <strong>Generate Report</strong>.
        </div>
      )}
    </div>
  );
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

function AnalysisTab() {
  const showAudit = canViewAuditTrail();
  const defaultRange = currentMonthRange();
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
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
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex justify-end gap-3">
            <Button onClick={handleExport} disabled={exporting} variant="secondary" className="text-xl! flex rounded-xl items-center gap-2">
              <IoDownloadOutline size={20} /> {exporting ? "Exporting..." : "Export Excel"}
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <SummaryCard label="Collected" tip="reports.analysis.collected" value={money(data.total_collected)} sub="guest payments and non-guest sales" accent />
            <SummaryCard label="Refunded" tip="reports.analysis.refunded" value={money(data.total_refunded)} sub="payment and credit refunds" warn={data.total_refunded > 0} />
            <SummaryCard label="Net Total" tip="reports.analysis.net" value={money(data.net_total)} sub="collected minus refunded" />
          </div>

          <ReportSection
            title="All Payments"
            tip="reports.analysis.all"
            subtitle={`${data.payments.length} transaction(s)`}
            footer={data.payments.length > 0 && <TotalLine label="Net Total" amount={data.net_total} tip="reports.netTotal" />}
          >
            {data.payments.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Room", "Receipt No.", "Reference", "Guest", "Method", "Date", "Amount", ...(showAudit ? ["Action"] : [])]} rightAlign={["Amount"]} tips={{ Room: "reports.analysis.col.room", "Receipt No.": "reports.analysis.col.receipt", Reference: "reports.analysis.col.reference", Guest: "reports.analysis.col.guest", Method: "reports.analysis.col.method", Date: "reports.analysis.col.date", Amount: "reports.analysis.col.amount" }} />
                <tbody>
                  {/* row_key: rows come from several tables (guest payments,
                      non-guest sales, credit refunds), so their ids can repeat. */}
                  {data.payments.map((p) => (
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
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatDateTime(p.payment_date)}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${p.status === "refunded" ? "text-red-600" : "text-[color:var(--black)]"}`}>
                        {p.status === "refunded" ? "−" : ""}{money(p.amount)}
                      </td>
                      {showAudit && <td className="px-6 py-4"><AuditLink audit={p.audit} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <StaffActivitySection activity={data.staff_activity} money={money} />
        </div>
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
  const [date, setDate] = useState(adminTodayISO());
  const [variant, setVariant] = useState("evening");
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

  const roomNumberList = (rooms) => (rooms.length === 0 ? "—" : rooms.map((r) => r.room_number).join(", "));

  return (
    <div className="w-full flex flex-col items-start gap-[2.5rem]">
      <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-wrap gap-4 items-end w-full">
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">Date<Tip id="reports.date" /></label>
          <DateInput
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">Variant<Tip id="reports.pms.variant" /></label>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          >
            <option value="evening">Evening (~7pm)</option>
            <option value="morning">Morning (~7am)</option>
          </select>
        </div>
        <Button onClick={load} disabled={loading} variant="emphasis" className={`text-xl! pb-5 pt-4.5 rounded-xl ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
          <span className="inline-flex items-center gap-2">{loading && <LoadingSpinner size="sm" light />}Generate Report</span>
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              {data.variant === "evening" ? "Evening" : "Morning"} report for{" "}
              <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={handleExport} disabled={exporting} variant="secondary" className="text-xl! flex items-center rounded-xl gap-2">
                <IoDownloadOutline size={20} /> {exporting ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </div>

          {data.previous_night_audit !== undefined && (
            <div className={`p-5 rounded-xl border w-full text-xl ${data.previous_night_audit ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-700"}`}>
              {data.previous_night_audit
                ? `Previous night's audit ran at ${formatDateTime(data.previous_night_audit.audited_at)} — ${data.previous_night_audit.rooms_charged} room(s) charged, ${money(data.previous_night_audit.total_posted)} posted.`
                : "Previous night's audit has not been run yet."}
            </div>
          )}

          <ReportSection title="Stay-Overs" subtitle="Currently in-house, not arriving or departing today" tip="reports.pms.stayOvers">
            {data.stay_overs.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Guest", "Check-In", "Check-Out"]} tips={{ Guest: "reports.pms.col.guest", "Check-In": "reports.pms.col.checkIn", "Check-Out": "reports.pms.col.checkOut" }} />
                <tbody>
                  {data.stay_overs.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}><GuestName name={r.guest_name} tags={r.guest_tags} /></td>
                      {/* A stay-over is already checked in (that's what makes them a stay-over,
                          not an arrival) but hasn't checked out yet — actual_check_in is a real
                          timestamp worth showing with a time; check_out is still just a scheduled
                          calendar date until it actually happens, so it gets no fake time attached. */}
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatDateTime(r.actual_check_in)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{formatDate(r.check_out)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportSection>

          <ReportSection title="Arrivals" tip="reports.pms.arrivals">
            {data.arrivals.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Guest", "Status"]} tips={{ Guest: "reports.pms.col.guest", Status: "reports.pms.arrivals.status" }} />
                <tbody>
                  {data.arrivals.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}><GuestName name={r.guest_name} tags={r.guest_tags} /></td>
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

          <ReportSection title="Departures" tip="reports.pms.departures">
            {data.departures.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Guest", "Status"]} tips={{ Guest: "reports.pms.col.guest", Status: "reports.pms.departures.status" }} />
                <tbody>
                  {data.departures.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}><GuestName name={r.guest_name} tags={r.guest_tags} /></td>
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

          <ReportSection title="Room Status" tip="reports.pms.roomStatus">
            <div className="flex flex-col gap-4 p-6">
              <RoomStatusLine label="Vacant" tip="reports.pms.vacant" count={data.room_status.vacant.length} rooms={roomNumberList(data.room_status.vacant)} />
              <RoomStatusLine label="Occupied" tip="reports.pms.occupied" count={data.room_status.occupied.length} rooms={roomNumberList(data.room_status.occupied)} />
              <RoomStatusLine label="Out of Order" tip="reports.pms.ooo" count={data.room_status.out_of_order.length} rooms={roomNumberList(data.room_status.out_of_order)} />
              <RoomStatusLine label="Reserved" tip="reports.pms.reserved" count={data.room_status.reserved.length} rooms={roomNumberList(data.room_status.reserved)} />
              {/* Complementary always last, per the manual report's convention */}
              <RoomStatusLine label="Complementary" tip="reports.pms.complementary" count={data.room_status.complementary.length} rooms={roomNumberList(data.room_status.complementary)} />
            </div>
          </ReportSection>

          <StaffActivitySection activity={data.staff_activity} money={money} />
        </div>
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
  const [date, setDate] = useState(adminTodayISO());
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
      <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-wrap gap-4 items-end w-full">
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">Date<Tip id="reports.date" /></label>
          <DateInput
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <Button onClick={load} disabled={loading} variant="emphasis" className={`text-xl! pb-5 pt-4.5 rounded-xl ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
          <span className="inline-flex items-center gap-2">{loading && <LoadingSpinner size="sm" light />}Generate Report</span>
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Manifest for <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExport}
                disabled={exporting || (shiftRequired && !shift)}
                variant="secondary"
                className="text-xl! flex items-center rounded-xl gap-2"
                title={shiftRequired && !shift ? "Select a shift at the top of the page first" : undefined}
              >
                <IoDownloadOutline size={20} /> {exporting ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
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
                <TableHead cells={["Guest", "Room Type", "Room No.", "Arrival Date", "Arrival Time", "Checkout Date", "Checkout Time", "Room Tariff", "Payment Mode", "Payment Status", "Receipt No.", "Paid Today", "Counted in Total", "Refund", "Guest Status", "Remarks", ...(showAudit ? ["Action"] : [])]} tips={{ "Guest": "reports.acc.col.guest", "Room Type": "reports.acc.col.roomType", "Room No.": "reports.acc.col.roomNo", "Arrival Date": "reports.acc.col.arrivalDate", "Arrival Time": "reports.acc.col.arrivalTime", "Checkout Date": "reports.acc.col.checkoutDate", "Checkout Time": "reports.acc.col.checkoutTime", "Room Tariff": "reports.acc.col.tariff", "Payment Mode": "reports.acc.col.paymentMode", "Payment Status": "reports.acc.col.paymentStatus", "Receipt No.": "reports.acc.col.receipt", "Paid Today": "reports.acc.col.paidToday", "Counted in Total": "reports.acc.col.counted", "Refund": "reports.acc.col.refund", "Guest Status": "reports.acc.col.guestStatus", "Remarks": "reports.acc.col.remarks" }} />
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
          <ReportSection title="Non-Revenue Rooms" subtitle="Complementary stays and manager's rooms" tip="reports.acc.nonRevenue">
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
            <ReportSection title="Payments by Method" subtitle="Every payment, non-guest sale, refund and credit refund this business day, grouped" tip="reports.acc.byMethod">
              <p className="text-2xl text-[color:var(--text-color)]/68 px-6 py-8">No payments recorded for this business day.</p>
            </ReportSection>
          ) : (
            data.payments_by_method.map((group) => (
              <ReportSection
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
          <ReportSection title="Grand Total" subtitle="Manifest Total + Reservation Total + Debt Recovery Total" tip="reports.acc.grand">
            <TotalLine label="Manifest + Reservation + Debt Recovery" amount={data.grand_total} emphasis tip="reports.acc.grandLine" />
          </ReportSection>

          {/* Notes: everything charged today that is neither a room night nor
              food and drink — laundry, penalties, adjustments, corrections —
              with the description and remark it was posted with, followed by
              the guests' own notes (owner's ask, 2026-09-14). */}
          <ReportSection title="Notes" tip="reports.acc.notes">
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
                  <div className="flex flex-col gap-2 px-6 py-4">
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
    <ReportSection title="By Staff" subtitle="Who posted each charge" tip="reports.sales.byStaff">
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

function SalesNotes({ data }) {
  const rows = data.rows || [];
  const lineTotal = (r) => Number(r.amount) + Number(r.service_charge);
  const pbTotal = rows.filter((r) => r.status === "PB").reduce((s, r) => s + lineTotal(r), 0);
  const owingTotal = rows.filter((r) => r.status === "owing").reduce((s, r) => s + lineTotal(r), 0);
  const totalSold = rows.reduce((s, r) => s + lineTotal(r), 0);
  const totalServiceCharge = rows.reduce((s, r) => s + Number(r.service_charge), 0);

  return (
    <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-col gap-3 w-full">
      <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/68">Notes<Tip id="reports.sales.notes" /></p>
      <ul className="flex flex-col gap-2 text-xl text-[color:var(--text-color)]/84 list-disc pl-6">
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
        <li>Total Sold: <strong className="text-[color:var(--black)]">{money(totalSold)}</strong></li>
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
  const [date, setDate] = useState(adminTodayISO());
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
      <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-wrap gap-4 items-end w-full">
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">Date<Tip id="reports.date" /></label>
          <DateInput
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <Button onClick={load} disabled={loading} variant="emphasis" className={`text-xl! pb-5 pt-4.5 rounded-xl ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
          <span className="inline-flex items-center gap-2">{loading && <LoadingSpinner size="sm" light />}Generate Report</span>
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Food sales for <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExport}
                disabled={exporting || (shiftRequired && !shift)}
                variant="secondary"
                className="text-xl! flex items-center rounded-xl gap-2"
                title={shiftRequired && !shift ? "Select a shift at the top of the page first" : undefined}
              >
                <IoDownloadOutline size={20} /> {exporting ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </div>

          <SalesTotals data={data} />

          <ReportSection title="Food Orders" tip="reports.sales.food">
            {data.rows.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Customer", "Qty", "Bill No", "Description", "Amount", "Service Charge", "Status", "Payment Method", "Remarks", ...(showAudit ? ["Action"] : [])]} tips={SALES_COLUMN_TIPS} />
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={i} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{r.customer}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.quantity}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.bill_no || "—"}</td>
                      <td className="px-6 py-4 capitalize text-[color:var(--text-color)]/84">{r.description}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.amount)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.service_charge)}</td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
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
  const [date, setDate] = useState(adminTodayISO());
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
      <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-wrap gap-4 items-end w-full">
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">Date<Tip id="reports.date" /></label>
          <DateInput
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <Button onClick={load} disabled={loading} variant="emphasis" className={`text-xl! pb-5 pt-4.5 rounded-xl ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
          <span className="inline-flex items-center gap-2">{loading && <LoadingSpinner size="sm" light />}Generate Report</span>
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Drink sales for <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExport}
                disabled={exporting || (shiftRequired && !shift)}
                variant="secondary"
                className="text-xl! flex items-center rounded-xl gap-2"
                title={shiftRequired && !shift ? "Select a shift at the top of the page first" : undefined}
              >
                <IoDownloadOutline size={20} /> {exporting ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </div>

          <SalesTotals data={data} />

          <ReportSection title="Drink Orders" tip="reports.sales.drink">
            {data.rows.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Customer", "Qty", "Bill No", "Description", "Amount", "Service Charge", "Status", "Payment Method", "Remarks", ...(showAudit ? ["Action"] : [])]} tips={SALES_COLUMN_TIPS} />
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={i} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{r.customer}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.quantity}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.bill_no || "—"}</td>
                      <td className="px-6 py-4 capitalize text-[color:var(--text-color)]/84">{r.description}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.amount)}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.service_charge)}</td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
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
  const [date, setDate] = useState(adminTodayISO());
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
      <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-wrap gap-4 items-end w-full">
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/76">Date<Tip id="reports.date" /></label>
          <DateInput
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <Button onClick={load} disabled={loading} variant="emphasis" className={`text-xl! pb-5 pt-4.5 rounded-xl ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
          <span className="inline-flex items-center gap-2">{loading && <LoadingSpinner size="sm" light />}Generate Report</span>
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{error}</div>}
      {exportError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">{exportError}</div>}
      {loading && <div className="flex justify-center py-20 w-full"><LoadingSpinner size="lg" /></div>}

      {!loading && data && (
        <div className="w-full flex flex-col gap-[2.5rem]">
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl text-[color:var(--text-color)]/76">
              Bar stock for <strong className="text-[color:var(--black)]">{data.report_date}</strong>
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExport}
                disabled={exporting || (shiftRequired && !shift)}
                variant="secondary"
                className="text-xl! flex items-center rounded-xl gap-2"
                title={shiftRequired && !shift ? "Select a shift at the top of the page first" : undefined}
              >
                <IoDownloadOutline size={20} /> {exporting ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard label="Total Sold Stock" value={totalSold} accent tip="reports.bar.totalSold" />
            <SummaryCard label="Total Amount" value={money(totalAmount)} tip="reports.bar.totalAmount" />
          </div>

          <ReportSection title="Stock" tip="reports.bar.stock">
            {data.rows.length === 0 ? (
              <EmptyRow />
            ) : (
              <table className="w-full text-xl">
                <TableHead cells={["Stock", "Opening", "Added", "Total (before sales)", "Damaged", "Sold", "Unit Cost Price", "Total Amount", "Closing", "Service Charge", "Remark", ...(showAudit ? ["Action"] : [])]} tips={{ "Stock": "reports.bar.col.stock", "Opening": "reports.bar.col.opening", "Added": "reports.bar.col.added", "Total (before sales)": "reports.bar.col.totalBefore", "Damaged": "reports.bar.col.damaged", "Sold": "reports.bar.col.sold", "Unit Cost Price": "reports.bar.col.unitPrice", "Total Amount": "reports.bar.col.totalAmount", "Closing": "reports.bar.col.closing", "Service Charge": "reports.bar.col.serviceCharge", "Remark": "reports.bar.col.remark" }} />
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.drink_item_id} className={table.row}>
                      <td className={`px-6 py-4 font-medium text-[color:var(--black)] ${table.stickyTd}`}>{r.stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.opening_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.added_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.total_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.damaged_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{r.sold_stock}</td>
                      <td className="px-6 py-4 text-[color:var(--text-color)]/84">{money(r.unit_cost_price)}</td>
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
            <ReportSection title="Daily Totals" subtitle="Combined Food + Drink figures for this business day" tip="reports.bar.daily">
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
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/60 text-2xl w-full">
          Pick a date, then click <strong>Generate Report</strong>.
        </div>
      )}
    </div>
  );
}

function RoomStatusLine({ label, count, rooms, tip }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xl font-bold text-[color:var(--black)]">{label} ({count}){tip && <Tip id={tip} />}</p>
      <p className="text-xl text-[color:var(--text-color)]/76">{rooms}</p>
    </div>
  );
}

// ─── Shared bits ────────────────────────────────────────────────────────────

function RangePicker({ from, to, setFrom, setTo, onGenerate, loading }) {
  return (
    <div className="bg-(--card) rounded-xl border border-(--accent-2) p-6 flex flex-wrap gap-4 items-end w-full">
      <div className="flex flex-col gap-2">
        <label className="text-xl font-semibold text-[color:var(--text-color)]/76">From<Tip id="reports.from" /></label>
        <DateInput
          value={from}
          onChange={(e) => {
            const newFrom = e.target.value;
            setFrom(newFrom);
            if (newFrom && to && newFrom > to) setTo(newFrom);
          }}
          className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xl font-semibold text-[color:var(--text-color)]/76">To<Tip id="reports.to" /></label>
        <DateInput
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
          className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
        />
      </div>
      <Button onClick={onGenerate} disabled={loading} variant="emphasis" className={`text-xl! pb-5 pt-4.5 rounded-xl ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
        <span className="inline-flex items-center gap-2">{loading && <LoadingSpinner size="sm" light />}Generate Report</span>
      </Button>
    </div>
  );
}

// ReportSection, TableHead, EmptyRow, SummaryCard, OccupancyBadge and
// StaffActivitySection live in components/shared/reportUi.jsx (imported at
// the top of this file), shared by every report tab.
