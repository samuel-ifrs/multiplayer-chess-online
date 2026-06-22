import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

const compat = new FlatCompat({
  baseDirectory: import.meta.url,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
    ],
  },

  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ),
  {
    ...react.configs.flat.recommended,
    settings: {
      ...react.configs.flat.recommended.settings,
      react: {
        version: "detect",
      },
    },
  },

  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    languageOptions: {
      parser: tsParser,
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    plugins: {
      react,
      "@typescript-eslint": typescriptEslint,
      prettier,
    },

    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "none",
        },
      ],

      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-var-requires": "off",

      "@typescript-eslint/no-inferrable-types": [
        "off",
        {
          ignoreParameters: true,
        },
      ],

      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react/no-is-mounted": "off",
      "react/display-name": "off",
      "react/no-string-refs": "off",
      "react/jsx-no-target-blank": "off",

      eqeqeq: "error",
      "prefer-template": "error",

      quotes: [
        "error",
        "single",
        {
          avoidEscape: true,
        },
      ],

      "no-console": "off",
      "no-prototype-builtins": "off",
      "no-extra-boolean-cast": "off",
      "no-undef": "off",
      "no-unneeded-ternary": "error",
      "no-var": "error",

      "prefer-const": "error",

      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-intl",
              importNames: ["FormattedDate"],
              message:
                "Use FormattedDate do @elotech/components em vez do react-intl.",
            },
          ],
        },
      ],

      "prettier/prettier": [
        "error",
        {
          arrowParens: "avoid",
          endOfLine: "auto",
          printWidth: 80,
          singleQuote: true,
          trailingComma: "none",
          useTabs: false,
        },
      ],
    },
  },
]);
