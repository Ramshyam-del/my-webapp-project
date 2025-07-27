import { Sidebar } from './Sidebar';
import { MainDashboard } from './MainDashboard';

export const AdminDashboard = () => (
  <div className="flex min-h-screen bg-gray-100">
    <Sidebar />
    <div className="flex-1 ml-64">
      <MainDashboard />
    </div>
  </div>
);
export default AdminDashboard; 