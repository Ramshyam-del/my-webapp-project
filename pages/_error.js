import { useEffect } from 'react';

function Error({ statusCode }) {
  useEffect(() => {
    // Log error for debugging
    console.error('Page error:', statusCode);
  }, [statusCode]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">
            {statusCode ? statusCode : '⚠️'}
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {statusCode
              ? `Error ${statusCode}`
              : 'Something went wrong'}
          </h1>
          <p className="text-gray-300 mb-6">
            {statusCode
              ? `A ${statusCode} error occurred on the server.`
              : 'An error occurred on the client.'}
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

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 