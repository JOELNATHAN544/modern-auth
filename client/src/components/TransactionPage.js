import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Lock, Euro, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const TransactionPage = ({ user }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [stepUpModal, setStepUpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Fetch transaction history on component mount
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await axios.get(`/api/transactions?userId=${user.id}`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Don't show error toast for this, just log it
    }
  }, [user.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/transactions', {
        amount: parseFloat(formData.amount),
        description: formData.description,
        userId: user.id
      });

      if (response.data.requiresStepUp) {
        // Preserve amount/description for display in modal
        setCurrentTransaction({ ...response.data, amount: parseFloat(formData.amount), description: formData.description });
        setStepUpModal(true);
        toast.success('Step-up authentication required for this transaction');
      } else {
        setTransactions(prev => [response.data.transaction, ...prev]);
        setFormData({ amount: '', description: '' });
        toast.success('Transaction completed successfully!');
        // Refresh transaction list
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStepUpVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/transactions/stepup', {
        otp,
        transactionId: currentTransaction.transactionId
      });

      if (response.data.success) {
        setTransactions(prev => [response.data.transaction, ...prev]);
        setStepUpModal(false);
        setOtp('');
        setCurrentTransaction(null);
        setFormData({ amount: '', description: '' });
        toast.success('Step-up authentication successful!');
        // Refresh transaction list
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Step-up verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionStatus = (transaction) => {
    const amt = Number(transaction.amount);
    if (amt > 150) {
      return { status: 'High Value', color: 'warning', icon: <AlertTriangle size={16} /> };
    }
    return { status: 'Standard', color: 'success', icon: <CheckCircle size={16} /> };
  };

  return (
    <div>
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard size={24} color="#007bff" />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600' }}>Transaction Center</h1>
            <p className="text-muted">Test step-up authentication for high-value transactions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Transaction Form */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Create New Transaction
          </h3>

          <form onSubmit={handleTransaction}>
            <div className="form-group">
              <label className="form-label">Amount (€)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
                <Euro 
                  size={16} 
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#888'
                  }}
                />
              </div>
              {formData.amount > 150 && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px 12px', 
                  background: '#fff3cd', 
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  color: '#856404',
                  fontSize: '14px'
                }}>
                  <AlertTriangle size={14} style={{ marginRight: '6px' }} />
                  Transactions over €150 require step-up authentication
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input"
                placeholder="What is this transaction for?"
                required
              />
            </div>

            <button
              type="submit"
              className="btn"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading"></div>
                  Processing Transaction...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Process Transaction
                </>
              )}
            </button>
          </form>

          {/* Transaction Guidelines */}
          <div className="card" style={{ marginTop: '16px', background: '#2a2a2a' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#ffc107' }}>
              Transaction Guidelines
            </h4>
            <div className="space-y-2" style={{ fontSize: '14px', color: '#ccc' }}>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} color="#28a745" />
                <span>≤ €150: Standard authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} color="#ffc107" />
                <span>> €150: Step-up authentication required</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={14} color="#007bff" />
                <span>PSD3 compliant for banking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Recent Transactions
          </h3>

          {transactions.length === 0 ? (
            <div className="text-center" style={{ color: '#888', padding: '32px 16px' }}>
              <CreditCard size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No transactions yet</p>
              <p style={{ fontSize: '14px' }}>Create your first transaction above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const status = getTransactionStatus(transaction);
                const amt = Number(transaction.amount) || 0;
                const createdAt = transaction.created_at || transaction.timestamp;
                return (
                  <div 
                    key={transaction.id} 
                    className="card" 
                    style={{ 
                      background: '#2a2a2a', 
                      padding: '16px',
                      border: '1px solid #444'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontWeight: '600' }}>€{amt.toFixed(2)}</span>
                      <span className={`badge badge-${status.color}`}>
                        {status.icon}
                        {status.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '8px' }}>
                      {transaction.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        {createdAt ? new Date(createdAt).toLocaleString() : ''}
                      </span>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        ID: {transaction.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Step-up Authentication Modal */}
      {stepUpModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Step-up Authentication Required</h3>
              <button 
                className="modal-close"
                onClick={() => setStepUpModal(false)}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div className="card" style={{ background: '#2a2a2a', marginBottom: '16px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} color="#ffc107" />
                  <span style={{ fontWeight: '600' }}>High-Value Transaction</span>
                </div>
                <p style={{ fontSize: '14px', color: '#ccc' }}>
                  Amount: <strong>€{Number(currentTransaction?.amount || 0).toFixed(2)}</strong><br />
                  Description: {currentTransaction?.description}
                </p>
              </div>

              <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '16px' }}>
                This transaction requires additional verification due to PSD3 regulations. 
                Please enter the OTP sent to your registered device.
              </p>

              <form onSubmit={handleStepUpVerification}>
                <div className="form-group">
                  <label className="form-label">One-Time Password (OTP)</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="form-input"
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                    required
                  />
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Check your browser console (F12) or terminal for the demo OTP
                  </p>
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    background: '#fff3cd', 
                    border: '1px solid #ffeaa7',
                    borderRadius: '4px',
                    color: '#856404',
                    fontSize: '12px'
                  }}>
                    💡 <strong>Tip:</strong> Press F12 → Console tab to see the OTP
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStepUpModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="loading"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Verify OTP
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;
