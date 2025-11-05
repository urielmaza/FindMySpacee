import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

// Registrar los componentes necesarios
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Colores consistentes con el tema de la app
export const chartColors = {
  primary: '#8304b6',      // violeta principal
  secondary: '#00E5FF',    // celeste modo oscuro
  success: '#28a745',      // verde
  warning: '#ffc107',      // amarillo
  danger: '#dc3545',       // rojo
  info: '#17a2b8',        // azul claro
  dark: '#343a40',        // gris oscuro
  light: '#f8f9fa',       // gris claro
  gradient: {
    primary: ['#8304b6', '#b847d9'],
    secondary: ['#00E5FF', '#00bcd4'],
    success: ['#28a745', '#5cb85c'],
    rainbow: ['#8304b6', '#00E5FF', '#28a745', '#ffc107', '#dc3545']
  }
};

// Configuración base para todos los gráficos
export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 12,
          weight: '500'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: chartColors.primary,
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12
    }
  },
  elements: {
    bar: {
      borderRadius: 6,
      borderSkipped: false,
    },
    point: {
      radius: 6,
      hoverRadius: 8,
    },
    line: {
      borderWidth: 3,
      tension: 0.4
    }
  }
};

// Configuración específica para modo oscuro
export const getDarkModeOptions = (baseOptions) => {
  const isDarkMode = document.body.classList.contains('dark-mode');
  
  if (!isDarkMode) return baseOptions;
  
  return {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...baseOptions.plugins.legend,
        labels: {
          ...baseOptions.plugins.legend.labels,
          color: '#ffffff'
        }
      }
    },
    scales: baseOptions.scales ? {
      ...baseOptions.scales,
      x: {
        ...baseOptions.scales.x,
        ticks: {
          ...baseOptions.scales.x?.ticks,
          color: '#cccccc'
        },
        grid: {
          ...baseOptions.scales.x?.grid,
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ...baseOptions.scales.y,
        ticks: {
          ...baseOptions.scales.y?.ticks,
          color: '#cccccc'
        },
        grid: {
          ...baseOptions.scales.y?.grid,
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    } : undefined
  };
};