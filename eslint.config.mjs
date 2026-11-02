import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import eslintReact from "@eslint-react/eslint-plugin";

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // ESLint core recommended rules.
  js.configs.recommended,
  // TypeScript rules (parser + recommended).
  ...tseslint.configs.recommended,
  // Next.js-specific rules.
  nextPlugin.configs["core-web-vitals"],
  // React rules (replaces the EOL eslint-plugin-react + react-hooks).
  eslintReact.configs.recommended,
]);

export default eslintConfig;
