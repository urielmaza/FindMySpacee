import React from 'react';
import { Line } from 'react-chartjs-2';
import { baseChartOptions, chartColors, getDarkModeOptions } from './ChartConfig';

const RevenueChart = ({ ingresosMensuales, periodo }) => {
  // Generar datos simulados para mostrar tendencia
  const generateTrendData = (currentValue, periodo) => {
    const periods = periodo === 'año' ? 12 : periodo === 'mes' ? 30 : 7;
    const labels = [];
    const data = [];
    
    for (let i = periods - 1; i >= 0; i--) {
      if (periodo === 'año') {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString('es-ES', { month: 'short' }));
      } else if (periodo === 'mes') {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.getDate().toString());
      } else {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-ES', { weekday: 'short' }));
      }
      
      // Generar variación aleatoria basada en el valor actual
      const variation = 0.7 + Math.random() * 0.6; // Entre 70% y 130%
      data.push(Math.round(currentValue * variation));
    }
    
    return { labels, data };
  };

  const trendData = generateTrendData(ingresosMensuales, periodo);

  const data = {
    labels: trendData.labels,
    datasets: [
      {
        label: `Ingresos (${periodo})`,
        data: trendData.data,
        borderColor: chartColors.primary,
        backgroundColor: `${chartColors.primary}20`, // 20% opacity
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  const options = getDarkModeOptions({
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: {
        display: true,
        text: `Tendencia de Ingresos - ${periodo.charAt(0).toUpperCase() + periodo.slice(1)}`,
        color: document.body.classList.contains('dark-mode') ? '#ffffff' : '#333333',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        display: false
      },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            return `Ingresos: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: document.body.classList.contains('dark-mode') ? '#cccccc' : '#666666',
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
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
          color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    }
  });

  return <Line data={data} options={options} />;
};

export default RevenueChart;