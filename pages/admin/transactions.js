import React, { useEffect, useState } from 'react';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch transactions');
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      <div className="bg-white rounded shadow p-6">
        {loading ? (
          <div className="text-gray-500">Loading transactions...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-600">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">User</th>
                  <th className="px-4 py-2 border">Type</th>
                  <th className="px-4 py-2 border">Amount</th>
                  <th className="px-4 py-2 border">Currency</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id} className="border-b">
                    <td className="px-4 py-2 border">{tx.user?.email || tx.user || '-'}</td>
                    <td className="px-4 py-2 border capitalize">{tx.type}</td>
                    <td className="px-4 py-2 border">{tx.amount}</td>
                    <td className="px-4 py-2 border">{tx.currency}</td>
                    <td className="px-4 py-2 border">
                      {tx.status === 'completed' ? (
                        <span className="text-green-600 font-semibold">Completed</span>
                      ) : tx.status === 'failed' ? (
                        <span className="text-red-600 font-semibold">Failed</span>
                      ) : (
                        <span className="text-yellow-600 font-semibold">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
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