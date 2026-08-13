'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function CEOFinancesPage() {
    const [token, setToken] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
    const [studentFees, setStudentFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Modal state for Transactions
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState('income');
    const [formData, setFormData] = useState({ amount: '', category: '', description: '', student_id: '' });

    // Modal state for Student Fee Update
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [feeFormData, setFeeFormData] = useState({ student_id: '', total_fee: '' });

    // Tab state
    const [activeTab, setActiveTab] = useState('overview'); // overview, students

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchFinances(storedToken);
        } else {
            setError('Not authenticated');
            setLoading(false);
        }
    }, []);

    const fetchFinances = async (authToken) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/finance`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setTransactions(res.data.transactions);
            setSummary(res.data.summary);
            setStudentFees(res.data.student_fees || []);
        } catch (err) {
            console.error('Error fetching finances:', err);
            setError('Failed to fetch finances');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type) => {
        setTransactionType(type);
        setFormData({ amount: '', category: '', description: '', student_id: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleOpenFeeModal = (studentId, currentFee) => {
        setFeeFormData({ student_id: studentId, total_fee: currentFee || '' });
        setIsFeeModalOpen(true);
    };

    const handleCloseFeeModal = () => {
        setIsFeeModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                type: transactionType
            };
            // Only send student_id if it's set
            if (!payload.student_id) {
                delete payload.student_id;
            }

            await axios.post(`${API_BASE_URL}/api/finance`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            handleCloseModal();
            fetchFinances(); // Refresh data
        } catch (err) {
            console.error('Error adding transaction:', err);
            alert('Failed to add transaction');
        }
    };

    const handleFeeSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_BASE_URL}/api/finance/student/${feeFormData.student_id}/fee`, {
                total_fee: parseFloat(feeFormData.total_fee)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            handleCloseFeeModal();
            fetchFinances();
        } catch (err) {
            console.error('Error updating fee:', err);
            alert('Failed to update student fee');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/finance/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFinances();
        } catch (err) {
            console.error('Error deleting transaction:', err);
            alert('Failed to delete transaction');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Chart Calculations
    const maxBarValue = Math.max(summary.total_income, summary.total_expense, 1); // avoid div by 0
    const incomePercent = (summary.total_income / maxBarValue) * 100;
    const expensePercent = (summary.total_expense / maxBarValue) * 100;

    return (
        <div className="max-w-7xl mx-auto space-y-lg animate-fade-in pb-xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-md">
                <div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Academy Finances</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        Track and manage all income, expenses, and student fees.
                    </p>
                </div>
                <div className="flex gap-sm">
                    <button 
                        onClick={() => handleOpenModal('expense')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium border-2 border-error text-error hover:bg-error/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">remove</span>
                        Add Expense
                    </button>
                    <button 
                        onClick={() => handleOpenModal('income')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-md"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Income
                    </button>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex gap-md border-b border-outline-variant mb-lg">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`pb-sm font-label-lg px-2 transition-colors border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                >
                    Overview & Chart
                </button>
                <button 
                    onClick={() => setActiveTab('students')}
                    className={`pb-sm font-label-lg px-2 transition-colors border-b-2 ${activeTab === 'students' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                >
                    Student Fees
                </button>
            </div>

            {error && (
                <div className="bg-error-container text-on-error-container p-md rounded-xl font-body-md mb-md">
                    {error}
                </div>
            )}

            {activeTab === 'overview' && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                        <div className="bg-surface-container rounded-3xl p-lg border border-outline-variant hover:border-outline transition-colors relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <div className="flex items-center gap-md mb-md relative">
                                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">account_balance_wallet</span>
                                </div>
                                <h3 className="font-title-md text-title-md text-on-surface">Total Balance</h3>
                            </div>
                            <p className={`font-display-sm text-display-sm relative ${summary.balance >= 0 ? 'text-primary' : 'text-error'}`}>
                                ${summary.balance.toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-surface-container rounded-3xl p-lg border border-outline-variant hover:border-outline transition-colors relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <div className="flex items-center gap-md mb-md relative">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">trending_up</span>
                                </div>
                                <h3 className="font-title-md text-title-md text-on-surface">Total Income</h3>
                            </div>
                            <p className="font-display-sm text-display-sm text-emerald-500 relative">
                                ${summary.total_income.toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-surface-container rounded-3xl p-lg border border-outline-variant hover:border-outline transition-colors relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <div className="flex items-center gap-md mb-md relative">
                                <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined">trending_down</span>
                                </div>
                                <h3 className="font-title-md text-title-md text-on-surface">Total Expenses</h3>
                            </div>
                            <p className="font-display-sm text-display-sm text-error relative">
                                ${summary.total_expense.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Visual Charts (CSS Based) */}
                    <div className="bg-surface-container rounded-3xl p-lg border border-outline-variant">
                        <h2 className="font-title-lg text-title-lg text-on-surface mb-md">Income vs Expense Chart</h2>
                        <div className="flex items-end gap-md h-64 border-l border-b border-outline-variant p-4">
                            {/* Income Bar */}
                            <div className="flex-1 flex flex-col items-center justify-end h-full group">
                                <div 
                                    className="w-1/2 bg-emerald-500 rounded-t-lg transition-all duration-700 ease-out group-hover:brightness-110"
                                    style={{ height: `${incomePercent}%`, minHeight: '4px' }}
                                ></div>
                                <div className="mt-2 font-label-md text-on-surface">Income</div>
                                <div className="font-body-sm text-on-surface-variant">${summary.total_income.toFixed(2)}</div>
                            </div>
                            
                            {/* Expense Bar */}
                            <div className="flex-1 flex flex-col items-center justify-end h-full group">
                                <div 
                                    className="w-1/2 bg-error rounded-t-lg transition-all duration-700 ease-out group-hover:brightness-110"
                                    style={{ height: `${expensePercent}%`, minHeight: '4px' }}
                                ></div>
                                <div className="mt-2 font-label-md text-on-surface">Expense</div>
                                <div className="font-body-sm text-on-surface-variant">${summary.total_expense.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-surface-container rounded-3xl border border-outline-variant overflow-hidden">
                        <div className="p-lg border-b border-outline-variant">
                            <h2 className="font-title-lg text-title-lg text-on-surface">Recent Transactions</h2>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface-container-high font-label-md text-label-md text-on-surface-variant">
                                    <tr>
                                        <th className="px-lg py-md font-medium">Date</th>
                                        <th className="px-lg py-md font-medium">Type</th>
                                        <th className="px-lg py-md font-medium">Category</th>
                                        <th className="px-lg py-md font-medium">Description</th>
                                        <th className="px-lg py-md font-medium">Student</th>
                                        <th className="px-lg py-md font-medium text-right">Amount</th>
                                        <th className="px-lg py-md font-medium text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-lg py-xl text-center text-on-surface-variant font-body-md">
                                                No transactions recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((t) => {
                                            const relatedStudent = t.student_id ? studentFees.find(s => s.id === t.student_id) : null;
                                            return (
                                                <tr key={t._id} className="hover:bg-surface-container-high transition-colors">
                                                    <td className="px-lg py-md font-body-md text-on-surface whitespace-nowrap">
                                                        {new Date(t.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-lg py-md">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            t.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                                                        }`}>
                                                            {t.type === 'income' ? 'Income' : 'Expense'}
                                                        </span>
                                                    </td>
                                                    <td className="px-lg py-md font-body-md text-on-surface">{t.category}</td>
                                                    <td className="px-lg py-md font-body-md text-on-surface-variant max-w-[150px] truncate" title={t.description}>
                                                        {t.description || '-'}
                                                    </td>
                                                    <td className="px-lg py-md font-body-sm text-on-surface-variant">
                                                        {relatedStudent ? relatedStudent.name : '-'}
                                                    </td>
                                                    <td className={`px-lg py-md font-body-md font-medium text-right whitespace-nowrap ${
                                                        t.type === 'income' ? 'text-primary' : 'text-error'
                                                    }`}>
                                                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-lg py-md text-center">
                                                        <button 
                                                            onClick={() => handleDelete(t._id)}
                                                            className="flex items-center justify-center w-10 h-10 material-symbols-outlined text-error hover:bg-error/10 rounded-full transition-colors mx-auto"
                                                            title="Delete"
                                                        >
                                                            delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'students' && (
                <div className="space-y-md">
                    <h2 className="font-title-lg text-title-lg text-on-surface mb-md">Student Fee Tracking</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                        {studentFees.map(student => {
                            const total = student.total_fee || 0;
                            const paid = student.paid_amount || 0;
                            const pending = student.pending_amount || 0;
                            const percent = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
                            
                            return (
                                <div key={student.id} className="bg-surface-container rounded-3xl p-lg border border-outline-variant flex flex-col gap-sm">
                                    <div className="flex justify-between items-start mb-sm">
                                        <div>
                                            <h3 className="font-title-md text-on-surface truncate" title={student.name}>{student.name}</h3>
                                            <p className="font-body-sm text-on-surface-variant truncate" title={student.email}>{student.email}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleOpenFeeModal(student.id, total)}
                                            className="flex items-center justify-center w-10 h-10 material-symbols-outlined text-primary hover:bg-primary/10 rounded-full transition-colors"
                                            title="Set Total Fee"
                                        >
                                            edit
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between font-label-md text-on-surface">
                                        <span>Paid: ${paid.toFixed(2)}</span>
                                        <span>Total: ${total.toFixed(2)}</span>
                                    </div>
                                    
                                    {/* Progress Bar Chart */}
                                    <div className="w-full bg-surface-container-high h-4 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-primary h-full rounded-full transition-all duration-700"
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                    
                                    <div className="text-right font-label-sm mt-1">
                                        {pending > 0 ? (
                                            <span className="text-error">Pending: ${pending.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-emerald-500">Fully Paid</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 w-screen h-screen">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}></div>
                    <div className="bg-surface-container rounded-3xl w-[90vw] max-w-[500px] p-6 relative z-10 animate-fade-in shadow-elevation-3 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-lg">
                            <h2 className="font-headline-sm text-headline-sm text-on-surface">
                                Add {transactionType === 'income' ? 'Income' : 'Expense'}
                            </h2>
                            <button onClick={handleCloseModal} className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors">
                                close
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-md">
                            <div>
                                <label className="block font-label-md text-label-md text-on-surface mb-xs">Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    className="w-full bg-surface px-md py-sm rounded-xl border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                            
                            <div>
                                <label className="block font-label-md text-label-md text-on-surface mb-xs">Category</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full bg-surface px-md py-sm rounded-xl border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder={transactionType === 'income' ? "e.g., Tuition, Donation" : "e.g., Utilities, Salary"}
                                />
                            </div>

                            {/* Link to Student (Only for Income usually, but keeping it flexible) */}
                            {transactionType === 'income' && (
                                <div>
                                    <label className="block font-label-md text-label-md text-on-surface mb-xs">Related Student (Optional)</label>
                                    <select
                                        value={formData.student_id}
                                        onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                                        className="w-full bg-surface px-md py-sm rounded-xl border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    >
                                        <option value="">-- No Student --</option>
                                        {studentFees.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-on-surface-variant mt-1">If this is a fee payment, select the student to update their fee balance.</p>
                                </div>
                            )}
                            
                            <div>
                                <label className="block font-label-md text-label-md text-on-surface mb-xs">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full bg-surface px-md py-sm rounded-xl border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all custom-scrollbar resize-none h-24"
                                    placeholder="Add any extra details..."
                                ></textarea>
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 rounded-xl font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors ${transactionType === 'income' ? 'bg-primary text-on-primary hover:bg-primary/90' : 'bg-error text-on-error hover:bg-error/90'}`}
                                >
                                    Save {transactionType === 'income' ? 'Income' : 'Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Set Total Fee Modal */}
            {isFeeModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 w-screen h-screen">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseFeeModal}></div>
                    <div className="bg-surface-container rounded-3xl w-[90vw] max-w-[400px] p-6 relative z-10 animate-fade-in shadow-elevation-3 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-lg">
                            <h2 className="font-headline-sm text-headline-sm text-on-surface">Set Total Fee</h2>
                            <button onClick={handleCloseFeeModal} className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors">
                                close
                            </button>
                        </div>
                        
                        <form onSubmit={handleFeeSubmit} className="space-y-md">
                            <div>
                                <label className="block font-label-md text-label-md text-on-surface mb-xs">Total Expected Fee ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={feeFormData.total_fee}
                                    onChange={(e) => setFeeFormData({...feeFormData, total_fee: e.target.value})}
                                    className="w-full bg-surface px-md py-sm rounded-xl border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs text-on-surface-variant mt-1">This sets the total course fee expected from the student.</p>
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseFeeModal}
                                    className="px-5 py-2.5 rounded-xl font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    Save Fee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
