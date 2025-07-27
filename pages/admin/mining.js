import React, { useEffect, useState } from 'react';
// Add PapaParse for CSV parsing
import Papa from 'papaparse';

export default function AdminMining() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    fetch('/api/mining-payouts')
      .then(res => res.json())
      .then(data => {
        setPayouts(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch mining payouts');
        setLoading(false);
      });
  }, [uploadStatus]);

  const currencies = ['All', ...Array.from(new Set(payouts.map(d => d.currency)))];
  const filteredData = filter === 'All' ? payouts : payouts.filter(d => d.currency === filter);

  // CSV upload handler
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadStatus('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let success = 0, fail = 0;
        for (const row of results.data) {
          // Expecting columns: user, currency, payout, balance, date
          try {
            const res = await fetch('/api/mining-payouts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(row),
            });
            if (res.ok) success++;
            else fail++;
          } catch {
            fail++;
          }
        }
        setUploadStatus(`Upload complete: ${success} success, ${fail} failed.`);
        setUploading(false);
      },
      error: () => {
        setUploadStatus('Failed to parse CSV.');
        setUploading(false);
      }
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Mining Finance</h1>
      <div className="bg-white rounded shadow p-6">
        {/* CSV Upload */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <label className="font-medium">Batch Upload Payouts (CSV):</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="border rounded px-2 py-1 text-sm"
            disabled={uploading}
          />
          {uploading && <span className="text-blue-600 text-sm">Uploading...</span>}
          {uploadStatus && <span className="text-green-600 text-sm">{uploadStatus}</span>}
        </div>
        <div className="mb-4 flex items-center gap-4">
          <label className="font-medium">Filter by Currency:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            {currencies.map(cur => (
              <option key={cur} value={cur}>{cur}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading mining payouts...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : filteredData.length === 0 ? (
          <div className="text-gray-600">No mining payouts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">User</th>
                  <th className="px-4 py-2 border">Currency</th>
                  <th className="px-4 py-2 border">Payout</th>
                  <th className="px-4 py-2 border">Balance</th>
                  <th className="px-4 py-2 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(row => (
                  <tr key={row._id} className="border-b">
                    <td className="px-4 py-2 border">{row.user?.email || row.user || '-'}</td>
                    <td className="px-4 py-2 border">{row.currency}</td>
                    <td className="px-4 py-2 border">{row.payout}</td>
                    <td className="px-4 py-2 border">{row.balance}</td>
                    <td className="px-4 py-2 border text-xs">{new Date(row.date).toLocaleString()}</td>
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