module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(-100%)" }, // start left
          "100%": { transform: "translateX(100%)" }, // move to right
        },
      },
    },
    animation: {
      marquee: "marquee 15s linear infinite",
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
