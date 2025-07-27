import { Topbar } from './Topbar';
import { DashboardCards } from './DashboardCards';
import { LineChart } from './LineChart';
import UserList from './UserList';

const days = Array.from({ length: 10 }, (_, i) => `Day ${i + 1}`);
const rechargeData = [1200, 1500, 1800, 1700, 2100, 2500, 2300, 2200, 2400, 2600];
const withdrawalData = [800, 900, 1100, 1000, 1200, 1300, 1250, 1400, 1350, 1500];

export const MainDashboard = () => (
  <div className="flex flex-col min-h-screen bg-gray-100">
    <Topbar />
    <main className="flex-1 p-8 bg-gray-100">
      <div className="bg-white rounded-lg shadow-md p-6">
        <UserList />
      </div>
    </main>
  </div>
); 