'use client';
import { useEffect, useState } from 'react';
import AdminDashboard from '../component/AdminDashboard';
import AdminLogin from '../component/AdminLogin';

export default function AdminHome() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAuth(!!localStorage.getItem('adminToken'));
    }
  }, []);

  if (!isAuth) {
    return <AdminLogin onLogin={() => setIsAuth(true)} />;
  }
  return <AdminDashboard />;
} 