import React, { useEffect, useState } from 'react';

function findDuplicates(users, key) {
  const seen = {};
  const duplicates = [];
  users.forEach(user => {
    const value = user[key];
    if (value) {
      if (seen[value]) {
        if (!duplicates.some(u => u._id === seen[value]._id)) {
          duplicates.push(seen[value]);
        }
        duplicates.push(user);
      } else {
        seen[value] = user;
      }
    }
  });
  return duplicates;
}

export default function AdminDuplicates() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        // Find duplicates by email and phone
        const emailDup = findDuplicates(data, 'email');
        const phoneDup = findDuplicates(data, 'phone');
        // Merge and deduplicate
        const allDup = [...emailDup, ...phoneDup].filter((u, i, arr) => arr.findIndex(x => x._id === u._id) === i);
        setDuplicates(allDup);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch users');
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Duplicate Detection</h1>
      <div className="bg-white rounded shadow p-6">
        {loading ? (
          <div className="text-gray-500">Loading users...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : duplicates.length === 0 ? (
          <div className="text-green-600">No duplicate users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">Phone</th>
                  <th className="px-4 py-2 border">User ID</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.map(user => (
                  <tr key={user._id} className="border-b bg-yellow-50">
                    <td className="px-4 py-2 border">{user.name || user.email || user.phone}</td>
                    <td className="px-4 py-2 border">{user.email || '-'}</td>
                    <td className="px-4 py-2 border">{user.phone || '-'}</td>
                    <td className="px-4 py-2 border font-mono text-xs">{user._id}</td>
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