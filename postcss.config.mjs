/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // <-- Changed this line
    autoprefixer: {},
  },
};

export default config;
