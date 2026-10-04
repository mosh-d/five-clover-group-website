"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPaymentMethod } from "@/lib/pms/format";
import { GuestTagPills } from "@/components/pms/GuestName";
import { DataTable, HeatGrid, StatRow, StatTile, SectionTitle, StateChip, Remark, Choice } from "./parts";
import { AbbrLabel, ABBREVIATIONS } from "@/components/pms/InfoTip";
import {
  DASH,
  naira,
  nairaShort,
  count,
  decimal,
  percent,
  plural,
  shareOf,
  dayText,
  shortDay,
  momentText,
  momentDay,
  periodText,
  change,
} from "./format";

// One view per metric (see catalog.js). Each gets the server's answer for
// its metric and lays it out: headline tiles, then the branches side by side.

const BRANCH = { label: "Branch", tip: "metrics.col.branch", render: (r) => r.branch_name, value: (r) => r.branch_name };
const byBranch = (r) => r.branch_id;

// Column makers. `get` reads the figure from a row (or the total row).
const moneyCol = (key, label, get, extra = {}) => ({ key, label, value: get, render: (r) => naira(get(r)), align: "right", ...extra });
const countCol = (key, label, get, extra = {}) => ({ key, label, value: get, render: (r) => count(get(r)), align: "right", ...extra });
const pctCol = (key, label, get, extra = {}) => ({ key, label, value: get, render: (r) => percent(get(r)), align: "right", barMax: 100, ...extra });
const decCol = (key, label, get, extra = {}) => ({ key, label, value: get, render: (r) => decimal(get(r)), align: "right", ...extra });
const textCol = (key, label, get, extra = {}) => ({ key, label, value: get, render: (r) => get(r) ?? DASH, ...extra });

const roleLabel = (role) => (role ? role.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : DASH);

const sumRows = (rows, get) => rows.reduce((s, r) => s + (Number(get(r)) || 0), 0);
const vs = (data) => (data.previous ? periodText(data.previous) : null);
const changeCol = (key, label, now, before, kind) => ({
  key,
  label,
  align: "right",
  value: (r) => (now(r) === null || now(r) === undefined || before(r) === null || before(r) === undefined ? null : now(r) - before(r)),
  render: (r) => change(now(r), before(r), kind)?.text ?? DASH,
});
// "1 Sep, 4 Sep, 9 Sep +3 more"
const someDays = (days, shown = 4) =>
  days.length === 0 ? "" : days.slice(0, shown).map(shortDay).join(", ") + (days.length > shown ? ` +${days.length - shown} more` : "");
const nothingNote = (rows, get, what) => (sumRows(rows, get) === 0 ? <Remark>No branch recorded {what} in these dates.</Remark> : null);

// Days, or months for a long range, for the shaded grids.
function gridColumns(dates) {
  if (dates.length <= 62) {
    return dates.map((d) => ({ key: d, label: String(Number(d.slice(8, 10))), sub: dayText(d, { weekday: "short", day: undefined, month: undefined, year: undefined }), days: [d] }));
  }
  const months = new Map();
  for (const d of dates) {
    const k = d.slice(0, 7);
    if (!months.has(k)) months.set(k, []);
    months.get(k).push(d);
  }
  return [...months.entries()].map(([k, days]) => ({
    key: k,
    label: dayText(`${k}-15`, { day: undefined, year: undefined }),
    sub: k.slice(0, 4),
    days,
  }));
}

// ===================================================== rooms and revenue

function OccupancyView({ data }) {
  const t = data.total;
  const ranked = data.rows.filter((r) => r.sold > 0).sort((a, b) => b.occupancy_pct - a.occupancy_pct);
  const columns = gridColumns(Object.keys(t.by_day));
  const cellsFor = (byDay, rooms, label) =>
    Object.fromEntries(
      columns.map((c) => {
        const sold = c.days.reduce((s, d) => s + (byDay[d] || 0), 0);
        const p = rooms > 0 ? (sold / (rooms * c.days.length)) * 100 : null;
        const when = c.days.length === 1 ? dayText(c.days[0], { weekday: "short" }) : `${c.label} ${c.sub}`;
        return [c.key, { value: p, text: p === null ? DASH : String(Math.round(p)), tip: `${label} · ${when}: ${p === null ? DASH : `${p.toFixed(1)}% full`} (${decimal(Math.round(sold * 10) / 10)} room-nights of ${count(rooms * c.days.length)})` }];
      }),
    );
  const gridRows = [
    ...data.rows.filter((r) => r.rooms > 0).map((r) => ({ key: r.branch_id, label: r.branch_name, cells: cellsFor(r.by_day, r.rooms, r.branch_name) })),
    { key: "all", label: "All branches", cells: cellsFor(t.by_day, t.rooms, "All branches") },
  ];
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.occupancy.tile.group-occupancy" label="Group occupancy" value={percent(t.occupancy_pct)} delta={change(t.occupancy_pct, t.prev_occupancy_pct, "pts")} vs={vs(data)} />
        <StatTile tip="metrics.occupancy.tile.room-nights-sold" label="Room-nights sold" value={decimal(t.sold)} sub={`of ${count(t.available)} available: ${count(t.rooms)} rooms × ${plural(data.period.days, "day")}`} />
        <StatTile
          tip="metrics.occupancy.tile.fullest-branch" label="Fullest branch"
          value={ranked[0] ? ranked[0].branch_name : DASH}
          sub={ranked[0] ? `${percent(ranked[0].occupancy_pct)} full; ${plural(data.rows.length - ranked.length, "branch", "branches")} sold nothing` : "No room sold at any branch in these dates."}
        />
      </StatRow>
      <DataTable
        tipPrefix="metrics.occupancy"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "occupancy", dir: "desc" }}
        columns={[
          countCol("rooms", "Rooms", (r) => r.rooms),
          decCol("sold", "Room-Nights Sold", (r) => r.sold),
          countCol("available", "Available", (r) => r.available),
          pctCol("occupancy", "Occupancy", (r) => r.occupancy_pct, { bar: true }),
          pctCol("prev", "Previous Period", (r) => r.prev_occupancy_pct),
          changeCol("change", "Change", (r) => r.occupancy_pct, (r) => r.prev_occupancy_pct, "pts"),
        ]}
      />
      <SectionTitle tip="metrics.occupancy.section1" sub={columns[0]?.days.length === 1 ? "Percent full, day by day." : "Percent full, month by month."}>
        {columns[0]?.days.length === 1 ? "Day by day" : "Month by month"}
      </SectionTitle>
      <HeatGrid rows={gridRows} columns={columns} max={100} legendLow="0% full" legendHigh="100% full" caption="Occupancy by branch and day" />
    </>
  );
}

function AdrRevparView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile label={<AbbrLabel term="ADR" label="Group ADR" />} value={naira(t.adr)} delta={change(t.adr, t.prev_adr)} vs={vs(data)} sub="Average room rate per room-night sold" />
        <StatTile label={<AbbrLabel term="RevPAR" label="Group RevPAR" />} value={naira(t.revpar)} delta={change(t.revpar, t.prev_revpar)} vs={vs(data)} sub="Room revenue per room-night available" />
        <StatTile tip="metrics.adr-revpar.tile.room-revenue" label="Room revenue" value={naira(t.room_revenue)} sub={`from ${decimal(t.sold)} room-nights sold`} />
      </StatRow>
      <DataTable
        tipPrefix="metrics.adr-revpar"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "revpar", dir: "desc" }}
        columns={[
          moneyCol("room_revenue", "Room Revenue", (r) => r.room_revenue),
          decCol("sold", "Room-Nights Sold", (r) => r.sold),
          moneyCol("adr", "ADR", (r) => r.adr, { bar: true, hint: ABBREVIATIONS.ADR }),
          moneyCol("prev_adr", "ADR Before", (r) => r.prev_adr, { hint: ABBREVIATIONS.ADR }),
          moneyCol("revpar", "RevPAR", (r) => r.revpar, { bar: true, hint: ABBREVIATIONS.RevPAR }),
          moneyCol("prev_revpar", "RevPAR Before", (r) => r.prev_revpar, { hint: ABBREVIATIONS.RevPAR }),
          pctCol("occupancy", "Occupancy", (r) => r.occupancy_pct),
        ]}
      />
    </>
  );
}

function TrevparView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile label={<AbbrLabel term="TRevPAR" label="Group TRevPAR" />} value={naira(t.trevpar)} delta={change(t.trevpar, t.prev_trevpar)} vs={vs(data)} sub={`RevPAR ${naira(t.revpar)} from rooms alone`} />
        <StatTile tip="metrics.trevpar.tile.total-revenue" label="Total revenue" value={naira(t.total_revenue)} sub="Everything charged, guests and non-guests" />
        <StatTile tip="metrics.trevpar.tile.beyond-rooms" label="Beyond rooms" value={percent(t.beyond_rooms_pct)} sub="Share of revenue from breakfast, food, drinks, laundry and other charges" />
      </StatRow>
      <DataTable
        tipPrefix="metrics.trevpar"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "trevpar", dir: "desc" }}
        columns={[
          moneyCol("total_revenue", "Total Revenue", (r) => r.total_revenue),
          moneyCol("room_revenue", "Room Revenue", (r) => r.room_revenue),
          moneyCol("revpar", "RevPAR", (r) => r.revpar, { hint: ABBREVIATIONS.RevPAR }),
          moneyCol("trevpar", "TRevPAR", (r) => r.trevpar, { bar: true, hint: ABBREVIATIONS.TRevPAR }),
          moneyCol("prev_trevpar", "TRevPAR Before", (r) => r.prev_trevpar, { hint: ABBREVIATIONS.TRevPAR }),
          pctCol("beyond", "Beyond Rooms", (r) => r.beyond_rooms_pct),
        ]}
      />
    </>
  );
}

function RevenueMixView({ data }) {
  const t = data.total;
  const share = (key) => (r) => percent(shareOf(r[key], r.total));
  const part = (key, label) => moneyCol(key, label, (r) => r[key], { sub: share(key) });
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.revenue-mix.tile.total-revenue" label="Total revenue" value={naira(t.total)} sub="Everything charged in these dates" />
        <StatTile tip="metrics.revenue-mix.tile.rooms" label="Rooms" value={percent(shareOf(t.rooms, t.total))} sub={`${naira(t.rooms)}; breakfast a further ${percent(shareOf(t.breakfast, t.total))}`} />
        <StatTile tip="metrics.revenue-mix.tile.food-and-drink" label="Food and drink" value={percent(shareOf(t.food + t.drinks, t.total))} sub={`${naira(t.food + t.drinks)}, guests and non-guests`} />
      </StatRow>
      {nothingNote(data.rows, (r) => Math.abs(r.total) + Math.abs(r.rooms), "any charges")}
      <DataTable
        tipPrefix="metrics.revenue-mix"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "total", dir: "desc" }}
        columns={[
          part("rooms", "Rooms"),
          part("breakfast", "Breakfast"),
          part("food", "Food"),
          part("drinks", "Drinks"),
          part("laundry", "Laundry"),
          part("other", "Other"),
          moneyCol("adjustments", "Adjustments", (r) => r.adjustments),
          moneyCol("total", "Total", (r) => r.total, { bar: true }),
        ]}
      />
    </>
  );
}

function StayLengthView({ data }) {
  const t = data.total;
  const channel = (key, label, withLead) => ({
    key,
    label,
    align: "right",
    value: (r) => r[key].avg_nights,
    render: (r) => (r[key].stays ? `${decimal(r[key].avg_nights)} nights` : DASH),
    sub: (r) =>
      r[key].stays ? `${plural(r[key].stays, "stay")}${withLead ? `; booked ${decimal(r[key].avg_lead_days)} days ahead` : ""}` : "",
  });
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.stay-length.tile.average-stay" label="Average stay" value={t.all.stays ? `${decimal(t.all.avg_nights)} nights` : DASH} sub={plural(t.all.stays, "stay")} />
        <StatTile tip="metrics.stay-length.tile.one-night-stays" label="One-night stays" value={percent(shareOf(t.all.one_night, t.all.stays))} sub={`${count(t.all.one_night)} of ${count(t.all.stays)}`} />
        <StatTile
          tip="metrics.stay-length.tile.website-lead-time" label="Website lead time"
          value={t.website.stays ? `${decimal(t.website.avg_lead_days)} days` : DASH}
          sub={t.website.stays ? `Average days from booking to arrival, ${plural(t.website.stays, "website booking")}` : "No website guests arrived in these dates."}
        />
      </StatRow>
      {nothingNote(data.rows, (r) => r.all.stays, "any stays")}
      <DataTable
        tipPrefix="metrics.stay-length"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "stays", dir: "desc" }}
        columns={[
          countCol("stays", "Stays", (r) => r.all.stays),
          decCol("avg", "Average Nights", (r) => r.all.avg_nights, { bar: true }),
          countCol("one", "1 Night", (r) => r.all.one_night),
          countCol("two", "2–3 Nights", (r) => r.all.two_three),
          countCol("four", "4–7 Nights", (r) => r.all.four_seven),
          countCol("week", "Over a Week", (r) => r.all.over_week),
          channel("walk_in", "Walk-In", false),
          channel("website", "Website", true),
          { ...channel("ota", "OTA", false), hint: ABBREVIATIONS.OTA },
        ]}
      />
    </>
  );
}

function ChannelsView({ data }) {
  const t = data.total;
  const channel = (key, label) => ({
    key,
    label,
    align: "right",
    value: (r) => r[key].revenue,
    render: (r) => naira(r[key].revenue),
    sub: (r) => (r[key].stays ? `${plural(r[key].stays, "stay")}; ${percent(shareOf(r[key].revenue, r.revenue))}` : ""),
  });
  const tile = (key, label) => (
    <StatTile tip={`metrics.channels.tile.${key}`} label={label} value={percent(shareOf(t[key].revenue, t.revenue))} sub={`${naira(t[key].revenue)} from ${plural(t[key].stays, "stay")}`} />
  );
  return (
    <>
      <StatRow>
        {tile("walk_in", "Walk-ins")}
        {tile("website", "Website")}
        {tile("ota", <AbbrLabel term="OTA" label="OTAs" />)}
      </StatRow>
      {nothingNote(data.rows, (r) => r.revenue, "any room charges")}
      <DataTable
        tipPrefix="metrics.channels"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "revenue", dir: "desc" }}
        columns={[
          channel("walk_in", "Walk-In"),
          channel("website", "Website"),
          { ...channel("ota", "OTA"), hint: ABBREVIATIONS.OTA },
          moneyCol("revenue", "Room and Breakfast", (r) => r.revenue, { bar: true }),
          countCol("stays", "Stays", (r) => r.stays),
        ]}
      />
    </>
  );
}

function CancellationsView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.cancellations.tile.cancelled-after-booking" label="Cancelled after booking" value={percent(t.cancel_pct)} sub={`${count(t.cancelled)} of ${plural(t.bookings, "booking")}`} />
        <StatTile tip="metrics.cancellations.tile.website-bookings-never-paid" label="Website bookings never paid" value={percent(t.lapse_pct)} sub={`${count(t.lapsed)} of ${plural(t.website_bookings, "website booking")}`} />
        <StatTile tip="metrics.cancellations.tile.no-shows-marked" label="No-shows marked" value={count(t.no_shows)} sub={`${percent(t.no_show_pct)} of bookings`} />
      </StatRow>
      {t.lapse_pct >= 50 && (
        <Remark>
          {percent(t.lapse_pct)} of website bookings for these dates were never paid for: the room was held, then released when payment didn&apos;t
          come. That points at the website&apos;s payment step, or at guests booking without meaning to pay online - worth looking into.
        </Remark>
      )}
      {t.bookings > 0 && t.no_shows === 0 && (
        <Remark>
          No branch marked a no-show in these dates. A guest who never arrives should be marked as a no-show (not cancelled), so how often it
          happens can be seen here.
        </Remark>
      )}
      <DataTable
        tipPrefix="metrics.cancellations"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "bookings", dir: "desc" }}
        columns={[
          countCol("bookings", "Bookings", (r) => r.bookings),
          countCol("stayed", "Stayed", (r) => r.stayed),
          countCol("cancelled", "Cancelled", (r) => r.cancelled),
          pctCol("cancel_pct", "Cancel Rate", (r) => r.cancel_pct, { bar: true }),
          countCol("no_shows", "No-Shows", (r) => r.no_shows),
          countCol("website", "Website Bookings", (r) => r.website_bookings),
          countCol("lapsed", "Never Paid", (r) => r.lapsed),
          pctCol("lapse_pct", "Never-Paid Rate", (r) => r.lapse_pct),
        ]}
      />
    </>
  );
}

function DiscountsView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.discounts.tile.discounts-given" label="Discounts given" value={naira(t.discount)} sub={`on ${count(t.discounted)} of ${plural(t.stays, "stay")} (${percent(t.discounted_pct)})`} />
        <StatTile tip="metrics.discounts.tile.average-discount" label="Average discount" value={percent(t.avg_discount_pct)} sub="Off the standard price, where one was given" />
        <StatTile
          tip="metrics.discounts.tile.largest-single-discount" label="Largest single discount"
          value={data.biggest[0] ? naira(data.biggest[0].discount) : DASH}
          sub={data.biggest[0] ? `${data.biggest[0].branch_name}, set by ${data.biggest[0].set_by}` : "No discounts in these dates."}
        />
      </StatRow>
      {data.price_changes.length > 0 && (
        <Remark>
          Room prices changed since these dates began ({data.price_changes.map((c) => `${c.branch_name}: ${c.label}, ${dayText(c.at)}`).join("; ")}). Stays
          are compared with today&apos;s prices, so stays booked before a change may show a difference that was the old price, not a discount.
        </Remark>
      )}
      <DataTable
        tipPrefix="metrics.discounts"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "discount", dir: "desc" }}
        columns={[
          countCol("stays", "Stays", (r) => r.stays),
          countCol("discounted", "Below Standard", (r) => r.discounted),
          pctCol("discounted_pct", "Share", (r) => r.discounted_pct),
          moneyCol("discount", "Discounts Given", (r) => r.discount, { bar: true }),
          pctCol("avg", "Average Discount", (r) => r.avg_discount_pct),
        ]}
      />
      <SectionTitle tip="metrics.discounts.section1" sub="Whoever checked the guest in set the rate; a website booking's price is the website's.">By who set the rate</SectionTitle>
      <DataTable
        tipPrefix="metrics.discounts.staff"
        rows={data.by_staff}
        first={{ label: "Staff", render: (r) => r.staff_name, value: (r) => r.staff_name }}
        rowKey={(r) => r.key}
        defaultSort={{ key: "discount", dir: "desc" }}
        empty="No discounts in these dates."
        columns={[
          textCol("branch", "Branch", (r) => r.branch_name),
          countCol("discounted", "Stays Discounted", (r) => r.discounted),
          moneyCol("discount", "Discounts Given", (r) => r.discount, { bar: true }),
          moneyCol("largest", "Largest", (r) => r.largest),
        ]}
      />
      {data.biggest.length > 0 && (
        <>
          <SectionTitle tip="metrics.discounts.section2" sub="The biggest discounts in these dates, largest first.">Largest discounts</SectionTitle>
          <DataTable
            tipPrefix="metrics.discounts.largest"
            rows={data.biggest}
            first={{ label: "Guest", render: (r) => r.guest_name, value: (r) => r.guest_name }}
            rowKey={(r) => r.reservation_id}
            defaultSort={{ key: "discount", dir: "desc" }}
            columns={[
              textCol("branch", "Branch", (r) => r.branch_name),
              textCol("type", "Room Type", (r) => r.room_type_name),
              textCol("check_in", "Check-In", (r) => r.check_in, { render: (r) => dayText(r.check_in) }),
              countCol("nights", "Nights", (r) => r.nights),
              moneyCol("standard", "Standard Price", (r) => r.standard),
              moneyCol("charged", "Charged", (r) => r.charged),
              moneyCol("discount", "Discount", (r) => r.discount),
              textCol("set_by", "Set By", (r) => r.set_by),
            ]}
          />
        </>
      )}
    </>
  );
}

function ComplimentaryView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.complimentary.tile.nights-with-no-room-charge" label="Nights with no room charge" value={count(t.nights)} sub={`across ${plural(t.stays, "stay")}`} />
        <StatTile tip="metrics.complimentary.tile.worth-at-standard-prices" label="Worth at standard prices" value={naira(t.worth)} sub="What those nights would have been charged" />
        <StatTile tip="metrics.complimentary.tile.complimentary-rooms-now" label="Complimentary rooms now" value={count(t.complimentary_now)} sub="Rooms marked complimentary at the moment" />
      </StatRow>
      <p className="text-xl text-(--text-color)/68">
        {data.counted_to ? `Counted up to the night of ${dayText(data.counted_to)}.` : "No night in these dates has ended yet."}
      </p>
      <DataTable
        tipPrefix="metrics.complimentary"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "worth", dir: "desc" }}
        columns={[
          countCol("stays", "Stays", (r) => r.stays),
          countCol("nights", "Nights", (r) => r.nights),
          moneyCol("worth", "Worth", (r) => r.worth, { bar: true }),
          countCol("now", "Complimentary Now", (r) => r.complimentary_now),
        ]}
      />
      {data.stays.length > 0 && (
        <>
          <SectionTitle tip="metrics.complimentary.section1" sub="Each stay with a night that had no room charge.">The stays</SectionTitle>
          <DataTable
            tipPrefix="metrics.complimentary.stays"
            rows={data.stays}
            first={{ label: "Guest", render: (r) => r.guest_name, value: (r) => r.guest_name }}
            rowKey={(r) => r.reservation_id}
            defaultSort={{ key: "worth", dir: "desc" }}
            columns={[
              textCol("branch", "Branch", (r) => r.branch_name),
              textCol("rooms", "Room", (r) => r.rooms),
              textCol("type", "Room Type", (r) => r.room_type_name),
              countCol("nights", "Nights", (r) => r.nights),
              textCol("when", "Nights Of", (r) => r.first_night, {
                render: (r) => (r.first_night === r.last_night ? shortDay(r.first_night) : `${shortDay(r.first_night)} – ${shortDay(r.last_night)}`),
              }),
              moneyCol("worth", "Worth", (r) => r.worth),
            ]}
          />
        </>
      )}
    </>
  );
}

// From one of the rooms out of order selling to all of them (owner,
// 2026-10-02) - one figure when the two meet. Sorted by the high end.
const lossRange = (low, high) => (Math.round(Number(low) || 0) >= Math.round(Number(high) || 0) ? naira(high) : `${naira(low)} – ${naira(high)}`);

function OutOfOrderView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.out-of-order.tile.rooms-out-of-order" label="Rooms out of order" value={count(t.rooms_out)} sub={`out for ${plural(t.nights_out, "night")} between them`} />
        <StatTile tip="metrics.out-of-order.tile.potential-loss" label="Potential loss" value={lossRange(t.lost_at_least, t.lost_up_to)} sub={`Bookings they may have cost, over ${plural(t.sold_out_nights, "sold-out night")}`} />
        <StatTile tip="metrics.out-of-order.tile.counted-to" label="Counted to" value={dayText(data.last_night)} sub="The last night that has ended" />
      </StatRow>
      <DataTable
        tipPrefix="metrics.out-of-order"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "lost", dir: "desc" }}
        columns={[
          countCol("rooms_out", "Rooms OOO", (r) => r.rooms_out, { hint: "Out of Order" }),
          countCol("nights_out", "Nights OOO", (r) => r.nights_out, { hint: "Out of Order" }),
          countCol("sold_out", "Sold-Out Nights", (r) => r.sold_out_nights),
          moneyCol("lost", "Potential Loss", (r) => r.lost_up_to, { bar: true, render: (r) => lossRange(r.lost_at_least, r.lost_up_to) }),
          textCol("since", "OOO Since", (r) => r.out_since, { hint: "Out of Order", render: (r) => (r.out_since ? momentText(r.out_since) : DASH) }),
        ]}
      />
      <p className="text-xl text-(--text-color)/68">
        Every room, ranked by what to fix first, is on{" "}
        <Link href="/pms/decision-support" className="underline font-semibold">Decision Support</Link>.
      </p>
    </>
  );
}

// ============================================== money and credit control

function CollectionsView({ data }) {
  const t = data.total;
  const methodCols = data.methods.map((m) => moneyCol(`m:${m}`, formatPaymentMethod(m), (r) => r.by_method[m] || 0, { tip: "metrics.collections.method" }));
  const active = data.rows.filter((r) => r.movements > 0);
  const columns = gridColumns(Object.keys(t.by_day));
  const max = Math.max(0, ...active.flatMap((r) => columns.map((c) => c.days.reduce((s, d) => s + (r.by_day[d] || 0), 0))));
  const gridRows = active.map((r) => ({
    key: r.branch_id,
    label: r.branch_name,
    cells: Object.fromEntries(
      columns.map((c) => {
        const v = c.days.reduce((s, d) => s + (r.by_day[d] || 0), 0);
        const when = c.days.length === 1 ? dayText(c.days[0], { weekday: "short" }) : `${c.label} ${c.sub}`;
        return [c.key, { value: v, text: v === 0 ? "0" : nairaShort(v).replace("₦", ""), tip: `${r.branch_name} · ${when}: ${naira(v)} collected` }];
      }),
    ),
  }));
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.collections.tile.collected" label="Collected" value={naira(t.net)} sub={`${naira(t.money_in)} taken, ${naira(t.money_out)} paid back out`} />
        <StatTile tip="metrics.collections.tile.paid-back-out" label="Paid back out" value={naira(t.money_out)} sub="Refunds and credit refunds" />
        <StatTile tip="metrics.collections.tile.cash-share" label="Cash share" value={percent(t.cash_pct)} sub="Of money collected; cash is the hardest to account for" />
      </StatRow>
      {nothingNote(data.rows, (r) => r.movements, "any money in or out")}
      <DataTable
        tipPrefix="metrics.collections"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "net", dir: "desc" }}
        columns={[
          ...methodCols,
          moneyCol("in", "Money In", (r) => r.money_in),
          moneyCol("out", "Paid Back Out", (r) => r.money_out),
          moneyCol("net", "Collected", (r) => r.net, { bar: true }),
          pctCol("cash", "Cash Share", (r) => r.cash_pct),
        ]}
      />
      {gridRows.length > 0 && (
        <>
          <SectionTitle tip="metrics.collections.section1" sub="Money collected each business day (6am to 6am), net of anything paid back out. Branches that collected nothing are left out.">
            {columns[0]?.days.length === 1 ? "Day by day" : "Month by month"}
          </SectionTitle>
          <HeatGrid rows={gridRows} columns={columns} max={max} legendLow="Less" legendHigh={`More (${nairaShort(max)})`} caption="Money collected by branch and day" />
        </>
      )}
    </>
  );
}

function OutstandingView({ data }) {
  const t = data.total;
  const owed = (key, label, extra = {}) => ({
    key,
    label,
    align: "right",
    value: (r) => r[key].amount,
    render: (r) => naira(r[key].amount),
    sub: (r) => (r[key].count ? plural(r[key].count, "bill") : ""),
    ...extra,
  });
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.outstanding.tile.owed-by-guests" label="Owed by guests" value={naira(t.guests.amount)} sub={`${plural(t.guests.count, "bill")}; each branch's Overview "Outstanding"`} />
        <StatTile tip="metrics.outstanding.tile.owed-by-non-guests" label="Owed by non-guests" value={naira(t.non_guests.amount)} sub={plural(t.non_guests.count, "open bill")} />
        <StatTile tip="metrics.outstanding.tile.owed-over-30-days" label="Owed over 30 days" value={naira(t.d31_plus.amount)} sub={`${plural(t.d31_plus.count, "guest")} who left more than a month ago`} />
      </StatRow>
      <DataTable
        tipPrefix="metrics.outstanding"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "total", dir: "desc" }}
        columns={[
          owed("in_house", "In House"),
          owed("d0_7", "Left 0–7 Days"),
          owed("d8_30", "Left 8–30 Days"),
          owed("d31_plus", "Left Over 30 Days"),
          owed("other", "Other"),
          owed("non_guests", "Non-Guest Bills"),
          moneyCol("total", "Total Owed", (r) => r.total, { bar: true }),
        ]}
      />
      {data.oldest.length > 0 && (
        <>
          <SectionTitle tip="metrics.outstanding.section1" sub="The longest-standing debts first.">To chase</SectionTitle>
          <DataTable
            tipPrefix="metrics.outstanding.chase"
            rows={data.oldest}
            first={{ label: "Who", render: (r) => r.name, value: (r) => r.name }}
            rowKey={(r) => `${r.kind}-${r.branch_name}-${r.name}-${r.amount}-${r.days}`}
            columns={[
              textCol("branch", "Branch", (r) => r.branch_name),
              textCol("kind", "Guest or Non-Guest", (r) => (r.kind === "guest" ? "Guest (left)" : "Non-guest")),
              moneyCol("amount", "Owed", (r) => r.amount),
              countCol("days", "Days", (r) => r.days, { render: (r) => (r.days === null || r.days === undefined ? DASH : plural(r.days, "day")) }),
            ]}
          />
        </>
      )}
    </>
  );
}

function OtaView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile label={<AbbrLabel term="OTA" label="OTAs owe now" />} value={naira(t.waiting.amount)} sub={plural(t.waiting.count, "payment")} />
        <StatTile tip="metrics.ota.tile.longest-wait" label="Longest wait" value={t.waiting.oldest_days === null ? DASH : plural(t.waiting.oldest_days, "day")} sub="Since the nights an OTA owes for ended" />
        <StatTile
          tip="metrics.ota.tile.received-in-these-dates" label="Received in these dates"
          value={naira(t.received.amount)}
          sub={t.received.count ? `${plural(t.received.count, "payment")}; paid ${decimal(t.received.avg_days)} days after the stay on average` : "Nothing received in these dates."}
        />
      </StatRow>
      <DataTable
        tipPrefix="metrics.ota"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "waiting", dir: "desc" }}
        columns={[
          { key: "waiting", label: "Owed Now", align: "right", value: (r) => r.waiting.amount, render: (r) => naira(r.waiting.amount), sub: (r) => (r.waiting.count ? plural(r.waiting.count, "payment") : ""), bar: true },
          countCol("oldest", "Longest Wait", (r) => r.waiting.oldest_days, { render: (r) => (r.waiting.oldest_days === null ? DASH : plural(r.waiting.oldest_days, "day")) }),
          { key: "received", label: "Received", align: "right", value: (r) => r.received.amount, render: (r) => naira(r.received.amount), sub: (r) => (r.received.count ? plural(r.received.count, "payment") : "") },
          decCol("avg_days", "Average Days to Pay", (r) => r.received.avg_days),
        ]}
      />
      {data.still_waiting.length > 0 && (
        <>
          <SectionTitle tip="metrics.ota.section1" sub="Longest waiting first.">Still waiting</SectionTitle>
          <DataTable
            tipPrefix="metrics.ota.waiting"
            rows={data.still_waiting}
            first={{ label: "Guest", render: (r) => r.guest_name || DASH, value: (r) => r.guest_name }}
            rowKey={(r) => r.id}
            columns={[
              textCol("branch", "Branch", (r) => r.branch_name),
              textCol("reference", "OTA Reference", (r) => r.reference, { hint: ABBREVIATIONS.OTA }),
              textCol("nights", "Nights", (r) => r.start_date, { render: (r) => `${shortDay(r.start_date)} – ${shortDay(r.end_date)}` }),
              moneyCol("amount", "Amount", (r) => r.amount),
              countCol("waiting", "Waiting", (r) => r.days_waiting, { render: (r) => (r.days_waiting === null ? "Stay not over" : plural(r.days_waiting, "day")) }),
            ]}
          />
        </>
      )}
    </>
  );
}

function CreditHeldView({ data }) {
  const t = data.total;
  const held = (key, label, extra = {}) => ({
    key,
    label,
    align: "right",
    value: (r) => r[key].amount,
    render: (r) => naira(r[key].amount),
    sub: (r) => (r[key].count ? plural(r[key].count, "credit") : ""),
    ...extra,
  });
  const toChase = t.departed.amount + t.cancelled.amount;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.credit-held.tile.credit-held" label="Credit held" value={naira(t.total)} sub="Paid in, not yet spent or given back" />
        <StatTile tip="metrics.credit-held.tile.to-chase" label="To chase" value={naira(toChase)} sub={`${plural(t.departed.count + t.cancelled.count, "credit")} for guests who left or bookings that were cancelled`} />
        <StatTile tip="metrics.credit-held.tile.non-guest-credit" label="Non-guest credit" value={naira(t.non_guests.amount)} sub={plural(t.non_guests.count, "credit")} />
      </StatRow>
      <DataTable
        tipPrefix="metrics.credit-held"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "total", dir: "desc" }}
        columns={[
          held("in_house", "Guest In House"),
          held("upcoming", "Booking Ahead"),
          held("departed", "Guest Left"),
          held("cancelled", "Booking Cancelled"),
          held("other", "Other"),
          held("non_guests", "Non-Guests"),
          moneyCol("total", "Total Held", (r) => r.total, { bar: true }),
        ]}
      />
      {data.to_chase.length > 0 && (
        <>
          <SectionTitle tip="metrics.credit-held.section1" sub="Credit nobody is coming back to the desk for: refund it, or move it to a booking the guest has. Oldest first.">To chase</SectionTitle>
          <DataTable
            tipPrefix="metrics.credit-held.chase"
            rows={data.to_chase}
            first={{ label: "Guest", render: (r) => r.guest_name, value: (r) => r.guest_name }}
            rowKey={(r) => r.id}
            columns={[
              textCol("branch", "Branch", (r) => r.branch_name),
              textCol("stay", "Stay", (r) => (r.stay === "departed" ? "Left" : "Cancelled")),
              moneyCol("amount", "Credit", (r) => r.amount),
              textCol("since", "Since", (r) => r.since, { render: (r) => (r.since ? momentText(r.since) : DASH) }),
            ]}
          />
        </>
      )}
    </>
  );
}

function ExceptionsView({ data, branchOptions }) {
  const t = data.total;
  const [branch, setBranch] = useState("");
  const people = branch ? data.rows.filter((r) => String(r.branch_id) === branch) : data.rows;
  const cell = (key, label, amountKey = "amount", extra = {}) => ({
    key,
    label,
    align: "right",
    value: (r) => r[key][amountKey],
    render: (r) => naira(r[key][amountKey]),
    sub: (r) => (r[key].count ? `${count(r[key].count)}×` : ""),
    ...extra,
  });
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.exceptions.tile.given-back-or-taken-off" label="Given back or taken off" value={naira(t.total)} sub="All six kinds together" />
        <StatTile tip="metrics.exceptions.tile.refunds-and-credit-refunds" label="Refunds and credit refunds" value={naira(t.refunds + t.credit_refunds)} sub={`${naira(t.refunds)} refunded, ${naira(t.credit_refunds)} credit paid back`} />
        <StatTile label={<AbbrLabel term="F&B" label="Discounts and free F&B" />} value={naira(t.discounts + t.free_fnb)} sub={`${naira(t.discounts)} in rates, ${naira(t.free_fnb)} in food and drink`} />
      </StatRow>
      <DataTable
        tipPrefix="metrics.exceptions"
        rows={data.by_branch}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "total", dir: "desc" }}
        columns={[
          moneyCol("refunds", "Refunds", (r) => r.refunds),
          moneyCol("credit_refunds", "Credit Refunds", (r) => r.credit_refunds),
          moneyCol("adjustments", "Adjustments", (r) => r.adjustments),
          moneyCol("corrections", "Corrections", (r) => r.corrections),
          moneyCol("discounts", "Rate Discounts", (r) => r.discounts),
          moneyCol("free_fnb", "Free F&B", (r) => r.free_fnb, { hint: ABBREVIATIONS["F&B"] }),
          moneyCol("total", "Total", (r) => r.total, { bar: true }),
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle tip="metrics.exceptions.section1" sub="Largest first. Adjustments and corrections show what was taken off bills.">By staff member</SectionTitle>
        <Choice id="exceptions-branch" tip="metrics.branchChoice" label="Branch" value={branch} onChange={setBranch} options={[{ value: "", label: "All branches" }, ...branchOptions]} />
      </div>
      <DataTable
        tipPrefix="metrics.exceptions.staff"
        rows={people}
        first={{ label: "Staff", render: (r) => r.staff_name, value: (r) => r.staff_name }}
        rowKey={(r) => r.key}
        defaultSort={{ key: "total", dir: "desc" }}
        empty="Nothing given back or taken off by anyone in these dates."
        columns={[
          textCol("branch", "Branch", (r) => r.branch_name),
          textCol("role", "Role", (r) => r.role, { render: (r) => roleLabel(r.role) }),
          cell("refunds", "Refunds"),
          cell("credit_refunds", "Credit Refunds"),
          cell("adjustments", "Adjustments", "taken_off"),
          cell("corrections", "Corrections", "taken_off"),
          cell("discounts", "Rate Discounts"),
          { ...cell("free_fnb", "Free F&B"), hint: ABBREVIATIONS["F&B"] },
          moneyCol("total", "Total", (r) => r.total, { bar: true }),
        ]}
      />
    </>
  );
}

// ================================================================ guests

function RepeatGuestsView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.repeat-guests.tile.returning-guests" label="Returning guests" value={percent(t.returning_pct)} sub={`${count(t.returning)} of ${plural(t.guests, "guest")} had stayed with the group before`} />
        <StatTile tip="metrics.repeat-guests.tile.guests-who-checked-in" label="Guests who checked in" value={count(t.guests)} sub="Each person counted once, whichever branches they stayed at" />
        <StatTile tip="metrics.repeat-guests.tile.first-stayed-at-another-branch" label="First stayed at another branch" value={count(t.first_elsewhere)} sub="Returning guests whose first stay was at a different branch" />
      </StatRow>
      {data.stays_without_phone > 0 && (
        <Remark>{plural(data.stays_without_phone, "stay")} in these dates had no phone number, so can&apos;t be matched to earlier stays and are left out.</Remark>
      )}
      <DataTable
        tipPrefix="metrics.repeat-guests"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "guests", dir: "desc" }}
        columns={[
          countCol("guests", "Guests", (r) => r.guests),
          countCol("returning", "Returning", (r) => r.returning),
          pctCol("share", "Returning Share", (r) => r.returning_pct, { bar: true }),
          countCol("elsewhere", "First Stayed Elsewhere", (r) => r.first_elsewhere),
        ]}
      />
    </>
  );
}

function TopGuestsView({ data }) {
  return (
    <DataTable
      tipPrefix="metrics.top-guests"
      rows={data.rows}
      first={{
        label: "Guest",
        value: (r) => r.guest_name,
        render: (r) => (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-normal text-(--text-color)/55">{r.rank}.</span>
            <span>{r.guest_name}</span>
            <GuestTagPills tags={r.guest_tags} />
          </span>
        ),
      }}
      rowKey={(r) => `${r.rank}-${r.guest_id}`}
      empty="No guest has stayed more than once yet."
      columns={[
        countCol("stays", "Stays", (r) => r.stays, { bar: true }),
        countCol("nights", "Nights", (r) => r.nights),
        moneyCol("billed", "Billed", (r) => r.billed),
        textCol("first", "First Stay", (r) => r.first_stay, { render: (r) => momentDay(r.first_stay) }),
        textCol("last", "Last Stay", (r) => r.last_stay, { render: (r) => momentDay(r.last_stay) }),
        textCol("branches", "Branches", (r) => r.branches.join(", ")),
      ]}
    />
  );
}

function ContactabilityView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.contactability.tile.bookings-with-an-email" label="Bookings with an email" value={percent(t.email_pct)} sub={`${count(t.with_email)} of ${plural(t.bookings, "booking")}`} />
        <StatTile tip="metrics.contactability.tile.bookings-with-a-phone-number" label="Bookings with a phone number" value={percent(t.phone_pct)} sub={`${count(t.with_phone)} of ${plural(t.bookings, "booking")}`} />
        <StatTile tip="metrics.contactability.tile.emails-bounced" label="Emails bounced" value={count(t.bounced)} sub="Addresses that couldn't be delivered to" />
      </StatRow>
      <DataTable
        tipPrefix="metrics.contactability"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "bookings", dir: "desc" }}
        columns={[
          countCol("bookings", "Bookings", (r) => r.bookings),
          countCol("phone", "With Phone", (r) => r.with_phone),
          pctCol("phone_pct", "Phone Share", (r) => r.phone_pct),
          countCol("email", "With Email", (r) => r.with_email),
          pctCol("email_pct", "Email Share", (r) => r.email_pct, { bar: true }),
          countCol("bounced", "Bounced", (r) => r.bounced),
        ]}
      />
    </>
  );
}

// =========================================================== F&B and stock

function FnbSalesView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile label={<AbbrLabel term="F&B" label="F&B sales" />} value={naira(t.total)} sub={`Food ${naira(t.food)}, drinks ${naira(t.drinks)}`} />
        <StatTile tip="metrics.fnb-sales.tile.per-room-night-sold" label="Per room-night sold" value={naira(t.per_room_night)} sub={`over ${decimal(t.room_nights)} room-nights`} />
        <StatTile tip="metrics.fnb-sales.tile.from-non-guests" label="From non-guests" value={naira(t.from_non_guests)} sub={`${percent(shareOf(t.from_non_guests, t.total))} of F&B sales`} />
      </StatRow>
      {nothingNote(data.rows, (r) => r.food_items + r.drink_items, "any food or drink orders")}
      <DataTable
        tipPrefix="metrics.fnb-sales"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "total", dir: "desc" }}
        columns={[
          moneyCol("food", "Food", (r) => r.food, { sub: (r) => (r.food_items ? plural(r.food_items, "item") : "") }),
          moneyCol("drinks", "Drinks", (r) => r.drinks, { sub: (r) => (r.drink_items ? plural(r.drink_items, "item") : "") }),
          moneyCol("total", "F&B Total", (r) => r.total, { bar: true, hint: ABBREVIATIONS["F&B"] }),
          moneyCol("guests", "From Guests", (r) => r.from_guests),
          moneyCol("non_guests", "From Non-Guests", (r) => r.from_non_guests),
          moneyCol("per", "Per Room-Night", (r) => r.per_room_night),
        ]}
      />
    </>
  );
}

const TOP_ITEMS_SHOWN = 30;

function TopItemsView({ data }) {
  const [kind, setKind] = useState("");
  const items = kind ? data.rows.filter((r) => r.kind === kind) : data.rows;
  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <Choice
          id="top-items-kind"
          tip="metrics.showKind"
          label="Show"
          value={kind}
          onChange={setKind}
          options={[
            { value: "", label: "Food and drinks" },
            { value: "food", label: "Food" },
            { value: "drink", label: "Drinks" },
          ]}
        />
      </div>
      <DataTable
        tipPrefix="metrics.top-items"
        rows={items.slice(0, TOP_ITEMS_SHOWN)}
        first={{ label: "Item", render: (r) => r.item_name, value: (r) => r.item_name }}
        rowKey={(r) => r.key}
        defaultSort={{ key: "sales", dir: "desc" }}
        empty="Nothing sold in these dates."
        columns={[
          textCol("kind", "Kind", (r) => (r.kind === "food" ? "Food" : "Drink")),
          countCol("quantity", "Sold", (r) => r.quantity),
          countCol("orders", "Orders", (r) => r.orders),
          moneyCol("sales", "Sales", (r) => r.revenue, { bar: true }),
          countCol("free", "Given Free", (r) => r.free),
          textCol("branches", "Branches", (r) => r.branches.join(", ")),
        ]}
      />
      {items.length > TOP_ITEMS_SHOWN && (
        <p className="text-xl text-(--text-color)/68">
          The top {TOP_ITEMS_SHOWN} of {count(items.length)} items.
        </p>
      )}
    </>
  );
}

function FnbCompView({ data }) {
  const t = data.total;
  const cell = (key, label) => ({
    key,
    label,
    align: "right",
    value: (r) => r[key].worth,
    render: (r) => naira(r[key].worth),
    sub: (r) => (r[key].items ? plural(r[key].items, "item") : ""),
  });
  const unpriced = t.complimentary.unpriced + t.manager.unpriced;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.fnb-comp.tile.given-away" label="Given away" value={naira(t.worth)} sub={`${percent(t.worth_pct_of_sales)} on top of ${naira(t.sales)} of F&B sales`} />
        <StatTile tip="metrics.fnb-comp.tile.complimentary" label="Complimentary" value={naira(t.complimentary.worth)} sub={plural(t.complimentary.items, "item")} />
        <StatTile tip="metrics.fnb-comp.tile.manager-s" label="Manager's" value={naira(t.manager.worth)} sub={plural(t.manager.items, "item")} />
      </StatRow>
      {unpriced > 0 && <Remark>{plural(unpriced, "free order")} had no menu price (typed in, or since taken off the menu), so counted at ₦0.</Remark>}
      <DataTable
        tipPrefix="metrics.fnb-comp"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "worth", dir: "desc" }}
        columns={[
          cell("complimentary", "Complimentary"),
          cell("manager", "Manager's"),
          moneyCol("worth", "Worth", (r) => r.worth, { bar: true }),
          pctCol("share", "Against F&B Sales", (r) => r.worth_pct_of_sales, { hint: ABBREVIATIONS["F&B"] }),
        ]}
      />
    </>
  );
}

function BarStockView({ data, branchOptions }) {
  const t = data.total;
  const [branch, setBranch] = useState("");
  const list = branch ? data.attention.filter((s) => String(s.branch_id) === branch) : data.attention;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.bar-stock.tile.out-of-stock" label="Out of stock" value={count(t.out + t.below_zero)} sub={t.below_zero ? `${count(t.below_zero)} of them below zero` : "Drinks with none on the shelf"} />
        <StatTile tip="metrics.bar-stock.tile.running-low" label="Running low" value={count(t.low)} sub={`Under ${plural(data.low_stock_days, "day")} of sales left`} />
        <StatTile tip="metrics.bar-stock.tile.written-off" label="Written off" value={plural(t.written_off, "unit")} sub={`${percent(t.loss_pct)} of what left the shelf in these dates`} />
      </StatRow>
      <DataTable
        tipPrefix="metrics.bar-stock"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "items", dir: "desc" }}
        columns={[
          countCol("items", "Drinks", (r) => r.items),
          countCol("units", "Units on Shelf", (r) => r.units_now),
          countCol("out", "Out", (r) => r.out),
          countCol("below", "Below Zero", (r) => r.below_zero),
          countCol("low", "Running Low", (r) => r.low),
          countCol("sold", "Sold", (r) => r.sold),
          countCol("added", "Added", (r) => r.added),
          countCol("written_off", "Written Off", (r) => r.written_off),
          pctCol("loss", "Loss Rate", (r) => r.loss_pct, { bar: true }),
        ]}
      />
      {data.attention.length > 0 && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle tip="metrics.bar-stock.section1" sub="Below zero first: more was sold than was ever recorded coming in, so the stock records need putting right.">Drinks needing attention</SectionTitle>
            <Choice id="bar-stock-branch" tip="metrics.branchChoice" label="Branch" value={branch} onChange={setBranch} options={[{ value: "", label: "All branches" }, ...branchOptions]} />
          </div>
          <DataTable
            tipPrefix="metrics.bar-stock.attention"
            rows={list}
            first={{ label: "Drink", render: (r) => r.item_name, value: (r) => r.item_name }}
            rowKey={(r) => r.id}
            empty="Nothing needs attention at this branch."
            columns={[
              textCol("branch", "Branch", (r) => r.branch_name),
              textCol("state", "State", (r) => r.state, { render: (r) => <StateChip state={r.state} /> }),
              countCol("now", "On Shelf", (r) => r.stock_now),
              countCol("sold", "Sold in These Dates", (r) => r.sold),
              decCol("days", "Days Left", (r) => r.days_left),
            ]}
          />
        </>
      )}
    </>
  );
}

// ==================================================== operations and staff

function NightAuditsView({ data }) {
  const t = data.total;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.night-audits.tile.nights-audited" label="Nights audited" value={`${count(t.ran)} of ${count(t.nights * data.rows.length)}`} sub={data.counted_to ? `Up to the night of ${dayText(data.counted_to)}` : "No night in these dates has ended yet."} />
        <StatTile tip="metrics.night-audits.tile.missed" label="Missed" value={count(t.missed)} sub="Nights with no audit" />
        <StatTile tip="metrics.night-audits.tile.run-by-hand" label="Run by hand" value={count(t.by_hand)} sub="The rest ran by themselves at 6am" />
      </StatRow>
      <DataTable
        tipPrefix="metrics.night-audits"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "missed", dir: "desc" }}
        columns={[
          countCol("nights", "Nights", (r) => r.nights),
          countCol("ran", "Ran", (r) => r.ran),
          countCol("missed", "Missed", (r) => r.missed, { sub: (r) => (r.missed_nights ? someDays(r.missed_nights) : "") }),
          countCol("automatic", "By Themselves", (r) => r.automatic),
          countCol("by_hand", "By Hand", (r) => r.by_hand),
          countCol("rooms", "Rooms Charged", (r) => r.rooms_charged, { bar: true }),
          moneyCol("posted", "Charged", (r) => r.total_posted),
          textCol("last", "Last Run", (r) => r.last_run, { render: (r) => (r.last_run ? momentText(r.last_run) : DASH) }),
        ]}
      />
    </>
  );
}

function StaffActivityView({ data, branchOptions }) {
  const [branch, setBranch] = useState("");
  const rows = branch ? data.rows.filter((r) => String(r.branch_id) === branch) : data.rows;
  const busy = rows.filter((r) => r.check_ins + r.check_outs + r.payments + r.fnb_orders + r.shifts > 0);
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.staff-activity.tile.people-who-did-anything" label="People who did anything" value={`${count(busy.length)} of ${count(rows.length)}`} sub="Listed staff with at least one check-in, payment, order or shift" />
        <StatTile tip="metrics.staff-activity.tile.check-ins" label="Check-ins" value={count(sumRows(rows, (r) => r.check_ins))} sub={`${count(sumRows(rows, (r) => r.check_outs))} check-outs`} />
        <StatTile tip="metrics.staff-activity.tile.money-taken" label="Money taken" value={naira(sumRows(rows, (r) => r.payments_total))} sub={`${plural(sumRows(rows, (r) => r.payments), "payment")}, net of refunds`} />
      </StatRow>
      <div className="flex flex-wrap items-end gap-4">
        <Choice id="staff-branch" tip="metrics.branchChoice" label="Branch" value={branch} onChange={setBranch} options={[{ value: "", label: "All branches" }, ...branchOptions]} />
      </div>
      <DataTable
        tipPrefix="metrics.staff-activity"
        rows={rows}
        first={{
          label: "Staff",
          value: (r) => r.staff_name,
          render: (r) => (
            <span className="flex flex-col">
              <span>{r.staff_name}</span>
              <span className="text-lg font-normal text-(--text-color)/68">
                {roleLabel(r.role)}
                {r.active === false ? " (deactivated)" : ""}
              </span>
            </span>
          ),
        }}
        rowKey={(r) => r.key}
        defaultSort={{ key: "money", dir: "desc" }}
        columns={[
          textCol("branch", "Branch", (r) => r.branch_name),
          countCol("check_ins", "Check-Ins", (r) => r.check_ins),
          countCol("check_outs", "Check-Outs", (r) => r.check_outs),
          countCol("payments", "Payments", (r) => r.payments),
          moneyCol("money", "Money Taken", (r) => r.payments_total, { bar: true }),
          countCol("fnb", "F&B Orders", (r) => r.fnb_orders, { hint: ABBREVIATIONS["F&B"] }),
          countCol("shifts", "Shifts", (r) => r.shifts),
        ]}
      />
    </>
  );
}

function ShiftsView({ data }) {
  const t = data.total;
  const full = data.rows.filter((r) => r.days > 0 && r.receptionist_days === r.days).length;
  const missing = data.rows.reduce((s, r) => s + r.missing_receptionist.length, 0);
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.shifts.tile.days-with-a-receptionist-on-record" label="Days with a receptionist on record" value={percent(t.receptionist_pct)} sub={`across ${plural(data.rows.length, "branch", "branches")}, ${plural(t.days, "day")} each`} />
        <StatTile tip="metrics.shifts.tile.branches-covered-every-day" label="Branches covered every day" value={`${count(full)} of ${count(data.rows.length)}`} sub="A receptionist picked as on duty every day" />
        <StatTile tip="metrics.shifts.tile.branch-days-with-nobody-on-record" label="Branch-days with nobody on record" value={count(missing)} sub={data.counted_to ? `Up to ${dayText(data.counted_to)}` : ""} />
      </StatRow>
      <DataTable
        tipPrefix="metrics.shifts"
        rows={data.rows}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "reception", dir: "asc" }}
        columns={[
          countCol("days", "Days", (r) => r.days),
          pctCol("reception", "Receptionist on Record", (r) => r.receptionist_pct, { bar: true, sub: (r) => `${count(r.receptionist_days)} of ${count(r.days)} days` }),
          countCol("missing", "Days Missing", (r) => r.missing_receptionist.length, { sub: (r) => someDays(r.missing_receptionist) }),
          pctCol("waitron", "Waitron on Record", (r) => r.waitron_pct, {
            render: (r) => (r.has_waitrons ? percent(r.waitron_pct) : "No waitrons"),
            sub: (r) => (r.has_waitrons ? `${count(r.waitron_days)} of ${count(r.days)} days` : ""),
          }),
        ]}
      />
    </>
  );
}

function AlertsView({ data }) {
  const t = data.total;
  const withAmount = (key, label, amountKey, extra = {}) => ({
    key,
    label,
    align: "right",
    value: (r) => r[key],
    render: (r) => count(r[key]),
    sub: (r) => (r[amountKey] ? naira(r[amountKey]) : ""),
    ...extra,
  });
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.alerts.tile.open-alerts" label="Open alerts" value={count(t.total)} sub="Across every branch, as their Alerts pages show" />
        <StatTile tip="metrics.alerts.tile.unpaid-by-guests-who-left" label="Unpaid by guests who left" value={naira(t.unpaid_amount)} sub={plural(t.unpaid_balances, "bill")} />
        <StatTile tip="metrics.alerts.tile.credit-to-return" label="Credit to return" value={naira(t.credit_amount)} sub={`${plural(t.guest_credits, "credit")} held for guests who left`} />
      </StatRow>
      <DataTable
        tipPrefix="metrics.alerts"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "total", dir: "desc" }}
        columns={[
          countCol("missed", "Missed Check-Ins", (r) => r.missed_check_ins),
          countCol("overdue", "Past Check-Out", (r) => r.overdue_checkouts),
          withAmount("unpaid", "Unpaid Balances", "unpaid_amount", { value: (r) => r.unpaid_balances }),
          countCol("unconfirmed", "Awaiting Payment", (r) => r.unconfirmed),
          withAmount("credits", "Credit to Return", "credit_amount", { value: (r) => r.guest_credits }),
          countCol("total", "Total", (r) => r.total, { bar: true }),
        ]}
      />
    </>
  );
}

function AdoptionView({ data }) {
  const t = data.total;
  const daily = data.rows.filter((r) => r.days > 0 && r.days_active === r.days).length;
  const idle = data.rows.filter((r) => r.bookings + r.check_ins + r.payments + r.fnb_orders === 0).length;
  return (
    <>
      <StatRow>
        <StatTile tip="metrics.adoption.tile.branches-using-the-pms-every-day" label="Branches using the PMS every day" value={`${count(daily)} of ${count(data.rows.length)}`} sub={`Someone did something every day, ${plural(t.days, "day")} counted`} />
        <StatTile tip="metrics.adoption.tile.staff-who-used-it" label="Staff who used it" value={`${count(t.staff_active)} of ${count(t.staff_total)}`} sub="Branch staff with at least one action" />
        <StatTile tip="metrics.adoption.tile.branches-with-nothing-recorded" label="Branches with nothing recorded" value={count(idle)} sub="No booking, check-in, payment or F&B order" />
      </StatRow>
      {idle > 0 && (
        <Remark>
          {plural(idle, "branch", "branches")} recorded no bookings, check-ins, payments or orders in these dates. Their figures on every other
          metric will read as zero until they use the PMS for their day-to-day work.
        </Remark>
      )}
      <DataTable
        tipPrefix="metrics.adoption"
        rows={data.rows}
        total={t}
        first={BRANCH}
        rowKey={byBranch}
        defaultSort={{ key: "days", dir: "desc" }}
        columns={[
          pctCol("days", "Days Active", (r) => r.days_active_pct, {
            bar: true,
            render: (r) => (r.days_active_pct === undefined ? `${count(t.days)} days` : `${count(r.days_active)} of ${count(r.days)}`),
            sub: (r) => (r.days_active_pct === undefined ? "" : percent(r.days_active_pct)),
          }),
          countCol("staff", "Staff Active", (r) => r.staff_active, { render: (r) => `${count(r.staff_active)} of ${count(r.staff_total)}` }),
          countCol("bookings", "Bookings", (r) => r.bookings),
          countCol("check_ins", "Check-Ins", (r) => r.check_ins),
          countCol("payments", "Payments", (r) => r.payments),
          countCol("fnb", "F&B Orders", (r) => r.fnb_orders, { hint: ABBREVIATIONS["F&B"] }),
          countCol("actions", "Actions", (r) => r.actions),
          textCol("last", "Last Activity", (r) => r.last_activity, { render: (r) => (r.last_activity ? momentText(r.last_activity) : r.branch_name ? "Never" : DASH) }),
        ]}
      />
    </>
  );
}

export const METRIC_VIEWS = {
  occupancy: OccupancyView,
  "adr-revpar": AdrRevparView,
  trevpar: TrevparView,
  "revenue-mix": RevenueMixView,
  "stay-length": StayLengthView,
  channels: ChannelsView,
  cancellations: CancellationsView,
  discounts: DiscountsView,
  complimentary: ComplimentaryView,
  "out-of-order": OutOfOrderView,
  collections: CollectionsView,
  outstanding: OutstandingView,
  ota: OtaView,
  "credit-held": CreditHeldView,
  exceptions: ExceptionsView,
  "repeat-guests": RepeatGuestsView,
  "top-guests": TopGuestsView,
  contactability: ContactabilityView,
  "fnb-sales": FnbSalesView,
  "top-items": TopItemsView,
  "fnb-comp": FnbCompView,
  "bar-stock": BarStockView,
  "night-audits": NightAuditsView,
  "staff-activity": StaffActivityView,
  shifts: ShiftsView,
  alerts: AlertsView,
  adoption: AdoptionView,
};
