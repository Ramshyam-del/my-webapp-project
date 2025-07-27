import { useState, useEffect } from 'react';
import { AuthWrapper } from './AuthWrapper';
import WalletConnectButton from './WalletConnectButton';

export const Navbar = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Smooth scroll for anchor links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAuthenticated(!!localStorage.getItem('token'));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.location.reload();
  };

  return (
    <nav className="flex justify-between items-center p-6 px-8 sticky top-0 bg-black bg-opacity-70 z-50 backdrop-blur-sm">
      <div className="flex items-center">
        {/* Exact isometric Y logo SVG */}
        <svg viewBox="0 0 120 140" width="48" height="48" xmlns="http://www.w3.org/2000/svg" className="mr-3">
          {/* Top Left Cube */}
          <g>
            <polygon points="30,35 45,26 60,35 45,44" fill="#2196F3"/>
            <polygon points="30,35 45,44 45,62 30,53" fill="#1976D2"/>
            <polygon points="60,35 45,44 45,62 60,53" fill="#1565C0"/>
          </g>
          {/* Top Center Cube */}
          <g>
            <polygon points="45,26 60,17 75,26 60,35" fill="#2196F3"/>
            <polygon points="45,26 60,35 60,53 45,44" fill="#1976D2"/>
            <polygon points="75,26 60,35 60,53 75,44" fill="#1565C0"/>
          </g>
          {/* Top Right Cube */}
          <g>
            <polygon points="60,35 75,26 90,35 75,44" fill="#2196F3"/>
            <polygon points="60,35 75,44 75,62 60,53" fill="#1976D2"/>
            <polygon points="90,35 75,44 75,62 90,53" fill="#1565C0"/>
          </g>
          {/* Middle Left Cube */}
          <g>
            <polygon points="30,53 45,62 60,71 45,80" fill="#2196F3"/>
            <polygon points="30,53 45,80 45,98 30,89" fill="#1976D2"/>
            <polygon points="60,71 45,80 45,98 60,89" fill="#1565C0"/>
          </g>
          {/* Center Cube */}
          <g>
            <polygon points="45,44 60,53 75,44 60,35" fill="#2196F3"/>
            <polygon points="45,44 60,53 60,71 45,62" fill="#1976D2"/>
            <polygon points="75,44 60,53 60,71 75,62" fill="#1565C0"/>
          </g>
          {/* Middle Right Cube */}
          <g>
            <polygon points="60,53 75,62 90,53 75,44" fill="#2196F3"/>
            <polygon points="60,53 75,44 75,62 60,71" fill="#1976D2"/>
            <polygon points="90,53 75,62 75,80 90,71" fill="#1565C0"/>
          </g>
          {/* Bottom Left Cube */}
          <g>
            <polygon points="30,89 45,98 60,107 45,116" fill="#2196F3"/>
            <polygon points="30,89 45,116 45,134 30,125" fill="#1976D2"/>
            <polygon points="60,107 45,116 45,134 60,125" fill="#1565C0"/>
          </g>
          {/* Bottom Center Cube */}
          <g>
            <polygon points="45,80 60,89 75,80 60,71" fill="#2196F3"/>
            <polygon points="45,80 60,71 60,89 45,98" fill="#1976D2"/>
            <polygon points="75,80 60,71 60,89 75,98" fill="#1565C0"/>
          </g>
          {/* Bottom Right Cube */}
          <g>
            <polygon points="60,89 75,98 90,89 75,80" fill="#2196F3"/>
            <polygon points="60,89 75,80 75,98 60,107" fill="#1976D2"/>
            <polygon points="90,89 75,98 75,116 90,107" fill="#1565C0"/>
          </g>
        </svg>
        <span className="text-3xl font-bold text-blue-600 tracking-widest select-none" style={{ letterSpacing: '2px' }}>
          QUANTEX
        </span>
      </div>
      <div className="flex items-center gap-4">
        <a href="#features" className="hidden md:inline hover:text-cyan-400 text-white">Features</a>
        <a href="#roadmap" className="hidden md:inline hover:text-cyan-400 text-white">Roadmap</a>
        <a href="#tokenomics" className="hidden md:inline hover:text-cyan-400 text-white">Tokenomics</a>
        <WalletConnectButton />
        {isAuthenticated ? (
          <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="bg-gray-800 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg transition" onClick={() => setShowAuth(true)}>
            Login
          </button>
        )}
      </div>
      {showAuth && (
        <AuthWrapper setShowAuth={setShowAuth} />
      )}
    </nav>
  );
}; 