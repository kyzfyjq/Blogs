import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";

export default defineConfig([
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  // JS
  {
    files: ["**/*.js"],
    plugins: {
      js,
    },
    extends: ["js/recommended"],
  },

  // Browser code
  {
    files: ["src/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },

  // Node scripts and config files
  {
    files: ["scripts/**/*.js", "*.config.js", "vite.config.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },

  // Vue
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },

  // Prettier (recommended place)
  eslintConfigPrettier,
]);
