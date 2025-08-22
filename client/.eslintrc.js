module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-unused-vars": "warn",
    "no-undef": "warn",
    "react/no-unescaped-entities": "off",
  },
  globals: {
    PublicKeyCredential: "readonly",
    confirm: "readonly",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
