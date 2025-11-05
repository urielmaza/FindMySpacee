import React from 'react';
import { Bar } from 'react-chartjs-2';
import { baseChartOptions, chartColors, getDarkModeOptions } from './ChartConfig';

const OwnerStatsChart = ({ stats, periodo }) => {
  const data = {
    labels: ['Espacios', 'Reservas Totales', 'Reservas Activas'],
    datasets: [
      {
        label: 'Cantidad',
        data: [stats.totalEspacios, stats.totalReservas, stats.reservasActivas],
        backgroundColor: [
          chartColors.gradient.primary[0],
          chartColors.gradient.secondary[0],
          chartColors.gradient.success[0]
        ],
        borderColor: [
          chartColors.gradient.primary[1],
          chartColors.gradient.secondary[1],
          chartColors.gradient.success[1]
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const options = getDarkModeOptions({
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: {
        display: true,
        text: `Resumen de Estadísticas - ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`,
        color: document.body.classList.contains('dark-mode') ? '#ffffff' : '#333333',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        display: false // Ocultar leyenda para este gráfico simple
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: document.body.classList.contains('dark-mode') ? '#cccccc' : '#666666'
        },
        grid: {
          color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          color: document.body.classList.contains('dark-mode') ? '#cccccc' : '#666666'
        },
        grid: {
          display: false
        }
      }
    }
  });

  return <Bar data={data} options={options} />;
};

export default OwnerStatsChart;