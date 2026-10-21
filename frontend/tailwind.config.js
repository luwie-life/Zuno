export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12201A',          // body text
        forest: { DEFAULT: '#0B3D2E', 600: '#14573F', 500: '#1C6F52', 100: '#DCEBE3', 50: '#EEF5F1' },
        mango: { DEFAULT: '#E9A23B', 100: '#FBEBCF' },
        paper: '#F6F7F5',
        line: '#DCE2DD',
        muted: '#5B6A62',
        danger: { DEFAULT: '#B3261E', 100: '#FBE4E2' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '14px' },
    },
  },
  plugins: [],
};
