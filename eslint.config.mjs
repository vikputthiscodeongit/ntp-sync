import globals from "globals";
import eslintJs from "@eslint/js";
import tsEslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default tsEslint.config(
    {
        ignores: ["dist/*", "**/*.*js"],
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
