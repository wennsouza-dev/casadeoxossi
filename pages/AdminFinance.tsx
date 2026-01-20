import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

const AdminFinance: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [balance, setBalance] = useState({ income: 0, expenses: 0, total: 0 });
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // 1. Fetch Income (Sum of Member Payments for ANY month paid IN THIS MONTH? 
            // Or sum of payments referentes to this month? 
            // Usually cash flow is "paid in this month", but simpler is "payments referencing this month". 
            // Let's stick to "competence" (referencing this month) as per the common requirement "somará os valores... do mês atual")

            // Correction: "Values of monthly fees of the current month when they are paid"
            const { data: incomeData, error: incomeError } = await supabase
                .from('member_payments')
                .select('amount')
                .eq('month', currentMonth) // Referencing current month
                .eq('year', currentYear)
                .eq('status', 'paid');

            if (incomeError) throw incomeError;
            const income = incomeData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

            // 2. Fetch Expenses for current month
            // We need a date filter.
            const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            const endOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`; // Loose end date

            const { data: expensesData, error: expensesError } = await supabase
                .from('financial_expenses')
                .select('*')
                .gte('expense_date', startOfMonth)
                .lte('expense_date', endOfMonth)
                .order('expense_date', { ascending: false });

            if (expensesError) throw expensesError;
            setExpenses(expensesData || []);

            const expenseTotal = expensesData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

            setBalance({
                income,
                expenses: expenseTotal,
                total: income - expenseTotal
            });

        } catch (error) {
            console.error('Error fetching finance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('financial_expenses').insert({
                description: newExpense.description,
                amount: parseFloat(newExpense.amount),
                category: newExpense.category,
                expense_date: newExpense.date
            });

            if (error) throw error;

            setShowModal(false);
            setNewExpense({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
            fetchFinanceData(); // Refresh

        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Erro ao adicionar despesa.');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] flex items-center justify-between px-6 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Financeiro</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-500/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                        Nova Saída
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-[#1A2C22] p-6 rounded-3xl border border-gray-100 dark:border-[#28392e] relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Entradas (Mês)</p>
                                    <h3 className="text-3xl font-black text-green-500">
                                        R$ {balance.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </h3>
                                </div>
                                <div className="absolute right-[-20px] top-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="material-symbols-outlined text-[150px] text-green-500">trending_up</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1A2C22] p-6 rounded-3xl border border-gray-100 dark:border-[#28392e] relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Saídas (Mês)</p>
                                    <h3 className="text-3xl font-black text-red-500">
                                        R$ {balance.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </h3>
                                </div>
                                <div className="absolute right-[-20px] top-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="material-symbols-outlined text-[150px] text-red-500">trending_down</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1A2C22] p-6 rounded-3xl border border-gray-100 dark:border-[#28392e] relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Balanço</p>
                                    <h3 className={`text-3xl font-black ${balance.total >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                                        R$ {balance.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </h3>
                                </div>
                                <div className="absolute right-[-20px] top-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="material-symbols-outlined text-[150px]">account_balance_wallet</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Expenses List */}
                        <div className="bg-white dark:bg-[#1A2C22] rounded-3xl border border-gray-100 dark:border-[#28392e] overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-[#28392e]">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Últimas Saídas</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-[#111813]">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Descrição</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Categoria</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Data</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67] text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-[#28392e]">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500">Nenhuma despesa registrada neste mês.</td>
                                        </tr>
                                    ) : (
                                        expenses.map(expense => (
                                            <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-[#20362a] transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{expense.description}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{expense.category || '-'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(expense.expense_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                                <td className="px-6 py-4 text-right font-bold text-red-500">
                                                    - R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>

                {/* Add Expense Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nova Despesa</h3>
                            <form onSubmit={handleAddExpense} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Descrição</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#1A2C22] dark:text-white"
                                        value={newExpense.description}
                                        onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Valor (R$)</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#1A2C22] dark:text-white"
                                            value={newExpense.amount}
                                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Data</label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#1A2C22] dark:text-white"
                                            value={newExpense.date}
                                            onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Categoria</label>
                                    <select
                                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#1A2C22] dark:text-white"
                                        value={newExpense.category}
                                        onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Manutenção">Manutenção</option>
                                        <option value="Eventos">Eventos</option>
                                        <option value="Materiais">Materiais</option>
                                        <option value="Contas">Contas (Luz/Água)</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 mt-6 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminFinance;
