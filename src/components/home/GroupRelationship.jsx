import FONTS from "@/utils/fonts";

export default function GroupRelationship() {
  return (
    <div className="p-[12rem] max-md:p-[6rem] max-sm:px-[2rem] bg-[var(--accent-2)]">
      <div className="flex flex-col gap-[1.8rem]">
        <h3 className={`${FONTS.context}`}>Group Relationship</h3>
        <h4 className={`${FONTS.heading}`}>
          Managed by Five Clover Hotels Group,
        </h4>
        <p className={`${FONTS.body} text-[2.2rem]`}>
          across 4 brands, each of our 12 properties delivers on a promise of excellence—distinct
          in style, unified in quality.
        </p>
      </div>
    </div>
  );
}
