import { useState } from 'react';

export const Topbar = () => {
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      window.location.reload();
    }
  };
  return (
    <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 shadow-sm h-14">
      <nav className="flex items-center gap-6 text-sm">
        <a href="#" className="hover:text-blue-600 text-gray-700">Transaction monitoring(0)</a>
        <a href="#" className="hover:text-blue-600 text-gray-700">Real name authentication(33)</a>
        <a href="#" className="hover:text-blue-600 text-gray-700">Recharge(310)</a>
        <a href="#" className="hover:text-blue-600 text-gray-700">withdraw funds(2092)</a>
        <a href="#" className="hover:text-blue-600 text-gray-700">Features(0)</a>
      </nav>
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-base border border-gray-300">A</span>
        <span className="font-semibold text-gray-700 text-sm">admin</span>
        <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
        <button
          onClick={handleLogout}
          className="ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition text-xs font-semibold shadow"
        >
          Logout
        </button>
      </div>
    </header>
  );
}; 