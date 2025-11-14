import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function MonitoringDashboard() {
  const router = useRouter();
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Check if user is admin
    checkAuth();
    
    // Initial fetch
    fetchMonitoringData();
    
    // Auto-refresh every 30 seconds if enabled
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchMonitoringData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin/login');
    }
  };

  const fetchMonitoringData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch health
      const healthRes = await fetch('/api/monitoring/health');
      const healthData = await healthRes.json();
      setHealth(healthData);

      // Fetch metrics (requires admin)
      const metricsRes = await fetch('/api/monitoring/metrics', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics);
      }

      // Fetch alerts (requires admin)
      const alertsRes = await fetch('/api/monitoring/alerts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'unhealthy': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p className="text-gray-600 mt-1">Real-time system health and metrics</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium ${
                autoRefresh 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchMonitoringData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              🔄 Refresh Now
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
            >
              ← Back to Admin
            </button>
          </div>
        </div>

        {/* Overall Status */}
        {health && (
          <div className={`p-6 rounded-lg mb-6 ${getStatusColor(health.status)} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">System Status: {health.status?.toUpperCase()}</h2>
                <p className="mt-1 opacity-90">Last updated: {new Date(health.timestamp).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{health.uptime?.formatted}</p>
                <p className="opacity-90">Uptime</p>
              </div>
            </div>
          </div>
        )}

        {/* Health Checks */}
        {health?.healthChecks && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Health Checks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(health.healthChecks).map(([name, check]) => (
                <div key={name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{name}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getStatusColor(check.status)}`}>
                      {check.status}
                    </span>
                  </div>
                  {check.responseTime && (
                    <p className="text-sm text-gray-600">Response: {check.responseTime}ms</p>
                  )}
                  {check.usage && (
                    <p className="text-sm text-gray-600">Usage: {check.usage}</p>
                  )}
                  {check.error && (
                    <p className="text-sm text-red-600 mt-1">{check.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-gray-600 text-sm">Total Requests</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.requests}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-gray-600 text-sm">Errors</p>
                <p className="text-3xl font-bold text-red-600">{metrics.errors}</p>
                <p className="text-sm text-gray-500">Rate: {metrics.errorRate}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-gray-600 text-sm">API Calls</p>
                <p className="text-3xl font-bold text-green-600">{metrics.apiCalls}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-gray-600 text-sm">DB Queries</p>
                <p className="text-3xl font-bold text-purple-600">{metrics.dbQueries}</p>
              </div>
            </div>
            
            {metrics.performance && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">Performance</p>
                <p className="text-sm text-gray-600">Avg Response Time: <span className="font-bold">{metrics.performance.avgResponseTime}</span></p>
                <p className="text-sm text-gray-600">Sample Size: {metrics.performance.sampleSize} requests</p>
              </div>
            )}
          </div>
        )}

        {/* System Info */}
        {health?.system && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Memory</h4>
                <p className="text-sm text-gray-600">Total: {(health.system.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                <p className="text-sm text-gray-600">Free: {(health.system.memory.free / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                <p className="text-sm text-gray-600">Usage: {health.system.memory.usagePercent}%</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      parseFloat(health.system.memory.usagePercent) > 90 ? 'bg-red-600' :
                      parseFloat(health.system.memory.usagePercent) > 80 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${health.system.memory.usagePercent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">CPU</h4>
                <p className="text-sm text-gray-600">Cores: {health.system.cpu.cores}</p>
                <p className="text-sm text-gray-600">Model: {health.system.cpu.model.substring(0, 40)}...</p>
                <p className="text-sm text-gray-600">Load Avg: {health.system.cpu.loadAvg[0].toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {alerts.slice().reverse().map((alert, index) => (
                <div 
                  key={alert.id || index} 
                  className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm mt-1">Type: {alert.type}</p>
                      {alert.details && (
                        <pre className="text-xs mt-2 overflow-x-auto">
                          {JSON.stringify(alert.details, null, 2).substring(0, 200)}...
                        </pre>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p>{new Date(alert.timestamp).toLocaleString()}</p>
                      <span className={`px-2 py-1 rounded text-xs font-bold mt-1 inline-block ${
                        alert.severity === 'critical' ? 'bg-red-600 text-white' :
                        alert.severity === 'high' ? 'bg-orange-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {alert.severity?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
