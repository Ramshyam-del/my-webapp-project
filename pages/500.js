import { useEffect } from 'react';

export default function Custom500() {
  useEffect(() => {
    console.error('500 error occurred');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">500</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Internal Server Error
          </h1>
          <p className="text-gray-300 mb-6">
            Something went wrong on our end. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
} 