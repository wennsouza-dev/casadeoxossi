import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

const AdminFinance: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [balance, setBalance] = useState({ income: 0, expenses: 0, total: 0 });
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Form State
    const [editingExpense, setEditingExpense] = useState<any | null>(null);
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchFinanceData();
    }, [selectedMonth, selectedYear]);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Income (Payments referencing this month/year)
            const { data: incomeData, error: incomeError } = await supabase
                .from('member_payments')
                .select('amount')
                .eq('month', selectedMonth)
                .eq('year', selectedYear)
                .eq('status', 'paid');

            if (incomeError) throw incomeError;
            const income = incomeData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

            // 2. Fetch Expenses for selected month/year filter
            const startOfMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
            // Calculate last day correctly or use a safe upper bound
            // Using logic to get last day of month:
            const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
            const endOfMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;

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

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingExpense) {
                // Update
                const { error } = await supabase
                    .from('financial_expenses')
                    .update({
                        description: newExpense.description,
                        amount: parseFloat(newExpense.amount),
                        category: newExpense.category,
                        expense_date: newExpense.date
                    })
                    .eq('id', editingExpense.id);

                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase.from('financial_expenses').insert({
                    description: newExpense.description,
                    amount: parseFloat(newExpense.amount),
                    category: newExpense.category,
                    expense_date: newExpense.date
                });

                if (error) throw error;
            }

            setShowModal(false);
            setEditingExpense(null);
            setNewExpense({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
            fetchFinanceData();

        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Erro ao salvar despesa.');
        }
    };

    const handleEditClick = (expense: any) => {
        setEditingExpense(expense);
        setNewExpense({
            description: expense.description,
            amount: expense.amount.toString(),
            category: expense.category,
            date: expense.expense_date
        });
        setShowModal(true);
    };

    const handleDeleteClick = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;
        try {
            const { error } = await supabase.from('financial_expenses').delete().eq('id', id);
            if (error) throw error;
            fetchFinanceData();
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Erro ao excluir despesa.');
        }
    };

    const openNewExpenseModal = (type?: string) => {
        setEditingExpense(null);
        setNewExpense({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
        setShowModal(true);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 md:py-0 px-6 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] sticky top-0 z-10 w-full">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center justify-between md:justify-start w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-white dark:hover:bg-white/10">
                                    <span className="material-symbols-outlined">menu</span>
                                </button>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white mr-4">Financeiro</h2>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="flex-1 md:flex-none bg-gray-100 dark:bg-[#1A2C22] border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 py-3 md:py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="flex-1 md:flex-none bg-gray-100 dark:bg-[#1A2C22] border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 py-3 md:py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto flex-wrap">
                        <button
                            onClick={() => openNewExpenseModal('income')}
                            className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white px-4 py-3 md:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Entrada
                        </button>
                        <button
                            onClick={() => openNewExpenseModal('expense')}
                            className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white px-4 py-3 md:py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                            Saída
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-[#1A2C22] p-6 rounded-3xl border border-gray-100 dark:border-[#28392e] relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Entradas ({selectedMonth}/{selectedYear})</p>
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
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Saídas ({selectedMonth}/{selectedYear})</p>
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
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Saídas do Período</h3>
                            </div>
                            <table className="w-full text-left hidden md:table">
                                <thead className="bg-gray-50 dark:bg-[#111813]">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Descrição</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Categoria</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Data</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67] text-right">Valor</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67] text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-[#28392e]">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum lançamento registrado neste mês.</td>
                                        </tr>
                                    ) : (
                                        expenses.map(expense => (
                                            <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-[#20362a] transition-colors group">
                                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`material-symbols-outlined text-[16px] ${expense.type === 'income' ? 'text-green-500' : 'text-red-500'
                                                            }`}>
                                                            {expense.type === 'income' ? 'arrow_upward' : 'arrow_downward'}
                                                        </span>
                                                        {expense.description}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{expense.category || '-'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(expense.expense_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${expense.type === 'income' ? 'text-green-500' : 'text-red-500'
                                                    }`}>
                                                    {expense.type === 'income' ? '+ ' : '- '}
                                                    R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditClick(expense)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(expense.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-[#28392e]">
                                {expenses.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">Nenhum lançamento registrado neste mês.</div>
                                ) : (
                                    expenses.map(expense => (
                                        <div key={expense.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${expense.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                                                        <span className="material-symbols-outlined">
                                                            {expense.type === 'income' ? 'arrow_upward' : 'arrow_downward'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{expense.description}</p>
                                                        <p className="text-xs text-gray-500">{expense.category || 'Sem categoria'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-black text-sm ${expense.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                                        {expense.type === 'income' ? '+ ' : '- '}
                                                        R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{new Date(expense.expense_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-white/5">
                                                <button
                                                    onClick={() => handleEditClick(expense)}
                                                    className="flex-1 py-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(expense.id)}
                                                    className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Add Expense Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {editingExpense ? 'Editar Lançamento' : (newExpense.type === 'income' ? 'Nova Entrada' : 'Nova Saída')}
                            </h3>
                            <form onSubmit={handleSaveExpense} className="space-y-4">
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
