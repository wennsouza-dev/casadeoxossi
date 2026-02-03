import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';
import { Member } from '../types';

interface MemberWithPayment extends Member {
    paymentStatus?: 'paid' | 'pending' | 'late';
    paymentId?: string;
    monthlyFeeValue?: number;
    monthlyFeeStatus?: string; // Added
}

const AdminPros: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [members, setMembers] = useState<MemberWithPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [stats, setStats] = useState({ paid: 0, pending: 0, total: 0 });

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all members
            const { data: membersData, error: membersError } = await supabase
                .from('members')
                .select('*')
                .eq('active', true) // Only active members
                .order('full_name');

            if (membersError) throw membersError;

            // 2. Fetch payments for selected month/year
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('member_payments')
                .select('*')
                .eq('month', selectedDate.getMonth() + 1)
                .eq('year', selectedDate.getFullYear());

            if (paymentsError) throw paymentsError;

            // 3. Merge data
            const mergedData = membersData.map((member: any) => {
                const payment = paymentsData?.find(p => p.member_id === member.id);
                return {
                    id: member.id,
                    name: member.full_name,
                    orixa: member.religious_name || '-',
                    role: member.role,
                    active: member.active,
                    monthlyFeeValue: payment ? payment.amount : (member.monthly_fee || 0), // Prioritize existing payment amount
                    monthlyFeeStatus: member.monthly_fee_status, // Map status
                    paymentStatus: payment ? payment.status : 'pending',
                    paymentId: payment ? payment.id : undefined,
                    paymentAmount: payment ? payment.amount : 0,
                    status: member.status
                };
            });

            setMembers(mergedData as MemberWithPayment[]);

            // Calculate stats
            // Filter out exempt members from pending count
            const paidCount = mergedData.filter(m => m.paymentStatus === 'paid').length;
            const exemptCount = mergedData.filter(m => m.monthlyFeeStatus === 'exempt').length;
            const totalCount = mergedData.length; // Or active members? User wants to see who is paying.

            // Pending should be Total - Paid - Exempt
            const pendingCount = Math.max(0, totalCount - paidCount - exemptCount);

            setStats({
                paid: paidCount,
                pending: pendingCount,
                total: totalCount
            });

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
    };

    const handleUpdateFee = async (memberId: string, newFee: number) => {
        try {
            // 1. Update default fee in members table
            const { error } = await supabase
                .from('members')
                .update({ monthly_fee: newFee })
                .eq('id', memberId);

            if (error) throw error;

            // 2. Update ANY existing payment for this member/month/year to the new fee
            // This ensures balance is updated regardless of payment status (paid/pending)
            const { error: updatePaymentError } = await supabase
                .from('member_payments')
                .update({ amount: newFee })
                .eq('member_id', memberId)
                .eq('month', selectedDate.getMonth() + 1)
                .eq('year', selectedDate.getFullYear());

            if (updatePaymentError) throw updatePaymentError;

            // Update local state
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, monthlyFeeValue: newFee } : m));

        } catch (error) {
            console.error('Error updating fee:', error);
            alert('Erro ao atualizar valor da mensalidade.');
        }
    };

    const handleToggleExempt = async (member: MemberWithPayment) => {
        const newStatus = member.monthlyFeeStatus === 'exempt' ? 'active' : 'exempt';

        // Optimistic Update
        const previousStatus = member.monthlyFeeStatus;
        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, monthlyFeeStatus: newStatus } : m));

        try {
            // 1. Update member status
            const { error } = await supabase
                .from('members')
                .update({ monthly_fee_status: newStatus })
                .eq('id', member.id);

            if (error) throw error;

            // 2. If becoming Exempt, delete ALL existing payments for THIS month/year (Handling duplicates too)
            if (newStatus === 'exempt') {
                const { error: deleteError } = await supabase
                    .from('member_payments')
                    .delete()
                    .eq('member_id', member.id)
                    .eq('month', selectedDate.getMonth() + 1)
                    .eq('year', selectedDate.getFullYear());

                if (deleteError) throw deleteError;
            }

            fetchData(); // Refresh stats properly
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, monthlyFeeStatus: previousStatus } : m));
            alert('Erro ao atualizar status de isenção.');
        }
    };

    const handleTogglePayment = async (member: MemberWithPayment) => {
        try {
            if (member.paymentStatus === 'paid') {
                // Delete payment (mark as pending)
                if (!member.paymentId) return;
                const { error } = await supabase.from('member_payments').delete().eq('id', member.paymentId);
                if (error) throw error;
            } else {
                // Check if there is an existing payment ID (e.g. status is pending_approval or late)
                if (member.paymentId) {
                    // Update existing record
                    const { error } = await supabase.from('member_payments')
                        .update({
                            status: 'paid',
                            amount: member.monthlyFeeValue || 0,
                            payment_dates: new Date().toISOString()
                        })
                        .eq('id', member.paymentId);

                    if (error) throw error;
                } else {
                    // Create new payment
                    const { error } = await supabase.from('member_payments').insert({
                        member_id: member.id,
                        month: selectedDate.getMonth() + 1,
                        year: selectedDate.getFullYear(),
                        amount: member.monthlyFeeValue || 0,
                        status: 'paid',
                        payment_dates: new Date().toISOString()
                    });
                    if (error) throw error;
                }
            }
            fetchData(); // Refresh to get new ID/Status
        } catch (error) {
            console.error('Error toggling payment:', error);
            alert('Erro ao registrar pagamento.');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] flex items-center px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-white dark:hover:bg-white/10 shrink-0">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">Gestão de Mensalidades</h2>
                        <div className="ml-2"><NotificationBell userRole="admin" /></div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Month Selector & Stats */}
                        <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white dark:bg-[#1A2C22] p-6 rounded-3xl border border-gray-100 dark:border-[#28392e]">
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                                <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white capitalize">
                                        {monthNames[selectedDate.getMonth()]}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-[#9db9a6]">{selectedDate.getFullYear()}</p>
                                </div>
                                <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>

                            <div className="flex gap-6 w-full md:w-auto justify-center">
                                <div className="text-center">
                                    <p className="text-xs font-bold uppercase text-gray-400">Pagos</p>
                                    <p className="text-2xl font-black text-green-500">{stats.paid}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold uppercase text-gray-400">Pendentes</p>
                                    <p className="text-2xl font-black text-amber-500">{stats.pending}</p>
                                </div>
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="bg-white dark:bg-[#1A2C22] rounded-3xl border border-gray-100 dark:border-[#28392e] overflow-hidden">
                            {/* Desktop Table */}
                            <table className="w-full text-left hidden md:table">
                                <thead className="bg-gray-50 dark:bg-[#111813]">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Filho</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Valor Mensal</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67] text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-[#28392e]">
                                    {members.map(member => (
                                        <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-[#20362a] transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{member.name}</p>
                                                    <span className="text-xs text-gray-500">{member.orixa}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm ${member.monthlyFeeStatus === 'exempt' ? 'text-gray-300 line-through' : 'text-gray-500'}`}>R$</span>
                                                        <input
                                                            type="number"
                                                            disabled={member.monthlyFeeStatus === 'exempt'}
                                                            className={`w-24 bg-transparent border-b outline-none py-1 text-sm font-bold ${member.monthlyFeeStatus === 'exempt' ? 'border-gray-200 text-gray-300' : 'border-gray-300 focus:border-primary text-gray-900 dark:text-white'}`}
                                                            value={member.monthlyFeeValue}
                                                            onChange={(e) => handleUpdateFee(member.id, parseFloat(e.target.value))}
                                                            onBlur={(e) => handleUpdateFee(member.id, parseFloat(e.target.value))}
                                                        />
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={member.monthlyFeeStatus === 'exempt'}
                                                            onChange={() => handleToggleExempt(member)}
                                                            className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                                        />
                                                        <span className="text-[10px] font-bold uppercase text-gray-400">Isento</span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {member.monthlyFeeStatus === 'exempt' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
                                                        ISENTO
                                                    </span>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${member.paymentStatus === 'paid'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        }`}>
                                                        {member.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {member.monthlyFeeStatus !== 'exempt' && (
                                                    <button
                                                        onClick={() => handleTogglePayment(member)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${member.paymentStatus === 'paid'
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                            }`}
                                                    >
                                                        {member.paymentStatus === 'paid' ? 'Desmarcar' : 'Marcar Pago'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile List (Cards) */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-[#28392e]">
                                {members.map(member => (
                                    <div key={member.id} className="p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-lg">{member.name}</p>
                                                <p className="text-sm text-gray-500 capitalize">{member.orixa}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${member.monthlyFeeStatus === 'exempt'
                                                ? 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                                                : member.paymentStatus === 'paid'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {member.monthlyFeeStatus === 'exempt' ? 'ISENTO' : (member.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE')}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-xs font-bold uppercase text-gray-400">Mensalidade:</span>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        <span className={`text-sm ${member.monthlyFeeStatus === 'exempt' ? 'text-gray-300 line-through' : 'text-gray-500'}`}>R$</span>
                                                        <input
                                                            type="number"
                                                            disabled={member.monthlyFeeStatus === 'exempt'}
                                                            className={`w-20 bg-transparent border-b outline-none py-1 text-sm font-bold ${member.monthlyFeeStatus === 'exempt' ? 'border-gray-200 text-gray-300' : 'border-gray-300 focus:border-primary text-gray-900 dark:text-white'}`}
                                                            value={member.monthlyFeeValue}
                                                            onChange={(e) => handleUpdateFee(member.id, parseFloat(e.target.value))}
                                                            onBlur={(e) => handleUpdateFee(member.id, parseFloat(e.target.value))}
                                                        />
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={member.monthlyFeeStatus === 'exempt'}
                                                            onChange={() => handleToggleExempt(member)}
                                                            className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                                                        />
                                                        <span className="text-[10px] font-bold uppercase text-gray-400">Isento</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {member.monthlyFeeStatus !== 'exempt' && (
                                            <button
                                                onClick={() => handleTogglePayment(member)}
                                                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${member.paymentStatus === 'paid'
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20'
                                                    : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20'
                                                    }`}
                                            >
                                                {member.paymentStatus === 'paid' ? 'Desmarcar Pagamento' : 'Marcar como Pago'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPros;
