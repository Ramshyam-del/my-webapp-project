import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const LineChart = ({ title, data, labels }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        fill: false,
        borderColor: '#06b6d4',
        backgroundColor: '#06b6d4',
        tension: 0.4,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: title, color: '#111827', font: { size: 18 } },
    },
    scales: {
      x: { ticks: { color: '#374151' } },
      y: { ticks: { color: '#374151' } },
    },
  };
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <Line data={chartData} options={options} />
    </div>
  );
}; 