module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  plugins: ["react", "@typescript-eslint", "prettier"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { vars: "all", args: "none" },
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
    "@typescript-eslint/no-inferrable-types": [
      "off",
      { ignoreParameters: true },
    ],
    "@typescript-eslint/no-var-requires": "off",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "react/no-is-mounted": "off",
    "react/display-name": "off",
    "react/no-string-refs": "off",
    "react/jsx-no-target-blank": "off",
    eqeqeq: "error",
    "prefer-template": "error",
    quotes: ["error", "single", { avoidEscape: true }],
    "no-console": "off",
    "no-prototype-builtins": "off",
    "no-extra-boolean-cast": "off",
    "no-undef": "off",
    "no-unneeded-ternary": "error",
    "no-var": ["error"],
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
    "prefer-const": ["error"],
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
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
    react: {
      version: "detect",
    },
  },
};
