import React, { useEffect, useState } from 'react';

export default function AdminOperate() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetch('/api/operation-logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch operation logs');
        setLoading(false);
      });
  }, []);

  const actionTypes = ['All', ...Array.from(new Set(logs.map(log => log.action)))];
  const filteredLogs = filter === 'All' ? logs : logs.filter(log => log.action === filter);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Operate Related</h1>
      <div className="bg-white rounded shadow p-6">
        <div className="mb-4 flex items-center gap-4">
          <label className="font-medium">Filter by Action:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading operation logs...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-gray-600">No operation logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">Admin</th>
                  <th className="px-4 py-2 border">Action</th>
                  <th className="px-4 py-2 border">Target</th>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log._id} className="border-b">
                    <td className="px-4 py-2 border">{log.admin}</td>
                    <td className="px-4 py-2 border">{log.action}</td>
                    <td className="px-4 py-2 border">{log.target}</td>
                    <td className="px-4 py-2 border text-xs">{new Date(log.date).toLocaleString()}</td>
                    <td className="px-4 py-2 border text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 