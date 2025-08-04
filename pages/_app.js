import '../styles/globals.css';
import ErrorBoundary from '../component/ErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ErrorBoundary>
  );
} 