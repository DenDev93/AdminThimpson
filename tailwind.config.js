/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    borderRadius: {
      none: '0', sm: '0', DEFAULT: '0',
      md: '0', lg: '0', xl: '0', '2xl': '0', '3xl': '0', full: '0',
    },
    extend: {
      colors: {
        thimpson: {
          yellow:   '#FBB03B',
          'yellow-d':'#e09e28',
          black:    '#000000',
          teal:     '#0B1F22',
          'teal-2': '#122d31',
          'teal-3': '#1a3f44',
          'teal-4': '#0d2a2e',
          brown:    '#BC8A5F',
          white:    '#FFFFFF',
          surface:  '#f4f6f9',
        },
      },
      boxShadow: {
        'md-1': '0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.24)',
        'md-2': '0 3px 6px rgba(0,0,0,.15), 0 2px 4px rgba(0,0,0,.12)',
        'md-3': '0 10px 20px rgba(0,0,0,.15), 0 3px 6px rgba(0,0,0,.1)',
        'md-4': '0 14px 28px rgba(0,0,0,.2), 0 10px 10px rgba(0,0,0,.17)',
        'md-5': '0 19px 38px rgba(0,0,0,.25), 0 15px 12px rgba(0,0,0,.2)',
        'inner-top': 'inset 0 3px 0 0 #FBB03B',
      },
      transitionDuration: { DEFAULT: '200ms' },
      animation: {
        'fade-in':     'fadeIn .25s ease both',
        'slide-up':    'slideUp .3s ease both',
        'slide-right': 'slideRight .25s ease both',
        'ripple':      'ripple .6s linear',
      },
      keyframes: {
        fadeIn:     { from: { opacity:'0', transform:'translateY(8px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        slideUp:    { from: { opacity:'0', transform:'translateY(20px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        slideRight: { from: { opacity:'0', transform:'translateX(-16px)' }, to: { opacity:'1', transform:'translateX(0)' } },
        ripple:     { to: { transform:'scale(4)', opacity:'0' } },
      },
    },
  },
  plugins: [],
}
