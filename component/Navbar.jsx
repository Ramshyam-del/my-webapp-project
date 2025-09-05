import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { safeWindow, getSafeDocument } from '../utils/safeStorage';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from './useConfig';
import AuthModal from './AuthModal';

export default function Navbar() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { config, loading: configLoading } = useConfig();

  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('AuthContext not available, using fallback state');
    }
    authContext = { user: null, isAuthenticated: false, loading: false, signOut: () => {} };
  }

  const { user, signOut, loading } = authContext;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Navbar: Initializing client side...');
    }
    setIsClient(true);
    const document = getSafeDocument();
    if (document) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Navbar: Client side initialized');
    }
  }, []);

  useEffect(() => {
    if (isClient && !loading) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Navbar: Updating auth state:', { user: !!user, loading });
      }
      setIsAuthenticated(!!user);
    }
  }, [user, loading, isClient]);

  const handleLogout = async () => {
    const document = getSafeDocument();
    const confirmLogout = document?.confirm?.('Are you sure you want to log out?') || true;
    
    if (confirmLogout) {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  if (!isClient || loading) {
    return (
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed w-full top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-3">
            {config.logo && (
              <motion.img 
                src={config.logo} 
                alt="Logo" 
                className="h-8 w-8 object-contain"
                whileHover={{ scale: 1.1, rotate: 5 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <motion.div 
              className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              {config.title || config.officialWebsiteName || 'Quantex'}
            </motion.div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="animate-pulse bg-gradient-to-r from-cyan-500/20 to-purple-500/20 h-10 w-24 rounded-lg backdrop-blur-sm"></div>
            <div className="animate-pulse bg-gradient-to-r from-blue-500/20 to-cyan-500/20 h-10 w-20 rounded-lg backdrop-blur-sm"></div>
          </div>
        </div>
      </motion.nav>
    );
  }

  return (
    <>
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed w-full top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            {config.logo && (
              <motion.img 
                src={config.logo} 
                alt="Logo" 
                className="h-8 w-8 object-contain"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <motion.div 
              className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              {config.title || config.officialWebsiteName || 'Quantex'}
            </motion.div>
          </motion.div>

          <div className="hidden md:flex space-x-8">
            {[
              { href: "/", label: "HOME" },
              { href: "#features", label: "Features" },
              { href: "#roadmap", label: "Roadmap" },
              { href: "#tokenomics", label: "Tokenomics" }
            ].map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="relative text-white/80 hover:text-white transition-all duration-300 font-medium"
                whileHover={{ scale: 1.05, y: -2 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="relative z-10">{item.label}</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.a>
            ))}
          </div>

          <motion.div 
            className="hidden md:flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={handleLogout}
                  className="relative px-6 py-2 rounded-lg font-medium text-white overflow-hidden group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                  <span className="relative z-10">Logout</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={() => setShowAuth(true)}
                  className="relative px-6 py-2 rounded-lg font-medium text-white overflow-hidden group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                  <span className="relative z-10">Log In</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              </div>
            )}
          </motion.div>

          <motion.div 
            className="md:hidden flex items-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-white/80 hover:text-white backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </motion.svg>
            </motion.button>
          </motion.div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden mt-4 backdrop-blur-md bg-black/40 rounded-xl p-6 border border-white/10"
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-6">
                <div className="flex flex-col space-y-1">
                  {[
                    { href: "/", label: "HOME" },
                    { href: "#features", label: "Features" },
                    { href: "#roadmap", label: "Roadmap" },
                    { href: "#tokenomics", label: "Tokenomics" }
                  ].map((item, index) => (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      className="relative text-white/80 hover:text-white py-3 px-4 rounded-lg transition-all duration-300 font-medium"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 10 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      />
                      <span className="relative z-10">{item.label}</span>
                    </motion.a>
                  ))}
                </div>

                <motion.div 
                  className="flex flex-col space-y-3 pt-4 border-t border-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {isAuthenticated ? (
                    <>
                      <motion.button
                        onClick={handleLogout}
                        className="relative px-4 py-3 rounded-lg font-medium text-white overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-80" />
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                        <span className="relative z-10">Logout</span>
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        onClick={() => setShowAuth(true)}
                        className="relative px-4 py-3 rounded-lg font-medium text-white overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-80" />
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                        <span className="relative z-10">Log In</span>
                      </motion.button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
       </motion.nav>

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        initialMode="login"
      />
    </>
  );
}

