import React, { useState, useEffect, useRef } from 'react';

const EditUserModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    password: '',
    withdraw_password: '',
    usdt_withdraw_address: '',
    btc_withdraw_address: '',
    eth_withdraw_address: '',
    trx_withdraw_address: '',
    xrp_withdraw_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        password: '',
        withdraw_password: '',
        usdt_withdraw_address: user.usdt_withdraw_address || '',
        btc_withdraw_address: user.btc_withdraw_address || '',
        eth_withdraw_address: user.eth_withdraw_address || '',
        trx_withdraw_address: user.trx_withdraw_address || '',
        xrp_withdraw_address: user.xrp_withdraw_address || ''
      });
    }
  }, [user]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      modalRef.current.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        modalRef.current?.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReset = () => {
    setFormData({
      password: '',
      withdraw_password: '',
      usdt_withdraw_address: user?.usdt_withdraw_address || '',
      btc_withdraw_address: user?.btc_withdraw_address || '',
      eth_withdraw_address: user?.eth_withdraw_address || '',
      trx_withdraw_address: user?.trx_withdraw_address || '',
      xrp_withdraw_address: user?.xrp_withdraw_address || ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Build payload with only non-empty fields
      const payload = {};
      
      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }
      
      if (formData.withdraw_password.trim()) {
        payload.withdraw_password = formData.withdraw_password.trim();
      }

      const wallets = {};
      if (formData.usdt_withdraw_address.trim()) wallets.usdt = formData.usdt_withdraw_address.trim();
      if (formData.btc_withdraw_address.trim()) wallets.btc = formData.btc_withdraw_address.trim();
      if (formData.eth_withdraw_address.trim()) wallets.eth = formData.eth_withdraw_address.trim();
      if (formData.trx_withdraw_address.trim()) wallets.trx = formData.trx_withdraw_address.trim();
      if (formData.xrp_withdraw_address.trim()) wallets.xrp = formData.xrp_withdraw_address.trim();

      if (Object.keys(wallets).length > 0) {
        payload.wallets = wallets;
      }

      const response = await onSave(user.id, payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* User Account (Readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User account:
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password:
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Do not fill or modify"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Withdrawal Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Withdrawal password:
            </label>
            <input
              type="password"
              value={formData.withdraw_password}
              onChange={(e) => handleInputChange('withdraw_password', e.target.value)}
              placeholder="Do not fill or modify"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* USDT Withdrawal Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              USDT Withdrawal address:
            </label>
            <input
              type="text"
              value={formData.usdt_withdraw_address}
              onChange={(e) => handleInputChange('usdt_withdraw_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* BTC Withdrawal Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BTC Withdrawal address:
            </label>
            <input
              type="text"
              value={formData.btc_withdraw_address}
              onChange={(e) => handleInputChange('btc_withdraw_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* ETH Withdrawal Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ETH Withdrawal address:
            </label>
            <input
              type="text"
              value={formData.eth_withdraw_address}
              onChange={(e) => handleInputChange('eth_withdraw_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* TRX Withdrawal Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TRX Withdrawal address:
            </label>
            <input
              type="text"
              value={formData.trx_withdraw_address}
              onChange={(e) => handleInputChange('trx_withdraw_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* XRP Withdrawal Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              XRP Withdrawal address:
            </label>
            <input
              type="text"
              value={formData.xrp_withdraw_address}
              onChange={(e) => handleInputChange('xrp_withdraw_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
