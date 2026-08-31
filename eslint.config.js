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

    // Vue
    ...pluginVue.configs["flat/recommended"],
    {
        rules: {},
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
