import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAppContext } from '../../context/AppContext';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ServerMetricsChart = ({ serverId, timeRange = '24h' }) => {
  const { servers } = useAppContext();
  const chartRef = useRef(null);
  
  // 시간 범위에 따른 라벨 생성
  const generateTimeLabels = () => {
    switch (timeRange) {
      case '1h':
        return Array.from({ length: 12 }, (_, i) => `${i * 5}m`);
      case '6h':
        return Array.from({ length: 12 }, (_, i) => `${i * 30}m`);
      case '24h':
      default:
        return Array.from({ length: 12 }, (_, i) => `${i * 2}h`);
    }
  };
  
  // 데이터셋 생성
  const generateDatasets = () => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return [];
    
    // 실제 애플리케이션에서는 시계열 데이터를 API에서 가져와야 함
    // 예시 데이터 생성
    const generateRandomData = (baseValue) => {
      return Array.from({ length: 12 }, () => 
        Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * 20))
      );
    };
    
    return [
      {
        label: 'CPU Usage',
        data: generateRandomData(server.cpu),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Memory Usage',
        data: generateRandomData(server.memory),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Disk Usage',
        data: generateRandomData(server.disk),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.3,
      }
    ];
  };
  
  // 차트 옵션
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Server Metrics (${timeRange})`
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    }
  };
  
  return (
    <div className="chart-container" style={{ height: '300px' }}>
      <Line
        ref={chartRef}
        options={options}
        data={{
          labels: generateTimeLabels(),
          datasets: generateDatasets(),
        }}
      />
    </div>
  );
};

export default ServerMetricsChart; 