import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { baseChartOptions, chartColors, getDarkModeOptions } from './ChartConfig';

const OccupancyChart = ({ tasaOcupacion, reservasActivas, totalEspacios }) => {
  // Normalizar la tasa de ocupación para que esté entre 0 y 100
  let ocupado = parseFloat(tasaOcupacion) || 0;
  
  // Asegurar que esté entre 0 y 100 (por si hay datos erróneos)
  ocupado = Math.max(0, Math.min(100, ocupado));
  
  // Calcular porcentaje de reservado basado en reservas activas
  const totalReservas = parseFloat(reservasActivas) || 0;
  const totalEsp = parseFloat(totalEspacios) || 1;
  const reservado = Math.min((totalReservas / totalEsp) * 100, 100 - ocupado);
  
  // El disponible es el resto
  const disponible = Math.max(0, 100 - ocupado - reservado);

  const data = {
    labels: ['Ocupado', 'Reservado', 'Disponible'],
    datasets: [
      {
        data: [ocupado, reservado, disponible],
        backgroundColor: [
          chartColors.danger,    // Rojo para ocupado
          document.body.classList.contains('dark-mode') ? '#6c757d' : chartColors.dark,      // Gris para reservado
          chartColors.primary    // Violeta para disponible
        ],
        borderColor: [
          '#dc3545',  // Rojo más oscuro
          document.body.classList.contains('dark-mode') ? '#adb5bd' : '#495057',  // Gris más oscuro
          chartColors.gradient.primary[1]  // Violeta más oscuro
        ],
        borderWidth: 2,
        cutout: '65%', // Hace el efecto de dona más pronunciado
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
        text: 'Estado de los Espacios',
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
            const label = context.label;
            const value = context.parsed.toFixed(1);
            
            if (label === 'Ocupado') {
              return `🔴 Ocupado: ${value}%`;
            } else if (label === 'Reservado') {
              return `⚫ Reservado: ${value}%`;
            } else {
              return `🟣 Disponible: ${value}%`;
            }
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
          color: chartColors.primary,
          lineHeight: '1'
        }}>
          {disponible.toFixed(1)}%
        </div>
        <div style={{ 
          fontSize: '14px',
          color: document.body.classList.contains('dark-mode') ? '#cccccc' : '#666666',
          marginTop: '4px'
        }}>
          Disponible
        </div>
      </div>
    </div>
  );
};

export default OccupancyChart;