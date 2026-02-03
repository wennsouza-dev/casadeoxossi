import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';

interface Payment {
    id: string;
    member_id: string;
    month: number;
    year: number;
    amount: number;
    status: string;
    proof_url: string;
    created_at: string;
    member?: {
        full_name: string;
        avatar_url: string | null;
    };
}

interface MemberStatus {
    id: string;
    full_name: string;
    avatar_url: string | null;
    status: 'up_to_date' | 'defaulting' | 'exempt';
    pending_months: number;
    total_due: number;
    last_payment?: string;
}

const AdminPayments: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Pending Payments (Global or specific? Keeping global for attention, or maybe specific? 
            // Usually pending payments are relevant regardless of month, but let's filter relevant to this view? 
            // Actually user asked generally about "Em Dia" list. 
            // Let's filter pending by the selected month/year too to align with "Gestão de Mensalidades" for that period.
            const { data: pendingData, error: pendingError } = await supabase
                .from('member_payments')
                .select(`
          *,
          member:members (full_name, avatar_url)
        `)
                .eq('status', 'pending_approval')
                .order('created_at', { ascending: false });

            if (pendingError) throw pendingError;

            // 2. Fetch All Active Members
            const { data: membersData, error: membersError } = await supabase
                .from('members')
                .select('id, full_name, avatar_url, active, monthly_fee_status') // Added monthly_fee_status if needed later, but relying on active
                .eq('active', true);

            if (membersError) throw membersError;

            // 3. Fetch Paid Payments for SELECTED Month/Year
            const { data: paidData, error: paidError } = await supabase
                .from('member_payments')
                .select('*')
                .eq('status', 'paid')
                .eq('month', selectedMonth)
                .eq('year', selectedYear);

            if (paidError) throw paidError;

            // --- Status Calculation Logic for SELECTED Period ---
            const MONTHLY_FEE = 50.00;

            const statuses: MemberStatus[] = membersData.map(member => {
                // Check if this specific month is paid
                const isPaid = paidData?.some(p => p.member_id === member.id);
                // Check exemption
                const isExempt = member.monthly_fee_status === 'exempt';

                let status: 'up_to_date' | 'defaulting' | 'exempt' = 'defaulting';
                if (isExempt) status = 'exempt';
                else if (isPaid) status = 'up_to_date';

                return {
                    id: member.id,
                    full_name: member.full_name,
                    avatar_url: member.avatar_url,
                    status: status,
                    pending_months: (isPaid || isExempt) ? 0 : 1,
                    total_due: (isPaid || isExempt) ? 0 : MONTHLY_FEE,
                    last_payment: isPaid ? `${selectedMonth}/${selectedYear}` : (isExempt ? 'Isento' : 'Pendente')
                };
            });

            // Filter pending display list to only show relevant month/year? 
            // Or keep all pending? Usually "Pending Approval" implies action needed NOW regardless of date.
            // But if I want to see "January Pending", I should filter.
            // Let's keep ALL pending for the "Pending" section because they need approval.
            // BUT the "Em Dia/Em Atraso" lists are strictly filtered by selected month.

            setPayments(pendingData as any || []);
            setMemberStatuses(statuses);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const handleApprove = async (paymentId: string) => {
        setProcessingId(paymentId);
        try {
            const { error } = await supabase
                .from('member_payments')
                .update({ status: 'paid' })
                .eq('id', paymentId);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Error approving:', error);
            alert('Erro ao aprovar.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (paymentId: string) => {
        if (!confirm('Deseja realmente rejeitar este pagamento?')) return;
        setProcessingId(paymentId);
        try {
            const { error } = await supabase
                .from('member_payments')
                .update({ status: 'rejected' })
                .eq('id', paymentId);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error rejecting:', error);
            alert('Erro ao rejeitar.');
        } finally {
            setProcessingId(null);
        }
    };

    const pendingApprovals = payments;
    const defaultingMembers = memberStatuses.filter(m => m.status === 'defaulting');
    const upToDateMembers = memberStatuses.filter(m => m.status === 'up_to_date');
    const exemptMembers = memberStatuses.filter(m => m.status === 'exempt');

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 ml-0 md:ml-72 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestão de Mensalidades</h2>
                                <div className="mt-1"><NotificationBell userRole="admin" /></div>
                            </div>
                            <p className="text-gray-500 dark:text-[#9db9a6] mt-1">Confira pagamentos e acompanhe a inadimplência.</p>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="flex-1 md:flex-none bg-gray-100 dark:bg-[#1A2C22] border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 py-3 md:py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary outline-none"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="flex-1 md:flex-none bg-gray-100 dark:bg-[#1A2C22] border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 py-3 md:py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary outline-none"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <button title="Menu" onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-500 rounded-lg bg-gray-100 dark:bg-white/5 absolute top-6 right-6 md:static">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </header>

                    {/* Pending Approvals Section */}
                    <section className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl p-6 border border-amber-100 dark:border-amber-900/20">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-amber-600 text-2xl">pending_actions</span>
                            <h3 className="text-xl font-bold text-amber-900 dark:text-amber-500">Pendentes de Aprovação ({pendingApprovals.length})</h3>
                        </div>

                        {pendingApprovals.length === 0 ? (
                            <div className="text-center py-8 text-amber-800/50 dark:text-amber-500/50 font-medium">
                                Nenhum comprovante pendente de análise.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingApprovals.map(payment => (
                                    <div key={payment.id} className="bg-white dark:bg-[#1A2C22] p-4 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/20 flex flex-col">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url('${(payment as any).member?.avatar_url}')` }}></div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{(payment as any).member?.full_name}</p>
                                                <p className="text-xs text-gray-500">{payment.month}/{payment.year}</p>
                                            </div>
                                            <span className="ml-auto font-black text-green-600">R$ {payment.amount}</span>
                                        </div>
                                        <div className="flex gap-2 mt-auto">
                                            <a
                                                href={payment.proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5"
                                            >
                                                Ver Comprovante
                                            </a>
                                            <button
                                                onClick={() => handleReject(payment.id)}
                                                disabled={processingId === payment.id}
                                                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                            <button
                                                onClick={() => handleApprove(payment.id)}
                                                disabled={processingId === payment.id}
                                                className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold shadow-lg shadow-green-500/20"
                                            >
                                                {processingId === payment.id ? '...' : 'Aprovar'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Defaulting Members */}
                        <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-gray-100 dark:border-border-dark shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Em Atraso ({defaultingMembers.length})
                                </h3>
                                <span className="text-xs text-gray-400">{selectedMonth}/{selectedYear}</span>
                            </div>

                            <div className="space-y-4">
                                {defaultingMembers.length === 0 && (
                                    <p className="text-center text-gray-400 text-sm py-4">Todos os filhos estão em dia! Axé!</p>
                                )}
                                {defaultingMembers.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url('${member.avatar_url}')` }}>
                                                {!member.avatar_url && <span className="material-symbols-outlined text-gray-400 h-full flex items-center justify-center text-xs">person</span>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{member.full_name}</p>
                                                <p className="text-xs text-red-500 font-bold">Pendente</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-red-600 dark:text-red-400 text-sm">R$ {member.total_due.toFixed(2)}</p>
                                            <button className="text-[10px] uppercase font-bold text-gray-400 hover:text-gray-600 mt-1">Cobrar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Up to Date Members */}
                        <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-gray-100 dark:border-border-dark shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Em Dia ({upToDateMembers.length})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {upToDateMembers.length === 0 && (
                                    <p className="text-center text-gray-400 text-sm py-4">Nenhum filho em dia neste mês.</p>
                                )}
                                {upToDateMembers.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url('${member.avatar_url}')` }}>
                                                {!member.avatar_url && <span className="material-symbols-outlined text-gray-400 h-full flex items-center justify-center text-xs">person</span>}
                                            </div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{member.full_name}</p>
                                        </div>
                                        <span className="text-green-500 material-symbols-outlined text-lg">check_circle</span>
                                    </div>
                                ))}
                            </div>

                            {/* Exempt Members Section (Inside same card or separate?) Let's put it at bottom of Em Dia card for now or separate? Separate is clearer. */}
                            {exemptMembers.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        Isentos ({exemptMembers.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {exemptMembers.map(member => (
                                            <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors opacity-75">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url('${member.avatar_url}')` }}>
                                                        {!member.avatar_url && <span className="material-symbols-outlined text-gray-400 h-full flex items-center justify-center text-xs">person</span>}
                                                    </div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{member.full_name}</p>
                                                </div>
                                                <span className="text-gray-400 text-xs font-bold uppercase border border-gray-200 dark:border-white/10 px-2 py-1 rounded">Isento</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AdminPayments;
