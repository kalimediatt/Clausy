/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Escaneia todos os arquivos JS/JSX/TSX dentro do src
  ],
  darkMode: 'class', // Dark mode via classe
  theme: {
    extend: {
      colors: {
        // Paleta personalizada
        primary: {
          DEFAULT: '#2B2B2B',       // fundo escuro / textos
        },
        secondary: {
          DEFAULT: '#ADADAD',       // cinza médio
        },
        white: {
          DEFAULT: '#FFFFFF',
        },
        accent1: {
          DEFAULT: '#cbdb47',       // marrom/terra
        },
        accent2: {
          DEFAULT: '#cbdb47',       // laranja/alaranjado
        },
        black: {
          DEFAULT: '#000000',
        },
      },
    },
  },
  plugins: [],
}

// // Paleta personalizada
// primary: {
//   DEFAULT: '#2B2B2B',       // fundo escuro / textos
// },
// secondary: {
//   DEFAULT: '#ADADAD',       // cinza médio
// },
// white: {
//   DEFAULT: '#FFFFFF',
// },
// accent1: {
//   DEFAULT: '#8C4B35',       // marrom/terra
// },
// accent2: {
//   DEFAULT: '#E1663D',       // laranja/alaranjado
// },
// black: {
//   DEFAULT: '#000000',
// },