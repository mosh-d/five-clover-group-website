import { GUEST_TAG_META, guestTagLabel } from "@/lib/pms/guest-tags";

// A guest's tags - their types plus the blacklist flag - printed beside
// their name wherever staff meet it, so a VIP or a blacklisted guest is
// recognised on every screen (owner, 2026-09-28). The server attaches them
// as `guest_tags`, Blacklisted first (GuestTagsInterceptor).
export function GuestTagPills({ tags, className = "" }) {
  if (!tags?.length) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 align-middle ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={`text-sm font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${GUEST_TAG_META[tag]?.className || "bg-gray-100 text-gray-700"}`}
        >
          {guestTagLabel(tag)}
        </span>
      ))}
    </span>
  );
}

// The one way a guest's name is shown to staff.
export default function GuestName({ name, tags, className = "" }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <span>{name}</span>
      <GuestTagPills tags={tags} />
    </span>
  );
}
