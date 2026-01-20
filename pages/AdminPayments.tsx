import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

const AdminPayments: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('member_payments')
                .select(`
                    *,
                    members (full_name, religious_name, avatar_url)
                `)
                .order('created_at', { ascending: false }); // Fetch all for history, or just pending? Let's fetch all but prioritize pending.

            if (error) throw error;
            setPayments(data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: 'paid' | 'rejected') => {
        if (!window.confirm(`Deseja marcar este pagamento como ${newStatus === 'paid' ? 'PAGO' : 'REJEITADO'}?`)) return;

        try {
            const { error } = await supabase
                .from('member_payments')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            alert('Status atualizado com sucesso!');
            fetchPendingPayments();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status.');
        }
    };

    const pendingPayments = payments.filter(p => p.status === 'pending_approval');
    const historyPayments = payments.filter(p => p.status !== 'pending_approval');

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} />
            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] flex items-center justify-between px-6 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Conferência de Mensalidades</h2>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Pending Review Section */}
                        <div className="bg-white dark:bg-[#1A2C22] rounded-3xl border border-orange-200 dark:border-orange-900 overflow-hidden shadow-lg shadow-orange-500/5">
                            <div className="p-6 border-b border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/10">
                                <h3 className="font-bold text-lg text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                    <span className="material-symbols-outlined">pending_actions</span>
                                    Pendentes de Aprovação ({pendingPayments.length})
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-[#28392e]">
                                {pendingPayments.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">Nenhum comprovante pendente.</div>
                                ) : (
                                    pendingPayments.map(payment => (
                                        <div key={payment.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    {payment.members?.avatar_url ? (
                                                        <img src={payment.members.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined p-3">person</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{payment.members?.full_name}</h4>
                                                    <p className="text-xs text-gray-500">{payment.members?.religious_name}</p>
                                                    <p className="text-sm font-semibold text-primary mt-1">
                                                        Ref: {new Date(0, payment.month - 1).toLocaleString('pt-BR', { month: 'long' })}/{payment.year} • R$ {payment.amount.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {payment.proof_url && (
                                                    <a
                                                        href={payment.proof_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        Ver Comprovante
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleUpdateStatus(payment.id, 'rejected')}
                                                    className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    Rejeitar
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(payment.id, 'paid')}
                                                    className="px-4 py-2 text-sm font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 shadow-lg shadow-green-500/20 transition-colors"
                                                >
                                                    Aprovar Baixa
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent History */}
                        <div className="bg-white dark:bg-[#1A2C22] rounded-3xl border border-gray-100 dark:border-[#28392e] overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-[#28392e]">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Histórico Recente</h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-[#111813]">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Membro</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Referência</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Valor</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-[#28392e]">
                                    {historyPayments.slice(0, 10).map(payment => (
                                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-[#20362a]">
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                {payment.members?.full_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(0, payment.month - 1).toLocaleString('pt-BR', { month: 'short' })}/{payment.year}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                                R$ {payment.amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                        payment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {payment.status === 'paid' ? 'Pago' :
                                                        payment.status === 'rejected' ? 'Rejeitado' : payment.status}
                                                </span>
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

export default AdminPayments;
