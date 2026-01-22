import React, { useState, useEffect } from 'react';
import MemberSidebar from '../components/MemberSidebar'; // Updated import path assumption
import { supabase } from '../lib/supabase';

const MemberFinancial: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [amount, setAmount] = useState('50.00'); // Default value? To be parameterized maybe
    const [file, setFile] = useState<File | null>(null);
    const [userEmail, setUserEmail] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const email = localStorage.getItem('userEmail');
        if (email) {
            setUserEmail(email);
            fetchPayments(email);
        }
    }, []);

    const fetchPayments = async (email: string) => {
        try {
            // Get Member ID first
            const { data: memberData } = await supabase
                .from('members')
                .select('id')
                .eq('email', email)
                .single();

            if (memberData) {
                const { data, error } = await supabase
                    .from('member_payments')
                    .select('*')
                    .eq('member_id', memberData.id)
                    .order('payment_dates', { ascending: false });

                if (error) throw error;
                setPayments(data || []);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert('Selecione um comprovante');

        setUploading(true);
        try {
            const { data: memberData } = await supabase
                .from('members')
                .select('id')
                .eq('email', userEmail)
                .single();

            if (!memberData) throw new Error('Membro não encontrado');

            // Upload File
            const fileExt = file.name.split('.').pop();
            const fileName = `${memberData.id}-${selectedYear}-${selectedMonth}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('payment_proofs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('payment_proofs').getPublicUrl(filePath);

            // Create Payment Record
            const { error: insertError } = await supabase
                .from('member_payments')
                .insert({
                    member_id: memberData.id,
                    amount: parseFloat(amount),
                    month: selectedMonth,
                    year: selectedYear,
                    status: 'pending_approval', // Creating new status logic
                    payment_dates: new Date().toISOString(),
                    proof_url: publicUrl,
                    created_at: new Date().toISOString()
                });

            if (insertError) throw insertError;

            alert('Comprovante enviado com sucesso! Aguarde a conferência.');
            setFile(null);
            fetchPayments(userEmail);

        } catch (error: any) {
            console.error('Error uploading proof:', error);
            alert('Erro ao enviar comprovante: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Pago</span>;
            case 'pending_approval': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">Em Análise</span>;
            case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Rejeitado</span>;
            case 'pending': return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">Pendente</span>;
            default: return <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <MemberSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 ml-0 md:ml-72 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                    <header>
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-white dark:hover:bg-white/10 shrink-0">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words">Minhas Mensalidades</h2>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 break-words">Envie seus comprovantes e acompanhe seu histórico.</p>
                    </header>

                    {/* Pending Amount Summary (Mock logic for now) */}
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <p className="text-red-600 dark:text-red-400 font-bold uppercase tracking-wider text-xs mb-1">Status Geral</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white break-words">
                                {payments.some(p => p.status === 'pending_approval')
                                    ? 'Comprovantes em Análise'
                                    : 'Mantenha suas mensalidades em dia!'}
                            </h3>
                        </div>
                        <span className="material-symbols-outlined text-4xl text-red-500 opacity-50 self-end md:self-auto">account_balance_wallet</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Upload Form */}
                        <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl border border-gray-100 dark:border-border-dark shadow-sm">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Enviar Comprovante</h3>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Mês</label>
                                        <select
                                            value={selectedMonth}
                                            onChange={e => setSelectedMonth(Number(e.target.value))}
                                            className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 dark:bg-[#1A2C22] dark:text-white"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ano</label>
                                        <select
                                            value={selectedYear}
                                            onChange={e => setSelectedYear(Number(e.target.value))}
                                            className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 dark:bg-[#1A2C22] dark:text-white"
                                        >
                                            <option value={2023}>2023</option>
                                            <option value={2024}>2024</option>
                                            <option value={2025}>2025</option>
                                            <option value={2026}>2026</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 dark:bg-[#1A2C22] dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Comprovante</label>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <span className="material-symbols-outlined animate-spin">refresh</span>
                                    ) : (
                                        <span className="material-symbols-outlined">send</span>
                                    )}
                                    {uploading ? 'Enviando...' : 'Enviar Comprovante'}
                                </button>
                            </form>
                        </div>

                        {/* Recent Payments */}
                        <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl border border-gray-100 dark:border-border-dark shadow-sm h-fit">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Histórico Recente</h3>
                            <div className="space-y-4">
                                {loading && <p className="text-center text-gray-500">Carregando...</p>}
                                {!loading && payments.length === 0 && (
                                    <p className="text-center text-gray-500 text-sm">Nenhum pagamento registrado.</p>
                                )}
                                {payments.map(payment => (
                                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1A2C22] rounded-2xl">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {new Date(0, payment.month - 1).toLocaleString('pt-BR', { month: 'long' })}/{payment.year}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Enviado em {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">R$ {payment.amount.toFixed(2)}</p>
                                            {getStatusBadge(payment.status)}
                                        </div>
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

export default MemberFinancial;
