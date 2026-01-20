import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { Member } from '../types';

interface MemberWithPayment extends Member {
    paymentStatus?: 'paid' | 'pending' | 'late';
    paymentId?: string;
    monthlyFeeValue?: number;
}

const AdminPros: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [members, setMembers] = useState<MemberWithPayment[]>([]);
    const [loading, setLoading] = useState(true);
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
                    monthlyFeeValue: member.monthly_fee || 0,
                    paymentStatus: payment ? payment.status : 'pending',
                    paymentId: payment ? payment.id : undefined,
                    paymentAmount: payment ? payment.amount : 0,
                    status: member.status // Adding missing status mapped from member
                };
            });

            setMembers(mergedData as MemberWithPayment[]);

            // Calculate stats
            const paidCount = mergedData.filter(m => m.paymentStatus === 'paid').length;
            const totalCount = mergedData.length;
            setStats({
                paid: paidCount,
                pending: totalCount - paidCount,
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
            const { error } = await supabase
                .from('members')
                .update({ monthly_fee: newFee })
                .eq('id', memberId);

            if (error) throw error;

            // Update local state
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, monthlyFeeValue: newFee } : m));
        } catch (error) {
            console.error('Error updating fee:', error);
            alert('Erro ao atualizar valor da mensalidade.');
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
                // Create payment
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
            fetchData(); // Refresh to get new ID/Status
        } catch (error) {
            console.error('Error toggling payment:', error);
            alert('Erro ao registrar pagamento.');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] flex items-center justify-between px-6 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gestão de Mensalidades</h2>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Month Selector & Stats */}
                        <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white dark:bg-[#1A2C22] p-6 rounded-3xl border border-gray-100 dark:border-[#28392e]">
                            <div className="flex items-center gap-4">
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

                            <div className="flex gap-6">
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
                            <table className="w-full text-left">
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
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">R$</span>
                                                    <input
                                                        type="number"
                                                        className="w-24 bg-transparent border-b border-gray-300 focus:border-primary outline-none py-1 text-sm font-bold text-gray-900 dark:text-white"
                                                        value={member.monthlyFeeValue}
                                                        onChange={(e) => handleUpdateFee(member.id, parseFloat(e.target.value))}
                                                        onBlur={(e) => handleUpdateFee(member.id, parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${member.paymentStatus === 'paid'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                    }`}>
                                                    {member.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleTogglePayment(member)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${member.paymentStatus === 'paid'
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        }`}
                                                >
                                                    {member.paymentStatus === 'paid' ? 'Desmarcar' : 'Marcar Pago'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPros;
