import React, { useState, useEffect, useCallback } from 'react';
import { Clock, User, Activity, AlertCircle, RefreshCw } from 'lucide-react';

const UserActivities = ({ userId = null, limit = 10, autoRefresh = true }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchActivities = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(userId && { user_id: userId }),
        ...(lastUpdate && { since: lastUpdate })
      });

      const endpoint = lastUpdate 
        ? `/api/admin/user-activities/recent?${params}`
        : `/api/admin/user-activities?${params}`;

      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (lastUpdate && data.activities) {
        // Append new activities to existing ones
        setActivities(prev => {
          const newActivities = data.activities.filter(
            newActivity => !prev.some(existing => existing.id === newActivity.id)
          );
          return [...newActivities, ...prev].slice(0, limit);
        });
      } else {
        setActivities(data.activities || []);
      }
      
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching user activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, limit, lastUpdate]);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchActivities();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [fetchActivities, autoRefresh]);

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'login':
      case 'logout':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'registration':
        return <User className="w-4 h-4 text-green-500" />;
      case 'trade_created':
      case 'trade_completed':
      case 'trade_cancelled':
        return <Activity className="w-4 h-4 text-purple-500" />;
      case 'withdrawal_requested':
      case 'withdrawal_completed':
      case 'withdrawal_cancelled':
        return <Activity className="w-4 h-4 text-orange-500" />;
      case 'login_failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (activityType) => {
    switch (activityType) {
      case 'login':
      case 'registration':
        return 'text-green-600';
      case 'logout':
        return 'text-blue-600';
      case 'trade_created':
      case 'trade_completed':
        return 'text-purple-600';
      case 'withdrawal_requested':
      case 'withdrawal_completed':
        return 'text-orange-600';
      case 'login_failed':
      case 'trade_cancelled':
      case 'withdrawal_cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setLastUpdate(null);
    fetchActivities();
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading activities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="ml-2 text-red-700">Error loading activities: {error}</span>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="ml-2 text-lg font-semibold text-gray-900">
            {userId ? 'User Activity' : 'Recent Activities'}
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Refresh activities"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No activities found
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.user_email}
                      </p>
                      <p className="text-xs text-gray-500 flex-shrink-0">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                    <p className={`text-sm ${getActivityColor(activity.activity_type)} mt-1`}>
                      {activity.activity_description}
                    </p>
                    {activity.ip_address && (
                      <p className="text-xs text-gray-400 mt-1">
                        IP: {activity.ip_address}
                      </p>
                    )}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2">
                        {activity.metadata.amount && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded mr-2">
                            {activity.metadata.amount} {activity.metadata.currency}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {autoRefresh && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
          Auto-refreshing every 5 seconds
        </div>
      )}
    </div>
  );
};

export default UserActivities;