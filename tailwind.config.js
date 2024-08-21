module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        // You can adjust other breakpoints if needed
      },
      textDirection: {
        rtl: 'rtl',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
