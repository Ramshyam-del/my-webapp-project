import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const AuthWrapper = ({ setShowAuth }) => {
  const [mode, setMode] = useState('login');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-black bg-opacity-60">
      <div className="bg-black rounded-xl shadow-lg p-6 max-w-md w-full flex flex-col justify-center relative">
        <button
          onClick={() => setShowAuth(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close login/register modal"
        >
          &times;
        </button>
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setMode('login')}
            className={`px-4 py-2 font-semibold border-b-2 ${mode === 'login' ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-white'}`}>LOGIN</button>
          <button
            onClick={() => setMode('register')}
            className={`ml-4 px-4 py-2 font-semibold border-b-2 ${mode === 'register' ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-white'}`}>SIGN UP</button>
        </div>
        {mode === 'login' ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}; 