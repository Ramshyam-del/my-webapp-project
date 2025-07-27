import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const menu = [
  {
    label: 'home',
    icon: '🏠',
    href: '/admin',
    hot: true,
    tooltip: 'Dashboard Home',
  },
  {
    label: 'User Related',
    icon: '👤',
    tooltip: 'User Management',
    children: [
      { label: 'User management', href: '/admin/users', tooltip: 'Manage Users' },
      { label: 'KYC', href: '/admin/kyc', tooltip: 'KYC Verification' },
      { label: 'duplicate detection', href: '/admin/duplicates', tooltip: 'Detect Duplicates' },
    ],
  },
  {
    label: 'Fund management', icon: '💰', href: '/admin/funds', tooltip: 'Manage Funds' },
  { label: 'Transaction', icon: '🔄', href: '/admin/transactions', tooltip: 'Transactions' },
  { label: 'system management', icon: '⚙️', href: '/admin/system', tooltip: 'System Settings' },
  { label: 'Operate related', icon: '🛠️', href: '/admin/operate', tooltip: 'Operations' },
  { label: 'Mining finance', icon: '⛏️', href: '/admin/mining', tooltip: 'Mining & Finance' },
];

export const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSidebarToggle = () => setSidebarOpen((v) => !v);

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 text-white p-2 rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={handleSidebarToggle}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        )}
      </button>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-gray-900 via-blue-900 to-gray-800 text-white flex flex-col shadow-2xl z-40 animate-fade-in transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:block`}
        style={{ minWidth: '16rem' }}
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center justify-between h-20 border-b border-gray-800 px-4">
          <span className="text-2xl font-extrabold tracking-widest text-blue-400 drop-shadow-lg">QUANTEX</span>
          {/* Close button for mobile */}
          <button
            className="md:hidden text-gray-300 hover:text-white focus:outline-none"
            onClick={handleSidebarToggle}
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {menu.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <div>
                    <button
                      className={`group flex items-center w-full px-4 py-2 hover:bg-blue-800/70 focus:outline-none rounded transition-all duration-200 ${openMenus[item.label] ? 'bg-blue-900/80' : ''}`}
                      onClick={() => toggleMenu(item.label)}
                      title={item.tooltip}
                    >
                      <span className="mr-2 text-xl group-hover:scale-110 transition-transform duration-200" title={item.tooltip}>{item.icon}</span>
                      <span className="flex-1 text-left capitalize font-medium">{item.label}</span>
                      <span className="ml-auto">{openMenus[item.label] ? '▼' : '▶'}</span>
                    </button>
                    {openMenus[item.label] && (
                      <ul className="ml-8 mt-1 space-y-1 animate-fade-in">
                        {item.children.map((child) => (
                          <li key={child.label}>
                            <Link href={child.href} legacyBehavior>
                              <a
                                className={`block px-3 py-1 rounded hover:bg-blue-700/80 transition-all duration-200 ${router.pathname === child.href ? 'bg-blue-700/90 font-bold shadow' : ''}`}
                                title={child.tooltip}
                                onClick={() => setSidebarOpen(false)}
                              >
                                {child.label}
                              </a>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link href={item.href || '#'} legacyBehavior>
                    <a
                      className={`group flex items-center px-4 py-2 rounded hover:bg-blue-800/70 transition-all duration-200 ${router.pathname === item.href ? 'bg-blue-800/90 font-bold shadow' : ''}`}
                      title={item.tooltip}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-2 text-xl group-hover:scale-110 transition-transform duration-200" title={item.tooltip}>{item.icon}</span>
                      <span>{item.label}</span>
                      {item.hot && <span className="ml-2 bg-blue-500 text-xs px-2 py-0.5 rounded-full animate-pulse">hot</span>}
                    </a>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={handleSidebarToggle}
          aria-label="Close sidebar overlay"
        />
      )}
    </>
  );
}; 