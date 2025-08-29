import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { safeWindow, getSafeDocument } from '../utils/safeStorage';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from './useConfig';
import AuthModal from './AuthModal';
import WalletConnectButton from './WalletConnectButton';

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
    console.warn('AuthContext not available, using fallback state');
    authContext = { user: null, isAuthenticated: false, loading: false, signOut: () => {} };
  }

  const { user, signOut, loading } = authContext;

  useEffect(() => {
    console.log('🔄 Navbar: Initializing client side...');
    setIsClient(true);
    const document = getSafeDocument();
    if (document) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
    console.log('✅ Navbar: Client side initialized');
  }, []);

  useEffect(() => {
    if (isClient && !loading) {
      console.log('🔄 Navbar: Updating auth state:', { user: !!user, loading });
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
      <nav className="bg-gray-900 text-white p-4 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {config.logo && (
              <img 
                src={config.logo} 
                alt="Logo" 
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="text-xl font-bold">{config.title || config.officialWebsiteName || 'Quantex'}</div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="animate-pulse bg-gray-700 h-8 w-20 rounded"></div>
            <div className="animate-pulse bg-gray-700 h-8 w-16 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-gray-900 text-white p-4 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {config.logo && (
              <img 
                src={config.logo} 
                alt="Logo" 
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="text-xl font-bold">{config.title || config.officialWebsiteName || 'Quantex'}</div>
          </div>

          <div className="hidden md:flex space-x-8">
            <a href="/" className="hover:text-cyan-400 transition-colors">HOME</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#roadmap" className="hover:text-cyan-400 transition-colors">Roadmap</a>
            <a href="#tokenomics" className="hover:text-cyan-400 transition-colors">Tokenomics</a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <WalletConnectButton />
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <WalletConnectButton />
                <button
                  onClick={() => setShowAuth(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-cyan-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 bg-gray-800 rounded-lg p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <a href="/" className="text-white hover:text-cyan-400 transition-colors py-2">HOME</a>
                <a href="#features" className="text-white hover:text-cyan-400 transition-colors py-2">Features</a>
                <a href="#roadmap" className="text-white hover:text-cyan-400 transition-colors py-2">Roadmap</a>
                <a href="#tokenomics" className="text-white hover:text-cyan-400 transition-colors py-2">Tokenomics</a>
              </div>

              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-700">
                {isAuthenticated ? (
                  <>
                    <WalletConnectButton />
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <WalletConnectButton />
                    <button
                      onClick={() => setShowAuth(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        initialMode="login"
      />
    </>
  );
}

