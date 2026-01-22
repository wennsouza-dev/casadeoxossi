import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import MemberSidebar from '../components/MemberSidebar';
import MemberSettings from './MemberSettings';
import { supabase } from '../lib/supabase';

interface MemberDashboardProps {
    onLogout: () => void;
    userRole?: 'admin' | 'member' | null;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ onLogout, userRole }) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const location = useLocation();
    const isSettingsPage = location.pathname.includes('/settings');
    const [events, setEvents] = useState<any[]>([]);
    const [donationItems, setDonationItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('calendar_events')
                .select('*')
                .gte('event_date', today)
                .order('event_date', { ascending: true })
                .limit(3);
            if (data) setEvents(data);
        };

        const fetchDonations = async () => {
            const { data } = await supabase
                .from('donation_items')
                .select(`
                    *,
                    pledges:donation_pledges (quantity)
                `)
                .order('created_at', { ascending: false })
                .limit(3);
            if (data) setDonationItems(data);
        };

        fetchEvents();
        fetchDonations();
    }, []);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <MemberSidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={userRole} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-y-auto p-6 md:p-10 relative">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden absolute top-6 left-6 p-2 bg-white dark:bg-surface-dark rounded-lg shadow-sm text-gray-500 dark:text-white z-10"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                {isSettingsPage ? (
                    <MemberSettings />
                ) : (
                    <>
                        <div className="max-w-7xl mx-auto space-y-8 w-full mt-8 md:mt-0">

                            {/* Header Section */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight font-serif italic mb-2">
                                    Painel dos Filhos de Santo
                                </h1>
                                <p className="text-gray-500 dark:text-[#9db9a6] text-lg max-w-2xl">
                                    Acompanhe suas obrigações, a agenda da casa e contribua com a nossa comunidade.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-[#E8F5E9] dark:bg-primary/10 w-fit px-4 py-2 rounded-full border border-primary/20">
                                <span className="text-primary font-bold text-sm capitalize">
                                    {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="material-symbols-outlined text-primary text-sm">spa</span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* Agenda de Giras */}
                                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-border-dark">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">calendar_month</span>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Agenda de Giras</h3>
                                        </div>
                                        <button className="text-primary hover:underline text-xs font-bold uppercase tracking-wider">Ver tudo</button>
                                    </div>

                                    <div className="space-y-6 relative">
                                        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-100 dark:bg-gray-700"></div>

                                        {events.length === 0 ? (
                                            <p className="text-sm text-gray-500 pl-8">Nenhum evento próximo agendado.</p>
                                        ) : (
                                            events.map((event, index) => (
                                                <div key={event.id} className="relative pl-8">
                                                    <div className={`absolute left-0 top-0 size-6 rounded-full flex items-center justify-center text-white z-10 ${index === 0 ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            {event.type === 'Gira' ? 'church' : event.type === 'Função' ? 'lock' : 'event'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className={`font-bold text-sm ${index === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                {event.title}
                                                            </h4>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                                {new Date(event.event_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                                                            {event.event_time?.slice(0, 5)}h - {event.type}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                            {event.description || 'Sem descrição.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Pedidos de Doações */}
                                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-border-dark flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">volunteer_activism</span>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Pedidos de Doações</h3>
                                        </div>
                                        <Link to="/filhos/doacoes" className="text-primary hover:underline text-xs font-bold uppercase tracking-wider">Ver tudo</Link>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {donationItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-gray-400">
                                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">volunteer_activism</span>
                                                <p className="text-sm">Nenhum pedido de doação ativo no momento.</p>
                                            </div>
                                        ) : (
                                            donationItems.map((item, index) => {
                                                const total = item.pledges?.reduce((acc: number, p: any) => acc + p.quantity, 0) || 0;
                                                const isFull = item.requested_quantity ? total >= item.requested_quantity : false;

                                                return (
                                                    <div key={item.id} className={`${index === 0 ? 'bg-[#FFF8E1] dark:bg-amber-900/20 border-[#FFE082] dark:border-amber-700/30' : 'border-gray-100 dark:border-border-dark'} p-5 rounded-2xl border relative`}>
                                                        {index === 0 && (
                                                            <>
                                                                <span className="absolute top-4 right-4 text-amber-500 font-bold">!</span>
                                                                <span className="bg-[#FFE082] text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 inline-block">Destaque</span>
                                                            </>
                                                        )}

                                                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.name}</h4>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{item.description || 'Sem descrição.'}</p>

                                                        {item.requested_quantity && (
                                                            <div className="mb-3">
                                                                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-1">
                                                                    <span>Meta: {item.requested_quantity} {item.unit}</span>
                                                                    <span>{Math.round((total / item.requested_quantity) * 100)}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-primary" style={{ width: `${Math.min((total / item.requested_quantity) * 100, 100)}%` }}></div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <Link to="/filhos/doacoes" className={`w-full block text-center py-2 rounded-xl text-sm font-bold transition-colors ${index === 0
                                                            ? 'bg-[#D4A017] hover:bg-[#B38600] text-white'
                                                            : 'border border-primary text-primary hover:bg-primary/5'
                                                            }`}>
                                                            {isFull ? 'Ver Detalhes' : 'Contribuir'}
                                                        </Link>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full bg-[#2E7D32] rounded-3xl p-8 relative overflow-hidden mt-6 text-white text-center md:text-left flex flex-col md:flex-row items-center gap-6">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                <div className="flex-1 relative z-10">
                                    <h3 className="text-2xl font-serif italic font-bold mb-2">Mensagem do Zelador</h3>
                                    <p className="text-white/90 text-sm md:text-base italic">"Que o arco de Oxóssi aponte sempre para a fartura de axé em sua vida. A casa se fortalece com a sua dedicação e caridade. Saravá!"</p>
                                </div>
                                <div className="relative z-10 bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-4xl">local_florist</span>
                                </div>
                                <div className="absolute bottom-4 right-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 hidden md:block">Respeito & Tradição</div>
                            </div>

                            {/* End of Dashboard Widgets */}
                        </div>
                    </>
                )}
            </main >
        </div >
    );
};

export default MemberDashboard;
