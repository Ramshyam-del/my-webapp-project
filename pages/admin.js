'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminLogin from '../component/AdminLogin';
import AdminDashboard from '../component/AdminDashboard';
import AdminSidebar from '../component/AdminSidebar';
import AdminTopbar from '../component/AdminTopbar';

export default function AdminHome() {
  const [isAuth, setIsAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAuth(!!localStorage.getItem('adminToken'));
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuth(false);
    router.push('/admin');
  };

  if (!isAuth) {
    return <AdminLogin onLogin={() => setIsAuth(true)} />;
  }

  // Main admin layout with sidebar and topbar
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        currentPath={pathname}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto">
          <AdminRouteContent pathname={pathname} />
        </main>
      </div>
    </div>
  );
}

// Component to render different admin routes
function AdminRouteContent({ pathname }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Route-based rendering
  switch (pathname) {
    case '/admin':
      return <AdminDashboard />;
      
    case '/admin/users':
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts and data</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <p className="text-gray-600">User management features coming soon!</p>
            </div>
          </div>
        </div>
      );
      
    case '/admin/transactions':
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
            <p className="text-gray-600 mt-1">View and manage all transactions</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">💳</div>
              <p className="text-gray-600">Transaction management features coming soon!</p>
            </div>
          </div>
        </div>
      );
      
    case '/admin/kyc':
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
            <p className="text-gray-600 mt-1">Review and approve KYC submissions</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <p className="text-gray-600">KYC verification features coming soon!</p>
            </div>
          </div>
        </div>
      );
      
    case '/admin/funds':
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Fund Management</h1>
            <p className="text-gray-600 mt-1">Manage platform funds and operations</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <p className="text-gray-600">Fund management features coming soon!</p>
            </div>
          </div>
        </div>
      );
      
    case '/admin/mining':
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mining Finance</h1>
            <p className="text-gray-600 mt-1">Manage mining operations and payouts</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">⛏️</div>
              <p className="text-gray-600">Mining finance features coming soon!</p>
            </div>
          </div>
        </div>
      );
      
    case '/admin/operate':
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Operations</h1>
            <p className="text-gray-600 mt-1">System operations and maintenance</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">🛠️</div>
              <p className="text-gray-600">Operations features coming soon!</p>
            </div>
          </div>
        </div>
      );
      
    case '/admin/system':
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Configure system settings and security</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">⚙️</div>
              <p className="text-gray-600">System settings features coming soon!</p>
            </div>
          </div>
        </div>
      );
      
    case '/admin/duplicates':
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Duplicate Detection</h1>
            <p className="text-gray-600 mt-1">Find and manage duplicate accounts</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <p className="text-gray-600">Duplicate detection features coming soon!</p>
            </div>
          </div>
        </div>
      );
      
    default:
      return <AdminDashboard />;
  }
} 