import caritasInnLogo from "@/assets/pms/brands/caritas-inn.png";
import fiveCloverHotelsLogo from "@/assets/pms/brands/five-clover-hotels.png";
import fiveCloverInnLogo from "@/assets/pms/brands/five-clover-inn.png";
import ringRubyLogo from "@/assets/pms/brands/ring-ruby.png";
// The one-colour marks the group website's own hotel introductions use -
// for a cream page, where the full-colour marks clash (owner, 2026-09-28).
import caritasInnMark from "@/assets/home/hero/logos/caritas-logo.webp";
import fiveCloverMark from "@/assets/home/hero/logos/five-clover-logo.webp";
import ringRubyMark from "@/assets/home/hero/logos/ring-ruby-logo.webp";

// The PMS design system's one source of colour and logo (2026-09-28).
//
// Every brand wears the HQ admin's look - dark top bar, beige sidebar, cream
// page, lighter cream cards - and differs only in colour. So a brand is a
// hue, its own brand colour (emphasis) and accent, and its logos - `logo`
// for the dark top bar, `logoOnLight`, one colour, for a cream page; everything
// else is derived from the hue by the HQ admin's own recipe (themeStyle
// below). Five Clover's hue IS the HQ admin's, which is why that brand looks
// exactly like it. Emphasis and accent are each brand's own, taken from its
// hotel websites.
//
// A branch's brand is the prefix of its branch_code (ci-yaba, fc-abijo,
// rr-eso), the same rule the backend's booking emails use.
export const BRANDS = {
  ci: {
    key: "ci",
    name: "Caritas Inn",
    hue: 21,
    emphasis: "hsla(21, 93%, 45%, 1)",
    accent: "hsla(21, 92%, 80%, 1)",
    logo: caritasInnLogo,
    logoOnLight: caritasInnMark,
  },
  fc: {
    key: "fc",
    name: "Five Clover",
    hue: 38,
    emphasis: "hsla(38, 49%, 51%, 1)",
    accent: "hsla(38, 86%, 80%, 1)",
    logo: fiveCloverHotelsLogo,
    logoOnLight: fiveCloverMark,
  },
  rr: {
    key: "rr",
    name: "Ring Ruby",
    hue: 359,
    emphasis: "hsla(359, 78%, 51%, 1)",
    accent: "hsla(52, 93%, 88%, 1)",
    logo: ringRubyLogo,
    logoOnLight: ringRubyMark,
  },
};

// Before anyone has signed in there is no branch yet: the sign-in page wears
// the group's own colours.
export const GROUP_BRAND = BRANDS.fc;

// Per branch, what differs from its brand. Abijo trades as "Five Clover
// Inn" and its own site shows that mark, not the group's "Five Clover
// Hotels". site: the branch's own hotel website, whose /admin is the branch
// PMS this one is replacing.
const BRANCHES = {
  "fc-monastery": { site: "https://monastery.fivecloverhotels.com" },
  "fc-abijo": { site: "https://abijo.fivecloverhotels.com", logo: fiveCloverInnLogo },
  "fc-ilupeju": { site: "https://ilupeju.fivecloverhotels.com" },
  "ci-igbobi": { site: "https://igbobi.caritasinn.com" },
  "ci-ilasan": { site: "https://ilasan.caritasinn.com" },
  "ci-lekki": { site: "https://lekki.caritasinn.com" },
  "ci-yaba": { site: "https://yaba.caritasinn.com" },
  "rr-sangotedo": { site: "https://unitedestate.ringrubyhotel.com" },
  "rr-eso": { site: "https://eso.ringrubyhotel.com" },
  "rr-oduduwa": { site: "https://oduduwa.ringrubyhotel.com" },
  "rr-value-county": { site: "https://valuecounty.ringrubyhotel.com" },
  "rr-bateye": { site: "https://bateye.ringrubyhotel.com" },
};

const codeOf = (branch) => String(branch?.branch_code || "").toLowerCase();

export const brandForBranch = (branch) => BRANDS[codeOf(branch).split("-")[0]] || GROUP_BRAND;

export const logoForBranch = (branch) => BRANCHES[codeOf(branch)]?.logo || brandForBranch(branch).logo;

export const siteForBranch = (branch) => BRANCHES[codeOf(branch)]?.site || null;

// Branch names are stored as "<Brand> <Location>" ("Caritas Inn Ilasan").
// The logo already says the brand, so the top bar shows the location alone -
// the same rule the branch PMS's own top bar uses.
const BRAND_PREFIXES = ["Five Clover", "Caritas Inn", "Ringruby"];
export const branchLocationName = (fullName) => {
  if (!fullName) return fullName;
  const prefix = BRAND_PREFIXES.find((p) => fullName.toLowerCase().startsWith(p.toLowerCase()));
  return prefix ? fullName.slice(prefix.length).trim() : fullName;
};

// The CSS variables a brand sets on the PMS's root element. Named as the
// rest of this site names them (--emphasis, --text-color, ...), so the HQ
// admin's own shared pieces (PageHeading, Modal, PasswordField) take on the
// brand inside the PMS with no changes of their own.
export const themeStyle = (brand) => ({
  "--emphasis": brand.emphasis,
  "--accent": brand.accent,
  "--text-color": `hsla(${brand.hue}, 13%, 18%, 1)`,
  "--black": "hsla(0, 0%, 2.4%, 1)",
  "--background-color": `hsla(${brand.hue}, 38%, 94%, 1)`,
  "--accent-2": `hsla(${brand.hue}, 26%, 84%, 1)`,
  "--card": `hsla(${brand.hue}, 38%, 97%, 1)`,
});
