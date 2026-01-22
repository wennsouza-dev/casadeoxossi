import React, { useState, useEffect } from 'react';
import MemberSidebar from '../components/MemberSidebar';
import { supabase } from '../lib/supabase';

interface DonationList {
    id: string;
    name: string;
    description: string;
    event_date: string | null;
    items: DonationItem[];
}

interface DonationItem {
    id: string;
    list_id: string;
    name: string;
    description: string;
    unit: string;
    requested_quantity: number | null;
    pledges?: Pledge[];
}

interface Pledge {
    id: string;
    member_id: string;
    quantity: number;
    member: { full_name: string, avatar_url: string | null };
}

const MemberDonations: React.FC = () => {
    const [lists, setLists] = useState<DonationList[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');
    const [pledgeInputs, setPledgeInputs] = useState<{ [key: string]: string }>({});
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const email = localStorage.getItem('userEmail');
        if (email) setUserEmail(email);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Lists
            const { data: listData, error: listError } = await supabase
                .from('donation_lists')
                .select('*')
                .order('event_date', { ascending: true });

            if (listError) throw listError;

            // Fetch Items with Pledges
            const { data: itemData, error: itemError } = await supabase
                .from('donation_items')
                .select(`
                    *,
                    pledges:donation_pledges (
                        id,
                        quantity,
                        member_id,
                        member:members (full_name, avatar_url)
                    )
                `)
                .order('created_at', { ascending: false });

            if (itemError) throw itemError;

            // Group items by List
            const groupedLists = listData?.map(list => ({
                ...list,
                items: itemData?.filter(item => item.list_id === list.id) || []
            })) || [];

            setLists(groupedLists);

        } catch (error) {
            console.error('Error fetching donations:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalPledged = (item: DonationItem) => {
        return item.pledges?.reduce((acc, pledge) => acc + pledge.quantity, 0) || 0;
    };

    const isListExpired = (dateString: string | null) => {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const listDate = new Date(dateString);
        return listDate < today;
    };

    const handlePledge = async (item: DonationItem) => {
        const inputVal = pledgeInputs[item.id];
        const quantity = parseFloat(inputVal);

        if (!quantity || quantity <= 0) return alert('Informe uma quantidade válida.');

        setProcessingId(item.id);
        try {
            const { data: memberData } = await supabase.from('members').select('id').eq('email', userEmail).single();
            if (!memberData) throw new Error('Membro não encontrado');

            const total = calculateTotalPledged(item);
            if (item.requested_quantity && (total + quantity > item.requested_quantity)) {
                throw new Error(`Quantidade excede o limite. Disponível: ${item.requested_quantity - total} ${item.unit}`);
            }

            const { error } = await supabase.from('donation_pledges').insert({
                item_id: item.id,
                member_id: memberData.id,
                quantity: quantity
            });

            if (error) throw error;

            alert('Axé! Sua doação foi registrada.');
            setPledgeInputs(prev => ({ ...prev, [item.id]: '' }));
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <MemberSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 ml-0 md:ml-72 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-12">
                    <header>
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-white dark:hover:bg-white/10 shrink-0">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight break-words">Mural de Doações</h2>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 break-words">Contribua com os elementos necessários para nossas giras.</p>
                    </header>

                    {loading ? (
                        <p className="text-center text-gray-500">Carregando...</p>
                    ) : lists.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-surface-dark rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">volunteer_activism</span>
                            <p className="text-gray-500">Nenhuma lista de doação ativa.</p>
                        </div>
                    ) : (
                        lists.map(list => {
                            const expired = isListExpired(list.event_date);
                            if (list.items.length === 0) return null;

                            return (
                                <section key={list.id} className={`space-y-6 ${expired ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-4">
                                        <div>
                                            {expired && <span className="text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600 px-2 py-1 rounded-md mb-2 inline-block">Encerrada</span>}
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                                                {list.name}
                                                {list.event_date && <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">{new Date(list.event_date).toLocaleDateString('pt-BR')}</span>}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-1">{list.description}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {list.items.map(item => {
                                            const total = calculateTotalPledged(item);
                                            const isFull = item.requested_quantity ? total >= item.requested_quantity : false;
                                            const remaining = item.requested_quantity ? item.requested_quantity - total : null;
                                            const progress = item.requested_quantity ? (total / item.requested_quantity) * 100 : 0;

                                            return (
                                                <div key={item.id} className={`p-6 rounded-3xl border shadow-sm flex flex-col transition-all ${isFull ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-75' : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-border-dark'}`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                                            <span className="material-symbols-outlined">{isFull ? 'check_circle' : 'volunteer_activism'}</span>
                                                        </div>
                                                        {item.requested_quantity && (
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${isFull ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                {isFull ? 'Completo' : `Faltam ${remaining} ${item.unit}`}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.name}</h3>
                                                    <p className="text-sm text-gray-500 mb-6">{item.description || 'Sem descrição.'}</p>

                                                    {item.requested_quantity && (
                                                        <div className="mb-6">
                                                            <div className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-1">
                                                                <span>Progresso</span>
                                                                <span>{Math.round(progress)}%</span>
                                                            </div>
                                                            <div className="h-3 bg-gray-100 dark:bg-black/20 rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!isFull && !expired && (
                                                        <div className="mt-auto bg-gray-50 dark:bg-black/20 p-4 rounded-xl flex gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Qtd"
                                                                value={pledgeInputs[item.id] || ''}
                                                                onChange={e => setPledgeInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                className="w-20 rounded-lg border-transparent focus:border-primary focus:ring-0 bg-white dark:bg-white/5 text-center font-bold"
                                                                max={remaining || undefined}
                                                            />
                                                            <button
                                                                onClick={() => handlePledge(item)}
                                                                disabled={processingId === item.id}
                                                                className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all text-sm"
                                                            >
                                                                {processingId === item.id ? '...' : `Vou levar ${item.unit}`}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {item.pledges && item.pledges.length > 0 && (
                                                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                                                            <p className="text-xs font-bold uppercase text-gray-400 mb-3">Quem vai levar</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {item.pledges.map(pledge => (
                                                                    <div key={pledge.id} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 pr-3 pl-1 py-1 rounded-full border border-gray-100 dark:border-white/5">
                                                                        <div className="w-6 h-6 rounded-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url('${pledge.member.avatar_url}')` }}>
                                                                            {!pledge.member.avatar_url && <span className="material-symbols-outlined text-[14px] text-gray-500 flex items-center justify-center w-full h-full">person</span>}
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                                            {pledge.member.full_name.split(' ')[0]} <span className="text-primary">({pledge.quantity})</span>
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
};

export default MemberDonations;
