import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    type: 'Gira' | 'Função' | 'Outros';
    is_public: boolean;
}

const AdminAgenda: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '19:00',
        type: 'Gira',
        is_public: false
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .order('event_date', { ascending: true }); // Future events first? Or simply filtered.

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            const { error } = await supabase.from('calendar_events').delete().eq('id', id);
            if (error) throw error;
            setEvents(events.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erro ao excluir evento.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('calendar_events').insert(newEvent);
            if (error) throw error;

            setShowModal(false);
            setNewEvent({
                title: '',
                description: '',
                event_date: new Date().toISOString().split('T')[0],
                event_time: '19:00',
                type: 'Gira',
                is_public: false
            });
            fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Erro ao salvar evento.');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] flex items-center justify-between px-6 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Agenda da Casa</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Novo Evento
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* Event List */}
                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-center text-gray-500">Carregando agenda...</p>
                            ) : events.length === 0 ? (
                                <div className="text-center py-10 bg-white dark:bg-[#1A2C22] rounded-3xl border border-gray-100 dark:border-[#28392e]">
                                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">event_busy</span>
                                    <p className="text-gray-500">Nenhum evento agendado.</p>
                                </div>
                            ) : (
                                events.map(event => (
                                    <div key={event.id} className="bg-white dark:bg-[#1A2C22] p-5 rounded-2xl border border-gray-100 dark:border-[#28392e] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">
                                        <div className="flex items-start gap-4">
                                            <div className={`
                                                w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-white shadow-lg
                                                ${event.type === 'Gira' ? 'bg-primary' : event.type === 'Função' ? 'bg-purple-600' : 'bg-orange-500'}
                                            `}>
                                                <span className="text-xs uppercase">{new Date(event.event_date).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                                <span className="text-xl leading-none">{new Date(event.event_date).getDate() + 1}</span>
                                                {/* Date correction might be needed due to timezone, let's keep simple for now or use UTC string handling */}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{event.title}</h3>
                                                    {event.is_public && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Público</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-[#9db9a6] mt-1">{event.description || 'Sem descrição'}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                        {event.event_time.slice(0, 5)}h
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">category</span>
                                                        {event.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all self-end md:self-center"
                                            title="Excluir Evento"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>

                {/* Add Event Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Novo Evento</h3>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Evento</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: Gira de Caboclo"
                                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#1A2C22] dark:text-white"
                                        value={newEvent.title}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Data</label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#1A2C22] dark:text-white"
                                            value={newEvent.event_date}
                                            onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Horário</label>
                                        <input
                                            required
                                            type="time"
                                            className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#1A2C22] dark:text-white"
                                            value={newEvent.event_time}
                                            onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tipo</label>
                                    <select
                                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#1A2C22] dark:text-white"
                                        value={newEvent.type}
                                        onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                    >
                                        <option value="Gira">Gira</option>
                                        <option value="Função">Função (Interna)</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Descrição</label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#1A2C22] dark:text-white"
                                        value={newEvent.description}
                                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#111813] rounded-xl border border-gray-100 dark:border-[#28392e]">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={newEvent.is_public}
                                        onChange={e => setNewEvent({ ...newEvent, is_public: e.target.checked })}
                                    />
                                    <label htmlFor="isPublic" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        Exibir para Visitantes (Público)
                                    </label>
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
                                        className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
                                    >
                                        Salvar Agenda
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

export default AdminAgenda;
