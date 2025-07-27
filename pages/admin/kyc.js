import React, { useEffect, useState } from 'react';

export default function AdminKYC() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch users');
        setLoading(false);
      });
  }, []);

  const handleKycAction = async (userId, status) => {
    setActionLoading(userId + status);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realNameAuth: status }),
      });
      if (!res.ok) throw new Error('Failed to update KYC status');
      setUsers(users => users.map(u => u._id === userId ? { ...u, realNameAuth: status } : u));
    } catch (err) {
      setError('Failed to update KYC status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">KYC Verification</h1>
      <div className="bg-white rounded shadow p-6">
        {loading ? (
          <div className="text-gray-500">Loading users...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">KYC Status</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b">
                    <td className="px-4 py-2 border">{user.name || user.email || user.phone}</td>
                    <td className="px-4 py-2 border">{user.email || '-'}</td>
                    <td className="px-4 py-2 border">
                      {user.realNameAuth === true ? (
                        <span className="text-green-600 font-semibold">Approved</span>
                      ) : user.realNameAuth === false ? (
                        <span className="text-red-600 font-semibold">Rejected</span>
                      ) : (
                        <span className="text-yellow-600 font-semibold">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border space-x-2">
                      <button
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold disabled:opacity-50"
                        disabled={user.realNameAuth === true || actionLoading === user._id + 'true'}
                        onClick={() => handleKycAction(user._id, true)}
                      >
                        {actionLoading === user._id + 'true' ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold disabled:opacity-50"
                        disabled={user.realNameAuth === false || actionLoading === user._id + 'false'}
                        onClick={() => handleKycAction(user._id, false)}
                      >
                        {actionLoading === user._id + 'false' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </td>
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