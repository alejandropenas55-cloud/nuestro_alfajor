/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta "Nuestro Alfajor": tonos de dulce de leche, tapa horneada y glasé.
        // No cream+terracota genérico: acá el marrón ES el producto, no un accent decorativo.
        masa: {
          50: "#FBF6EE",   // glasé / azúcar impalpable
          100: "#F3E6CE",  // tapa recién horneada
          300: "#E3C48F",  // borde tostado
        },
        dulce: {
          400: "#C98A3E",  // caramelo claro
          500: "#A6672A",  // dulce de leche
          600: "#8A5220",  // dulce de leche oscuro
          700: "#5E3814",  // chocolate / texto principal
          900: "#3A2210",  // texto de máximo contraste
        },
        rio: {
          // verde Entre Ríos: única función = acción positiva / confirmación, uso restringido
          500: "#3F7D5C",
          600: "#2F6249",
        },
        alerta: {
          500: "#B5482F",
        },
      },
      fontFamily: {
        // Display: cálida, con carácter de cartel de panadería de barrio, sin ser cursiva difícil de leer.
        display: ["'Fredoka'", "system-ui", "sans-serif"],
        // Utilitaria: la que hace el trabajo pesado — números y formularios grandes, legible con el pulgar.
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Escala pensada para uso con el pulgar en el celular, no para desktop
        "touch-lg": ["1.375rem", { lineHeight: "1.3", fontWeight: "600" }],
        "touch-xl": ["1.75rem", { lineHeight: "1.25", fontWeight: "700" }],
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
