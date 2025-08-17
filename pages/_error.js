import React from 'react';

function Error({ statusCode, err }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {statusCode ? `Error ${statusCode}` : 'Application Error'}
          </h1>
          <p className="text-gray-600 mb-4">
            {statusCode
              ? `A ${statusCode} error occurred on the server.`
              : 'An error occurred on the client.'}
          </p>
          {err && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-800 font-mono break-all">
                {err.message || 'Unknown error'}
              </p>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, err };
};

export default Error; 