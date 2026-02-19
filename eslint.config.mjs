import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow apostrophes and quotes in JSX text
      "react/no-unescaped-entities": "off",
      // Allow regular img tags (we're using imported images which are already optimized)
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
