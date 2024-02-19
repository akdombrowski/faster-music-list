/** @type {import('prettier').Config} */
module.exports = {
  bracketSpacing: true,
  printWidth: 80,
  trailingComma: "all",
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  bracketSameLine: true,
  htmlWhitespaceSensitivity: "strict",
  proseWrap: "always",
  quoteProps: "consistent",
  singleAttributePerLine: false,
  plugins: ["prettier-plugin-tailwindcss"],
};
