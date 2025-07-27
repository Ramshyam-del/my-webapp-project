import { useEffect, useState } from 'react';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { label: 'Choose', value: '' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Frozen', value: 'Frozen' },
];

function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  }).then(async res => {
    if (res.status === 401) {
      alert('Session expired or unauthorized. Please log in again.');
      localStorage.removeItem('token');
      window.location.reload();
      throw new Error('Unauthorized');
    }
    return res;
  });
}

const emptyUser = {
  email: '',
  invitationCode: '',
  vipLevel: 'VIP0',
  balanceStatus: 'Normal',
  creditScore: 100,
  realNameAuth: 'uncertified',
  totalAssets: 0,
  totalRecharge: 0,
  totalWithdrawal: 0,
  superiorAccount: '',
  registered: '',
};

function UserModal({ open, onClose, onSave, user, isEdit }) {
  const [form, setForm] = useState(user || emptyUser);
  useEffect(() => { setForm(user || emptyUser); }, [user, open]);
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); onSave(form); };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl transition-colors">&times;</button>
        <h2 className="text-lg font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border rounded px-3 py-1 col-span-2" required />
          <input name="invitationCode" value={form.invitationCode} onChange={handleChange} placeholder="Invitation Code" className="border rounded px-3 py-1" />
          <input name="vipLevel" value={form.vipLevel} onChange={handleChange} placeholder="VIP Level" className="border rounded px-3 py-1" />
          <select name="balanceStatus" value={form.balanceStatus} onChange={handleChange} className="border rounded px-3 py-1">
            <option value="Normal">Normal</option>
            <option value="Frozen">Frozen</option>
          </select>
          <input name="creditScore" value={form.creditScore} onChange={handleChange} placeholder="Credit Score" type="number" className="border rounded px-3 py-1" />
          <input name="realNameAuth" value={form.realNameAuth} onChange={handleChange} placeholder="Real Name Auth" className="border rounded px-3 py-1" />
          <input name="totalAssets" value={form.totalAssets} onChange={handleChange} placeholder="Total Assets U" type="number" className="border rounded px-3 py-1" />
          <input name="totalRecharge" value={form.totalRecharge} onChange={handleChange} placeholder="Total Recharge" type="number" className="border rounded px-3 py-1" />
          <input name="totalWithdrawal" value={form.totalWithdrawal} onChange={handleChange} placeholder="Total Withdrawal" type="number" className="border rounded px-3 py-1" />
          <input name="superiorAccount" value={form.superiorAccount} onChange={handleChange} placeholder="Superior Account" className="border rounded px-3 py-1" />
          <input name="registered" value={form.registered} onChange={handleChange} placeholder="Registration Date (YYYY-MM-DD)" className="border rounded px-3 py-1" />
          <button type="submit" className="col-span-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded mt-2 transition-colors">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

function BatchNotificationModal({ open, onClose, users, onSend }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg relative">
        <Toast message={toast} onClose={() => setToast('')} />
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl transition-colors">&times;</button>
        <h2 className="text-lg font-bold mb-2">Batch Notification</h2>
        <div className="mb-2 text-sm text-gray-700">Selected users:</div>
        <ul className="mb-2 max-h-24 overflow-y-auto text-xs text-gray-600">
          {users.map(u => <li key={u._id}>{u.email}</li>)}
        </ul>
        <form onSubmit={async e => {
          e.preventDefault();
          setLoading(true);
          await fetch('http://localhost:4000/api/users/batch-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userIds: users.map(u => u._id),
              title,
              content: message,
            }),
          });
          setLoading(false);
          setToast('Notification sent!');
          setTimeout(() => { setToast(''); onSend(message); }, 1200);
        }}>
          <input
            className="w-full border rounded px-3 py-2 mb-2 text-sm"
            placeholder="Notification title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={60}
            required
          />
          <span className="text-xs text-gray-400">{title.length}/60</span>
          <textarea
            className="w-full border rounded px-3 py-2 mb-3 text-sm"
            rows={3}
            placeholder="Enter notification message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={300}
            required
          />
          <span className="text-xs text-gray-400">{message.length}/300</span>
          <button
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded transition-colors"
            type="submit"
            disabled={loading}
          >{loading ? 'Sending...' : 'Send Notification'}</button>
        </form>
      </div>
    </div>
  );
}

function StatusSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-200 ${checked ? 'bg-teal-400' : 'bg-gray-300'}`}
      style={{ outline: 'none' }}
    >
      <span
        className={`absolute left-0 top-0 w-8 h-4 rounded-full ${checked ? 'bg-teal-300' : 'bg-gray-200'}`}
      />
      <span
        className={`absolute top-0 ${checked ? 'left-4' : 'left-0'} w-4 h-4 bg-white border border-gray-300 rounded-full shadow transition-all duration-200`}
      />
    </button>
  );
}

function CircularizeModal({ open, onClose, user }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => { setTitle(''); setContent(''); }, [user, open]);
  if (!open || !user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl relative">
        <Toast message={toast} onClose={() => setToast('')} />
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl transition-colors">&times;</button>
        <div className="bg-gray-700 text-white px-6 py-3 rounded-t-lg flex items-center justify-between">
          <span className="font-semibold">Circularize</span>
        </div>
        <form
          className="p-8"
          onSubmit={async e => {
            e.preventDefault();
            setLoading(true);
            await fetch(`http://localhost:4000/api/users/${user._id}/notifications`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, content }),
            });
            setLoading(false);
            setToast('Message sent!');
            setTimeout(() => { setToast(''); onClose(); }, 1200);
          }}
        >
          <div className="mb-4 flex items-center">
            <label className="w-32 text-gray-700 font-medium">recipients:</label>
            <input className="flex-1 border rounded px-3 py-1 bg-gray-100 text-gray-700" value={user.email} readOnly />
          </div>
          <div className="mb-4 flex items-center">
            <label className="w-32 text-gray-700 font-medium">Title:</label>
            <input className="flex-1 border rounded px-3 py-1" value={title} onChange={e => setTitle(e.target.value)} maxLength={60} required />
            <span className="ml-2 text-xs text-gray-400">{title.length}/60</span>
          </div>
          <div className="mb-6 flex items-start">
            <label className="w-32 text-gray-700 font-medium pt-2">Content:</label>
            <textarea className="flex-1 border rounded px-3 py-2 min-h-[80px]" value={content} onChange={e => setContent(e.target.value)} maxLength={300} required />
            <span className="ml-2 text-xs text-gray-400">{content.length}/300</span>
          </div>
          <div className="bg-gray-100 px-6 py-3 rounded-b-lg flex justify-start gap-3">
            <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-1.5 rounded font-semibold transition-colors" disabled={loading}>{loading ? 'Sending...' : 'Confirm'}</button>
            <button type="button" className="bg-white border border-gray-400 text-gray-700 px-6 py-1.5 rounded font-semibold transition-colors" onClick={() => { setTitle(''); setContent(''); }}>Reset</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ open, onClose, user, onSave }) {
  const [form, setForm] = useState(user || emptyUser);
  useEffect(() => { setForm(user || emptyUser); }, [user, open]);
  if (!open || !user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl transition-colors">&times;</button>
        <div className="bg-gray-700 text-white px-6 py-3 rounded-t-lg flex items-center justify-between">
          <span className="font-semibold">Edit</span>
        </div>
        <form
          className="p-8"
          onSubmit={e => { e.preventDefault(); onSave(form); }}
        >
          <div className="mb-4 flex items-center">
            <label className="w-48 text-gray-700 font-medium">User account:</label>
            <input className="flex-1 border rounded px-3 py-1 bg-gray-100 text-gray-700" value={form.email} readOnly />
          </div>
          <div className="mb-4 flex items-center">
            <label className="w-48 text-gray-700 font-medium">Password:</label>
            <input type="password" className="flex-1 border rounded px-3 py-1" placeholder="Do not fill or modify" disabled />
          </div>
          <div className="mb-4 flex items-center">
            <label className="w-48 text-gray-700 font-medium">Withdrawal password:</label>
            <input type="password" className="flex-1 border rounded px-3 py-1" placeholder="Do not fill or modify" disabled />
          </div>
          <div className="mb-4 flex items-center">
            <label className="w-48 text-gray-700 font-medium">USDT Withdrawal address:</label>
            <input name="usdtAddress" className="flex-1 border rounded px-3 py-1" value={form.usdtAddress || ''} onChange={e => setForm(f => ({ ...f, usdtAddress: e.target.value }))} />
          </div>
          <div className="mb-4 flex items-center">
            <label className="w-48 text-gray-700 font-medium">BTC Withdrawal address:</label>
            <input name="btcAddress" className="flex-1 border rounded px-3 py-1" value={form.btcAddress || ''} onChange={e => setForm(f => ({ ...f, btcAddress: e.target.value }))} />
          </div>
          <div className="mb-4 flex items-center">
            <label className="w-48 text-gray-700 font-medium">ETH Withdrawal address:</label>
            <input name="ethAddress" className="flex-1 border rounded px-3 py-1" value={form.ethAddress || ''} onChange={e => setForm(f => ({ ...f, ethAddress: e.target.value }))} />
          </div>
          <div className="bg-gray-100 px-6 py-3 rounded-b-lg flex justify-start gap-3 mt-6">
            <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-1.5 rounded font-semibold transition-colors">Confirm</button>
            <button type="button" className="bg-white border border-gray-400 text-gray-700 px-6 py-1.5 rounded font-semibold transition-colors" onClick={() => setForm(user)}>Reset</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add a simple Toast component for success messages
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 animate-bounceIn">
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white font-bold">&times;</button>
    </div>
  );
}

// --- Bank Card Modal ---
function BankCardModal({ open, onClose, userId }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ cardNumber: '', bankName: '', holderName: '' });
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      fetch(`http://localhost:4000/api/users/${userId}/bank-cards`)
        .then(res => res.json())
        .then(setCards)
        .finally(() => setLoading(false));
    }
  }, [open, userId]);
  const handleAdd = async e => {
    e.preventDefault();
    setLoading(true);
    await fetch(`http://localhost:4000/api/users/${userId}/bank-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ cardNumber: '', bankName: '', holderName: '' });
    fetch(`http://localhost:4000/api/users/${userId}/bank-cards`)
      .then(res => res.json())
      .then(setCards)
      .finally(() => setLoading(false));
    setToast('Card added!');
  };
  const handleRemove = async cardId => {
    if (!window.confirm('Are you sure you want to remove this card?')) return;
    setLoading(true);
    await fetch(`http://localhost:4000/api/users/${userId}/bank-cards/${cardId}`, { method: 'DELETE' });
    fetch(`http://localhost:4000/api/users/${userId}/bank-cards`)
      .then(res => res.json())
      .then(setCards)
      .finally(() => setLoading(false));
    setToast('Card removed!');
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg relative">
        <Toast message={toast} onClose={() => setToast('')} />
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl transition-colors">&times;</button>
        <h2 className="text-lg font-bold mb-4">Bank Cards</h2>
        {loading ? <div className="flex justify-center items-center py-6"><svg className="animate-spin h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div> : (
          <ul className="mb-4">
            {cards.length === 0 ? <li className="text-gray-500 flex items-center gap-2"><svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>No cards found.</li> : cards.map(card => (
              <li key={card._id} className="flex items-center justify-between border-b py-2">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" /><path d="M2 11h20" /></svg>
                  <div>
                    <div className="font-semibold">{card.bankName}</div>
                    <div className="text-xs text-gray-600">**** **** **** {card.cardNumber.slice(-4)}</div>
                    <div className="text-xs text-gray-600">{card.holderName}</div>
                  </div>
                </div>
                <button onClick={() => handleRemove(card._id)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors" title="Remove card">Remove</button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAdd} className="space-y-2">
          <input value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: e.target.value }))} placeholder="Card Number" className="border rounded px-3 py-1 w-full" required />
          <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="Bank Name" className="border rounded px-3 py-1 w-full" required />
          <input value={form.holderName} onChange={e => setForm(f => ({ ...f, holderName: e.target.value }))} placeholder="Holder Name" className="border rounded px-3 py-1 w-full" required />
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors">Add Card</button>
        </form>
      </div>
    </div>
  );
}

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [superior, setSuperior] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [circularizeUser, setCircularizeUser] = useState(null);
  const [bankCardUser, setBankCardUser] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setLoading(true);
    authFetch('http://localhost:4000/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = users;
    if (search) data = data.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));
    if (superior) data = data.filter(u => u.superiorAccount && u.superiorAccount.toLowerCase().includes(superior.toLowerCase()));
    if (status) data = data.filter(u => u.balanceStatus === status);
    if (date) data = data.filter(u => u.registered === date);
    setFiltered(data);
    setPage(1);
  }, [search, superior, status, date, users]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSelectAll = e => {
    if (e.target.checked) setSelected(paged.map(u => u._id));
    else setSelected([]);
  };
  const handleSelect = (id, checked) => {
    setSelected(checked ? [...selected, id] : selected.filter(i => i !== id));
  };
  const handleFreeze = async id => {
    await authFetch(`http://localhost:4000/api/users/${id}/freeze`, { method: 'POST' });
    setLoading(true);
    authFetch('http://localhost:4000/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  };
  const handleLogin = async id => {
    await authFetch(`http://localhost:4000/api/users/${id}/login`, { method: 'POST' });
    alert('One-click login successful!');
  };
  const handleReset = () => {
    setSearch(''); setSuperior(''); setStatus(''); setDate('');
  };
  const handleAdd = () => {
    setEditUser(null);
    setModalOpen(true);
  };
  const handleEdit = (user) => {
    setEditUser(user);
    setModalOpen(true);
  };
  const handleSave = async (form) => {
    if (editUser) {
      await authFetch(`http://localhost:4000/api/users/${editUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
    } else {
      await authFetch('http://localhost:4000/api/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
    }
    setModalOpen(false);
    setLoading(true);
    authFetch('http://localhost:4000/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  };

  const handleStatusToggle = async (id, field, value) => {
    await authFetch(`http://localhost:4000/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value }),
    });
    setLoading(true);
    authFetch('http://localhost:4000/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  };

  const STATUS_SWITCH = (
    <span className="inline-flex items-center justify-center w-8 h-6">
      <span className="relative inline-block w-8 h-4 align-middle select-none">
        <span className="absolute left-0 top-0 w-8 h-4 bg-teal-300 rounded-full" />
        <span className="absolute left-4 top-0 w-4 h-4 bg-white border border-gray-300 rounded-full shadow" />
      </span>
    </span>
  );

  const getIp = (user) => user.latestIp || '51.36.9.157';
  const getIpTime = (user) => user.latestIpTime || '2025-07-21 19:59:40';

  return (
    <div className="w-full">
      <EditUserModal open={modalOpen} onClose={() => setModalOpen(false)} user={editUser} onSave={handleSave} />
      <BatchNotificationModal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        users={users.filter(u => selected.includes(u._id))}
        onSend={msg => { setBatchModalOpen(false); alert(`Notification sent to ${selected.length} users!`); }}
      />
      <CircularizeModal open={!!circularizeUser} onClose={() => setCircularizeUser(null)} user={circularizeUser} />
      <BankCardModal open={!!bankCardUser} onClose={() => setBankCardUser(null)} userId={bankCardUser?._id} />
      {/* Search/filter bar */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="User account" className="border border-gray-300 rounded px-3 py-1 text-sm w-56" />
        <input value={superior} onChange={e => setSuperior(e.target.value)} placeholder="Superior account" className="border border-gray-300 rounded px-3 py-1 text-sm w-56" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded px-3 py-1 text-sm w-48">
          {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-300 rounded px-3 py-1 text-sm w-48" />
        <button onClick={() => {}} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1 rounded text-sm transition-colors">Search</button>
        <button onClick={handleReset} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm transition-colors">Reset</button>
      </div>
      {/* Batch actions */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={handleAdd} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"><span className="text-lg">+</span> Add</button>
        <button onClick={() => setBatchModalOpen(true)} className="bg-teal-400 hover:bg-teal-500 text-white px-3 py-1 rounded text-sm transition-colors">Batch notification</button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="min-w-full text-sm text-gray-800">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2 px-3 text-xs font-semibold text-left">Select</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">ID</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">User Account</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Invitation Code</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">VIP Level</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Balance Status</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Credit Score</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Real Name Authentication</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Total Assets U</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Total Recharge</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Total Withdraw</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Superior Account</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Latest IP Address/Time</th>
              <th className="py-2 px-3 text-xs font-semibold text-center">Withdrawal Status</th>
              <th className="py-2 px-3 text-xs font-semibold text-center">Transaction Status</th>
              <th className="py-2 px-3 text-xs font-semibold text-center">Account Status</th>
              <th className="py-2 px-3 text-xs font-semibold text-left">Operate</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="text-center py-4">Loading...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={13} className="text-center py-4">No users found.</td></tr>
            ) : paged.map(user => (
              <tr key={user._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                <td className="py-2 px-3 text-sm text-left"><input type="checkbox" checked={selected.includes(user._id)} onChange={e => handleSelect(user._id, e.target.checked)} /></td>
                <td className="py-2 px-3 text-sm text-left">{user._id?.slice(-5)}</td>
                <td className="py-2 px-3 text-sm text-left text-blue-700 font-medium">{user.email}</td>
                <td className="py-2 px-3 text-sm text-left">{user.invitationCode}</td>
                <td className="py-2 px-3 text-sm text-left">{user.vipLevel}</td>
                <td className="py-2 px-3 text-sm text-left">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${user.balanceStatus === 'Frozen' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{user.balanceStatus}</span>
                </td>
                <td className="py-2 px-3 text-sm text-left">{user.creditScore}</td>
                <td className="py-2 px-3 text-sm text-left">{user.realNameAuth}</td>
                <td className="py-2 px-3 text-sm text-left">{user.totalAssets}</td>
                <td className="py-2 px-3 text-sm text-left">{user.totalRecharge}</td>
                <td className="py-2 px-3 text-sm text-left">{user.totalWithdrawal}</td>
                <td className="py-2 px-3 text-sm text-left">{user.superiorAccount || '-'}</td>
                <td className="py-2 px-3 text-sm text-left text-xs text-gray-700 whitespace-nowrap">
                  <div>{getIp(user)}</div>
                  <div>{getIpTime(user)}</div>
                </td>
                <td className="py-2 px-3 text-sm text-center">
                  <StatusSwitch checked={user.withdrawalStatus} onChange={v => handleStatusToggle(user._id, 'withdrawalStatus', v)} />
                </td>
                <td className="py-2 px-3 text-sm text-center">
                  <StatusSwitch checked={user.transactionStatus} onChange={v => handleStatusToggle(user._id, 'transactionStatus', v)} />
                </td>
                <td className="py-2 px-3 text-sm text-center">
                  <StatusSwitch checked={user.accountStatus} onChange={v => handleStatusToggle(user._id, 'accountStatus', v)} />
                </td>
                <td className="py-2 px-3 text-sm text-left flex gap-1 flex-wrap">
                  <button onClick={() => handleLogin(user._id)} className="bg-blue-400 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs transition-colors" title="One-click login">One-click login</button>
                  <button onClick={() => setCircularizeUser(user)} className="bg-teal-400 hover:bg-teal-500 text-white px-2 py-1 rounded text-xs transition-colors" title="Send notification">Circularize</button>
                  <button onClick={() => setBankCardUser(user)} className="bg-green-400 hover:bg-green-500 text-white px-2 py-1 rounded text-xs transition-colors" title="Manage bank cards">Bank card</button>
                  <button onClick={() => handleFreeze(user._id)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors" title="Freeze account">freeze</button>
                  <button
                    onClick={() => handleEdit(user)}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg flex items-center justify-center transition-colors"
                    style={{ width: '40px', height: '40px' }}
                    aria-label="Edit user"
                    title="Edit user"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m2 2l-6 6m2 2l-6 6" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between mt-2 text-sm">
        <div className="text-gray-600">Showing {((page-1)*PAGE_SIZE)+1} to {Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} rows</div>
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select value={PAGE_SIZE} disabled className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value={10}>10</option>
          </select>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded text-sm border border-gray-300 bg-white disabled:opacity-50 transition-colors">Previous</button>
          {[...Array(Math.min(pageCount, 5)).keys()].map(i => (
            <button key={i+1} onClick={() => setPage(i+1)} className={`px-2 py-1 rounded text-sm border border-gray-300 bg-white ${page === i+1 ? 'bg-blue-100 border-blue-400 font-bold' : ''}`}>{i+1}</button>
          ))}
          {pageCount > 5 && <span>...</span>}
          <button disabled={page === pageCount || pageCount === 0} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded text-sm border border-gray-300 bg-white disabled:opacity-50 transition-colors">Next</button>
          <input type="number" min={1} max={pageCount} value={page} onChange={e => setPage(Number(e.target.value))} className="w-12 border border-gray-300 rounded px-2 py-1 text-sm" />
          <button onClick={() => setPage(page)} className="px-2 py-1 rounded text-sm border border-gray-300 bg-white">Go</button>
        </div>
      </div>
    </div>
  );
} 