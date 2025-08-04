export default function TestEnv() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">NEXT_PUBLIC_SUPABASE_URL:</h2>
          <p className="text-gray-300">{process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY:</h2>
          <p className="text-gray-300">
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
              `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50)}...` : 
              'NOT SET'
            }
          </p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">All Environment Variables:</h2>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(process.env, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 