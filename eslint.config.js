import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "tailwind.config.js", "src/components/ui/"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Whitespace rules
      "indent": ["error", 2],  // 2 spaces indentation
      "no-trailing-spaces": "error",  // No trailing spaces at end of lines
      "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 0 }],  // Max one empty line
      // "eol-last": ["error", "always"],  // Newline at end of file
      // "object-curly-spacing": ["error", "always"],  // Spaces inside curly braces
      // "array-bracket-spacing": ["error", "never"],  // No spaces inside array brackets
      // "comma-spacing": ["error", { "before": false, "after": true }],  // Space after comma
      // "keyword-spacing": ["error", { "before": true, "after": true }],  // Space around keywords
      // "space-infix-ops": "error",  // Space around operators
      // "space-before-blocks": "error",  // Space before blocks
      // "space-before-function-paren": ["error", {
      //   "anonymous": "always",
      //   "named": "never",
      //   "asyncArrow": "always"
      // }],  // Space before function parentheses
    },
  }
);
