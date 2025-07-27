'use client';
import { useEffect, useState } from 'react';
import AdminDashboard from '../../component/AdminDashboard';
import AdminLogin from '../../component/AdminLogin';

export default function AdminHome() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAuth(!!localStorage.getItem('adminToken'));
    }
  }, []);

  if (!isAuth) {
    return (
      <div>
        <div style={{color: 'red', fontWeight: 'bold', fontSize: '2rem'}}>DEBUG: Should see admin login form here</div>
        <AdminLogin onLogin={() => setIsAuth(true)} />
      </div>
    );
  }
  return (
    <div>
      <div style={{color: 'green', fontWeight: 'bold', fontSize: '2rem'}}>DEBUG: Showing AdminDashboard</div>
      <AdminDashboard />
    </div>
  );
} 