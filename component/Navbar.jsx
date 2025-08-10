import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import WalletConnectButton from './WalletConnectButton';

export const Navbar = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { user, isAuthenticated, signOut, loading } = useAuth();

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      await signOut();
    }
  };

  // Show loading state only on client side and when auth is loading
  if (!isClient || loading) {
    return (
      <nav className="bg-gray-900 text-white p-4 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">Quantex</div>
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
          {/* Logo */}
          <div className="text-xl font-bold">Quantex</div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <a href="/" className="hover:text-cyan-400 transition-colors">HOME</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#roadmap" className="hover:text-cyan-400 transition-colors">Roadmap</a>
            <a href="#tokenomics" className="hover:text-cyan-400 transition-colors">Tokenomics</a>
          </div>

          {/* Desktop Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Auth Buttons */}
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

          {/* Mobile menu button */}
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

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 bg-gray-800 rounded-lg p-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Navigation Links */}
              <div className="flex flex-col space-y-2">
                <a href="/" className="text-white hover:text-cyan-400 transition-colors py-2">HOME</a>
                <a href="#features" className="text-white hover:text-cyan-400 transition-colors py-2">Features</a>
                <a href="#roadmap" className="text-white hover:text-cyan-400 transition-colors py-2">Roadmap</a>
                <a href="#tokenomics" className="text-white hover:text-cyan-400 transition-colors py-2">Tokenomics</a>
              </div>

              {/* Mobile Auth Buttons */}
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

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        initialMode="login"
      />
    </>
  );
}; 