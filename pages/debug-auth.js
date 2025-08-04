import { useAuth } from '../contexts/AuthContext';

export default function DebugAuth() {
  const { user, session, loading, isAuthenticated, signIn, signUp } = useAuth();

  const testSignUp = async () => {
    console.log('Testing signup...');
    const result = await signUp('test@example.com', 'password123', {
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      phone: '1234567890'
    });
    console.log('Signup result:', result);
  };

  const testSignIn = async () => {
    console.log('Testing signin...');
    const result = await signIn('test@example.com', 'password123');
    console.log('Signin result:', result);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Environment Variables:</h2>
          <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Auth State:</h2>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          <p>User: {user ? JSON.stringify(user, null, 2) : 'None'}</p>
          <p>Session: {session ? 'Active' : 'None'}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Test Buttons:</h2>
          <div className="space-x-4">
            <button
              onClick={testSignUp}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Test Sign Up
            </button>
            <button
              onClick={testSignIn}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Test Sign In
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Console Logs:</h2>
          <p>Check the browser console for detailed logs</p>
        </div>
      </div>
    </div>
  );
} 