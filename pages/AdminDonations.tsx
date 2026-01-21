import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

interface DonationItem {
    id: string;
    name: string;
    description: string;
    unit: string;
    requested_quantity: number | null;
    current_quantity: number;
    deadline: string | null;
    pledges?: Pledge[];
}

interface Pledge {
    id: string;
    member: { full_name: string };
    quantity: number;
}

const AdminDonations: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [items, setItems] = useState<DonationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [unit, setUnit] = useState('un');
    const [hasLimit, setHasLimit] = useState(false);
    const [limitQuantity, setLimitQuantity] = useState('');
    const [deadline, setDeadline] = useState('');

    const [selectedItem, setSelectedItem] = useState<DonationItem | null>(null); // For viewing pledges

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('donation_items')
                .select(`
          *,
          pledges:donation_pledges (
             id,
             quantity,
             member:members (full_name)
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching donations:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalPledged = (item: DonationItem) => {
        return item.pledges?.reduce((acc, pledge) => acc + pledge.quantity, 0) || 0;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('donation_items')
                .insert({
                    name,
                    description,
                    unit,
                    requested_quantity: hasLimit ? parseFloat(limitQuantity) : null,
                    deadline: deadline || null,
                });

            if (error) throw error;

            alert('Item de doação criado com sucesso!');
            setShowModal(false);
            resetForm();
            fetchItems();
        } catch (error) {
            console.error('Error creating donation:', error);
            alert('Erro ao criar item.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;
        try {
            const { error } = await supabase.from('donation_items').delete().eq('id', id);
            if (error) throw error;
            fetchItems();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir.');
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setUnit('un');
        setHasLimit(false);
        setLimitQuantity('');
        setDeadline('');
    };

    const generateWhatsAppList = (item: DonationItem) => {
        const total = calculateTotalPledged(item);
        const limitText = item.requested_quantity ? `(Meta: ${item.requested_quantity} ${item.unit})` : '(Sem limite)';

        let text = `*Lista de Doação: ${item.name}*\n${item.description || ''}\nStatus: ${total} ${item.unit} arrecadados ${limitText}\n\n*Quem vai levar:*\n`;

        item.pledges?.forEach(p => {
            text += `- ${p.member.full_name}: ${p.quantity} ${item.unit}\n`;
        });

        navigator.clipboard.writeText(text);
        alert('Lista copiada para a área de transferência!');
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 ml-0 md:ml-72 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    <header className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestão de Doações</h2>
                            <p className="text-gray-500 dark:text-[#9db9a6] mt-1">Crie listas e acompanhe o que os filhos vão levar.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-500 rounded-lg bg-gray-100 dark:bg-white/5">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined">add</span>
                                Novo Item
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map(item => {
                            const total = calculateTotalPledged(item);
                            const progress = item.requested_quantity ? (total / item.requested_quantity) * 100 : 0;

                            return (
                                <div key={item.id} className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-border-dark flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.name}</h3>
                                            <p className="text-sm text-gray-500">{item.description}</p>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-1">
                                            <span>Arrecadado</span>
                                            <span>{item.requested_quantity ? `${total} / ${item.requested_quantity}` : total} {item.unit}</span>
                                        </div>
                                        {item.requested_quantity && (
                                            <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto max-h-40 mb-4 space-y-2 bg-gray-50 dark:bg-black/20 p-3 rounded-xl">
                                        {item.pledges && item.pledges.length > 0 ? (
                                            item.pledges.map(pledge => (
                                                <div key={pledge.id} className="flex justify-between text-sm">
                                                    <span className="text-gray-700 dark:text-gray-300">{pledge.member.full_name}</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">{pledge.quantity} {item.unit}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-center text-gray-400 py-2">Ninguém se comprometeu ainda.</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => generateWhatsAppList(item)}
                                        className="w-full py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                        Copiar Lista
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </main>

            {/* Modal Create */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1A2C22] w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/10">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pedir Doação</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Item</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white"
                                    placeholder="Ex: Velas Brancas"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Descrição (Opcional)</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white h-20 resize-none"
                                    placeholder="Ex: Para a gira de esquerda..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Unidade</label>
                                    <select
                                        value={unit}
                                        onChange={e => setUnit(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white"
                                    >
                                        <option value="un">Unidade(s)</option>
                                        <option value="kg">Kg</option>
                                        <option value="pct">Pacote(s)</option>
                                        <option value="cx">Caixa(s)</option>
                                        <option value="l">Litro(s)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Limite?</label>
                                    <div className="flex items-center h-[50px]">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasLimit}
                                                onChange={e => setHasLimit(e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-white">Definir Limite</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {hasLimit && (
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Quantidade Limite</label>
                                    <input
                                        type="number"
                                        value={limitQuantity}
                                        onChange={e => setLimitQuantity(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white"
                                        placeholder={`Ex: 10`}
                                        required
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20"
                                >
                                    Criar Pedido
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDonations;
