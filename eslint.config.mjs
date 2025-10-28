import globals from "globals";
import eslintJs from "@eslint/js";
import { defineConfig } from "eslint/config";
import tsEslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig(
    {
        ignores: ["dist/*", "*.cjs", "*.js", "*.mjs"],
    },

    eslintJs.configs.recommended,

    ...tsEslint.configs.recommendedTypeChecked,

    eslintPluginPrettierRecommended,

    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2025,
            },
            parserOptions: {
                project: ["tsconfig.json"],
            },
        },
    },
);
