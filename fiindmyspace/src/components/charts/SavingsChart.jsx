import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { baseChartOptions, chartColors, getDarkModeOptions } from './ChartConfig';

const SavingsChart = ({ ahorroPromedio, gastoTotal }) => {
  const ahorro = parseFloat(ahorroPromedio) || 0;
  const gastoNormal = 100 - ahorro; // Lo que habría gastado sin el descuento

  const data = {
    labels: ['Ahorro', 'Gasto vs Parquímetro'],
    datasets: [
      {
        data: [ahorro, gastoNormal],
        backgroundColor: [
          chartColors.success,
          chartColors.warning
        ],
        borderColor: [
          chartColors.gradient.success[1],
          '#ffc107'
        ],
        borderWidth: 2,
        cutout: '60%',
      }
    ]
  };

  const options = getDarkModeOptions({
    ...baseChartOptions,
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    plugins: {
      ...baseChartOptions.plugins,
      title: {
        display: true,
        text: 'Ahorro vs Parquímetro',
        color: document.body.classList.contains('dark-mode') ? '#ffffff' : '#333333',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      legend: {
        ...baseChartOptions.plugins.legend,
        position: 'bottom',
        labels: {
          ...baseChartOptions.plugins.legend.labels,
          color: document.body.classList.contains('dark-mode') ? '#ffffff' : '#333333',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            if (context.label === 'Ahorro') {
              return `Ahorro: ${context.parsed.toFixed(1)}%`;
            }
            return `${context.label}: ${context.parsed.toFixed(1)}%`;
          }
        }
      }
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      }
    }
  });

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Doughnut data={data} options={options} />
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 'bold',
          color: chartColors.success,
          lineHeight: '1'
        }}>
          {ahorro}%
        </div>
        <div style={{ 
          fontSize: '14px',
          color: document.body.classList.contains('dark-mode') ? '#cccccc' : '#666666',
          marginTop: '4px'
        }}>
          Ahorro
        </div>
      </div>
    </div>
  );
};

export default SavingsChart;