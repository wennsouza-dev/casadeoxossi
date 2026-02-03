import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';

interface DonationList {
    id: string;
    name: string;
    description: string;
    event_date: string | null;
}

interface DonationItem {
    id: string;
    list_id: string;
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
    const [view, setView] = useState<'lists' | 'items'>('lists');
    const [selectedList, setSelectedList] = useState<DonationList | null>(null);

    const [lists, setLists] = useState<DonationList[]>([]);
    const [items, setItems] = useState<DonationItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modals
    const [showListModal, setShowListModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // List Form
    const [listName, setListName] = useState('');
    const [listDesc, setListDesc] = useState('');
    const [listDate, setListDate] = useState('');

    // Item Form
    const [itemName, setItemName] = useState('');
    const [itemDesc, setItemDesc] = useState('');
    const [itemUnit, setItemUnit] = useState('un');
    const [hasLimit, setHasLimit] = useState(false);
    const [limitQuantity, setLimitQuantity] = useState('');

    // Import Form
    const [importSourceListId, setImportSourceListId] = useState('');
    const [sourceItems, setSourceItems] = useState<DonationItem[]>([]);
    const [selectedImportItems, setSelectedImportItems] = useState<string[]>([]);

    useEffect(() => {
        fetchLists();
    }, []);

    useEffect(() => {
        if (selectedList) {
            fetchItems(selectedList.id);
        }
    }, [selectedList]);

    // --- Fetch Lists ---
    const fetchLists = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('donation_lists')
            .select('*')
            .order('event_date', { ascending: true });
        if (data) setLists(data);
        setLoading(false);
    };

    // --- Fetch Items ---
    const fetchItems = async (listId: string) => {
        setLoading(true);
        const { data } = await supabase
            .from('donation_items')
            .select(`
                *,
                pledges:donation_pledges (
                    id, quantity, member:members(full_name)
                )
            `)
            .eq('list_id', listId)
            .order('created_at', { ascending: false });
        if (data) setItems(data);
        setLoading(false);
    };

    // --- Create List ---
    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('donation_lists').insert({
            name: listName,
            description: listDesc,
            event_date: listDate || null
        });
        if (!error) {
            alert('Lista criada!');
            setShowListModal(false);
            resetListForm();
            fetchLists();
        }
    };

    // --- Create Item ---
    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedList) return;
        const { error } = await supabase.from('donation_items').insert({
            list_id: selectedList.id,
            name: itemName,
            description: itemDesc,
            unit: itemUnit,
            requested_quantity: hasLimit ? parseFloat(limitQuantity) : null,
        });
        if (!error) {
            alert('Item adicionado!');
            setShowItemModal(false);
            resetItemForm();
            fetchItems(selectedList.id);
        }
    };

    // --- Import Items Logic ---
    const handleOpenImport = async () => {
        setShowImportModal(true);
        // Fetch source lists excluding current
        // (For simplicity fetching all lists and user filters in select)
    };

    const handleSourceListChange = async (sourceId: string) => {
        setImportSourceListId(sourceId);
        const { data } = await supabase.from('donation_items').select('*').eq('list_id', sourceId);
        if (data) setSourceItems(data);
    };

    const handleImportSubmit = async () => {
        if (!selectedList) return;
        const itemsToImport = sourceItems.filter(i => selectedImportItems.includes(i.id));

        const newItems = itemsToImport.map(i => ({
            list_id: selectedList.id,
            name: i.name,
            description: i.description,
            unit: i.unit,
            requested_quantity: i.requested_quantity
        }));

        const { error } = await supabase.from('donation_items').insert(newItems);
        if (!error) {
            alert(`${newItems.length} itens importados!`);
            setShowImportModal(false);
            setSelectedImportItems([]);
            fetchItems(selectedList.id);
        }
    };

    // --- Deletions ---
    const handleDeleteList = async (id: string) => {
        if (confirm('Excluir lista e todos os itens?')) {
            await supabase.from('donation_lists').delete().eq('id', id);
            fetchLists();
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (confirm('Excluir item?')) {
            await supabase.from('donation_items').delete().eq('id', id);
            if (selectedList) fetchItems(selectedList.id);
        }
    };

    // --- Helpers ---
    const resetListForm = () => { setListName(''); setListDesc(''); setListDate(''); };
    const resetItemForm = () => { setItemName(''); setItemDesc(''); setItemUnit('un'); setHasLimit(false); setLimitQuantity(''); };
    const calculateTotalPledged = (item: DonationItem) => item.pledges?.reduce((acc, p) => acc + p.quantity, 0) || 0;

    const generateWhatsAppList = (item?: DonationItem) => {
        if (!selectedList) return;

        let text = `*Lista de Doação: ${selectedList.name}*`;
        if (selectedList.event_date) text += `\n📅 Data: ${new Date(selectedList.event_date + 'T12:00:00').toLocaleDateString('pt-BR')}`;
        text += `\n\n`;

        const targetItems = item ? [item] : items;

        targetItems.forEach(i => {
            const total = calculateTotalPledged(i);
            const limitText = i.requested_quantity ? `(Meta: ${i.requested_quantity})` : '';
            text += `🔹 *${i.name}* (${total} ${i.unit} arrecadados) ${limitText}\n`;
            if (i.pledges && i.pledges.length > 0) {
                text += `   Quem leva:\n`;
                i.pledges.forEach(p => text += `   - ${p.member.full_name}: ${p.quantity} ${i.unit}\n`);
            }
            text += `\n`;
        });

        navigator.clipboard.writeText(text);
        alert('Lista copiada!');
    };


    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 ml-0 md:ml-72 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 w-full md:w-auto">
                            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 mt-1 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-white dark:hover:bg-white/10 shrink-0">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <div className="flex-1 min-w-0">
                                {view === 'items' && selectedList ? (
                                    <button onClick={() => setView('lists')} className="text-sm font-bold text-gray-400 hover:text-primary mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">arrow_back</span> Voltar para Listas
                                    </button>
                                ) : null}
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight break-words">
                                        {view === 'lists' ? 'Gestão de Doações' : selectedList?.name}
                                    </h2>
                                    <NotificationBell userRole="admin" />
                                </div>
                                <p className="text-gray-500 dark:text-[#9db9a6] mt-1 text-sm md:text-base break-words">
                                    {view === 'lists' ? 'Gerencie as listas de pedidos para as giras.' : selectedList?.description || 'Gerencie os itens desta lista.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {view === 'lists' ? (
                                <button onClick={() => setShowListModal(true)} className="flex-1 md:flex-none bg-primary hover:bg-primary-hover text-white px-4 py-3 md:py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm md:text-base">
                                    <span className="material-symbols-outlined">add</span> Nova Lista
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => generateWhatsAppList()} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-3 md:py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 text-sm md:text-base whitespace-nowrap">
                                        <span className="material-symbols-outlined">share</span> Compartilhar
                                    </button>
                                    <button onClick={handleOpenImport} className="flex-1 md:flex-none bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white px-4 py-3 md:py-2 rounded-xl font-bold flex items-center justify-center gap-2 text-sm md:text-base">
                                        <span className="material-symbols-outlined">download</span> Importar
                                    </button>
                                    <button onClick={() => setShowItemModal(true)} className="flex-1 md:flex-none bg-primary hover:bg-primary-hover text-white px-4 py-3 md:py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm md:text-base">
                                        <span className="material-symbols-outlined">add</span> Novo Item
                                    </button>
                                </>
                            )}
                        </div>
                    </header>

                    {/* Content */}
                    {view === 'lists' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lists.map(list => (
                                <div key={list.id} onClick={() => { setSelectedList(list); setView('items'); }} className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-border-dark cursor-pointer hover:border-primary/50 transition-all group relative">
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }} className="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-black/40 rounded-full shadow-sm">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">list_alt</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] items-center font-bold uppercase tracking-widest text-gray-400">
                                                {list.event_date ? new Date(list.event_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem Data'}
                                                {list.event_date && new Date(list.event_date + 'T12:00:00') < new Date(new Date().setHours(0, 0, 0, 0)) && (
                                                    <span className="ml-2 text-red-500 bg-red-100 px-2 py-0.5 rounded-md">Essa lista já expirou</span>
                                                )}
                                            </p>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{list.name}</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{list.description || 'Sem descrição.'}</p>
                                    <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:underline">
                                        Ver Itens <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
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
                                            <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500">
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
                                            {item.pledges?.map(p => (
                                                <div key={p.id} className="flex justify-between text-sm">
                                                    <span className="text-gray-700 dark:text-gray-300">{p.member.full_name}</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">{p.quantity} {item.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => generateWhatsAppList(item)} className="w-full py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">content_copy</span> Copiar Item
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal List */}
            {showListModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleCreateList} className="bg-white dark:bg-[#1A2C22] w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-4">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Lista</h3>
                        <input value={listName} onChange={e => setListName(e.target.value)} placeholder="Nome da Lista" className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white" required />
                        <input value={listDesc} onChange={e => setListDesc(e.target.value)} placeholder="Descrição" className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white" />
                        <input type="date" value={listDate} onChange={e => setListDate(e.target.value)} className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white" required />
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowListModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 rounded-xl font-bold">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Criar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Item */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleCreateItem} className="bg-white dark:bg-[#1A2C22] w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-4">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Adicionar Item</h3>
                        <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Nome do Item" className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white" required />
                        <input value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="Descrição" className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white" />
                        <div className="flex gap-2">
                            <select value={itemUnit} onChange={e => setItemUnit(e.target.value)} className="w-1/3 rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white">
                                <option value="un">un</option><option value="kg">kg</option><option value="pct">pct</option>
                            </select>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={hasLimit} onChange={e => setHasLimit(e.target.checked)} className="w-5 h-5" />
                                <span className="text-sm dark:text-white">Limite?</span>
                            </div>
                            {hasLimit && <input type="number" value={limitQuantity} onChange={e => setLimitQuantity(e.target.value)} placeholder="Qtd" className="w-24 rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white" />}
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 rounded-xl font-bold">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Salvar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Import */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1A2C22] w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Importar Itens</h3>
                        <p className="text-sm text-gray-500">Selecione uma lista anterior para copiar os itens.</p>

                        <select
                            value={importSourceListId}
                            onChange={e => handleSourceListChange(e.target.value)}
                            className="w-full rounded-xl border-gray-200 dark:border-white/10 p-3 dark:bg-black/20 dark:text-white"
                        >
                            <option value="">Selecione uma lista...</option>
                            {lists.filter(l => l.id !== selectedList?.id).map(l => (
                                <option key={l.id} value={l.id}>{l.name} ({l.event_date ? new Date(l.event_date + 'T12:00:00').toLocaleDateString() : 'S/ Data'})</option>
                            ))}
                        </select>

                        <div className="flex-1 overflow-y-auto space-y-2 border border-gray-100 dark:border-white/10 rounded-xl p-4">
                            {sourceItems.length === 0 && <p className="text-center text-gray-400 text-sm">Nenhum item para exibir.</p>}
                            {sourceItems.map(item => (
                                <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedImportItems.includes(item.id)}
                                        onChange={e => {
                                            if (e.target.checked) setSelectedImportItems([...selectedImportItems, item.id]);
                                            else setSelectedImportItems(selectedImportItems.filter(id => id !== item.id));
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setShowImportModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 rounded-xl font-bold">Cancelar</button>
                            <button onClick={handleImportSubmit} disabled={selectedImportItems.length === 0} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50">Importar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDonations;
