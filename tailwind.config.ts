import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Paleta baseada na referência visual corporativa
        sidebar: {
          DEFAULT: '#182234', // Dark Navy do menu lateral
          hover: '#1e2d42',
          active: '#2563EB', // Azul Vibrante do item ativo
          text: '#94A3B8', // Slate suave para itens inativos
          textActive: '#FFFFFF',
          border: '#243247',
        },
        surface: {
          background: '#F1F5F9', // Fundo principal da aplicação (Off-white / Slate claro)
          card: '#FFFFFF', // Cards brancos com sombras suaves
          muted: '#F8FAFC',
          border: '#E2E8F0',
        },
        brand: {
          blue: '#2563EB',
          sky: '#0284C7',
          amber: '#F59E0B',
          emerald: '#10B981',
          rose: '#F43F5E',
          purple: '#8B5CF6',
        },
        slate: {
          heading: '#0F172A', // Texto principal de títulos e números de destaque
          body: '#334155', // Texto de leitura
          muted: '#64748B', // Legendas e metadados
          subtle: '#94A3B8',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
