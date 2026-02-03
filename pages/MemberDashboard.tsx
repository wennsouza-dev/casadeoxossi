import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import MemberSidebar from '../components/MemberSidebar';
import MemberSettings from './MemberSettings';
import NotificationBell from '../components/NotificationBell';
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
    const [birthdays, setBirthdays] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
    const [attendanceStats, setAttendanceStats] = useState<Record<string, { count: number, members: { name: string, avatarUrl: string }[] }>>({});
    const [showAttendanceModal, setShowAttendanceModal] = useState<string | null>(null);

    const [notifications, setNotifications] = useState<{ type: 'late' | 'pending_approval' | 'success', message: string, total?: number, count?: number } | null>(null);

    const handleConfirmAttendance = async (eventId: string) => {
        try {
            console.log('Tentando confirmar presença...');
            const email = localStorage.getItem('userEmail');
            console.log('Email:', email);

            if (!email) {
                alert('Você precisa estar logado para confirmar presença.');
                return;
            }

            const { data: member, error: memberError } = await supabase
                .from('members')
                .select('id, name:full_name, avatarUrl:avatar_url')
                .eq('email', email)
                .single();

            if (memberError) {
                console.error('Erro ao buscar membro:', memberError);
                alert('Erro ao buscar seus dados de membro: ' + memberError.message);
                return;
            }

            if (!member) {
                console.error('Membro não encontrado para o email:', email);
                alert('Seu cadastro de membro não foi encontrado. Contate o administrador.');
                return;
            }

            console.log('Membro encontrado:', member.id);

            const { error } = await supabase
                .from('event_attendance')
                .insert({
                    event_id: eventId,
                    member_id: member.id,
                    status: 'confirmed'
                });

            if (error) {
                console.error('Erro no insert:', error);
                throw error;
            }

            console.log('Sucesso no insert!');

            // Update local state
            setAttendanceMap(prev => ({ ...prev, [eventId]: true }));
            setAttendanceStats(prev => {
                const current = prev[eventId] || { count: 0, members: [] };
                return {
                    ...prev,
                    [eventId]: {
                        count: current.count + 1,
                        members: [...current.members, { name: member.name, avatarUrl: member.avatarUrl || '' }]
                    }
                };
            });
            alert('Presença confirmada! Axé!');

        } catch (error: any) {
            console.error('Error confirming attendance:', error);
            alert('Erro ao confirmar presença: ' + (error.message || JSON.stringify(error)));
        }
    };

    const handleCancelAttendance = async (eventId: string) => {
        if (!confirm('Deseja realmente cancelar sua presença nesta Gira?')) return;

        try {
            const email = localStorage.getItem('userEmail');
            if (!email) {
                alert('Você precisa estar logado. Tente sair e entrar novamente.');
                return;
            }

            const { data: member } = await supabase.from('members').select('id, name:full_name').eq('email', email).single();
            if (!member) return;

            const { error } = await supabase
                .from('event_attendance')
                .delete()
                .eq('event_id', eventId)
                .eq('member_id', member.id);

            if (error) throw error;

            // Update local state
            setAttendanceMap(prev => {
                const newMap = { ...prev };
                delete newMap[eventId];
                return newMap;
            });

            setAttendanceStats(prev => {
                const current = prev[eventId] || { count: 0, members: [] };
                return {
                    ...prev,
                    [eventId]: {
                        count: Math.max(0, current.count - 1),
                        members: current.members.filter(m => m.name !== member.name)
                    }
                };
            });

            alert('Presença cancelada.');

        } catch (error) {
            console.error('Error canceling attendance:', error);
            alert('Erro ao cancelar presença.');
        }
    };



    useEffect(() => {
        const checkMonthlyFees = async () => {
            const email = localStorage.getItem('userEmail');
            if (!email) return;

            // 1. Get Member Info (Fee and ID)
            const { data: member } = await supabase
                .from('members')
                .select('id, monthly_fee, created_at, monthly_fee_status')
                .eq('email', email)
                .single();

            if (!member) return;
            if (member.monthly_fee_status === 'Isento') return; // Should we show 'Isento' status to user? Maybe.

            const monthlyFee = Number(member.monthly_fee) || 0;
            if (monthlyFee === 0) return;

            // 2. Get Payments
            const { data: payments } = await supabase
                .from('member_payments')
                .select('*')
                .eq('member_id', member.id);

            const existingPayments = payments || [];

            // Logic: Check past 6 months up to current month
            const today = new Date();
            const lateMonths: string[] = [];
            let pendingApproval = false;
            let totalDebt = 0;

            for (let i = 0; i <= 5; i++) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                // IF date is before member creation, skip
                if (new Date(member.created_at) > new Date(d.getFullYear(), d.getMonth() + 1, 0)) continue;

                const month = d.getMonth() + 1;
                const year = d.getFullYear();

                const payment = existingPayments.find(p => p.month === month && p.year === year);

                // Status Logic
                if (payment) {
                    if (payment.status === 'approved' || payment.status === 'paid') continue; // Paid
                    if (payment.status === 'pending' || payment.status === 'waiting_approval') {
                        if (payment.proof_url) {
                            if (i === 0) pendingApproval = true;
                            continue;
                        }
                    }
                }

                lateMonths.push(d.toLocaleString('pt-BR', { month: 'long' }));
                totalDebt += monthlyFee;
            }

            if (lateMonths.length > 0) {
                // Formatting message
                // Capitalize months
                const formattedMonths = lateMonths.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');

                setNotifications({
                    type: 'late',
                    message: `Você possui pendências referente a: ${formattedMonths}.`,
                    total: totalDebt,
                    count: lateMonths.length
                });
            } else if (pendingApproval) {
                setNotifications({
                    type: 'pending_approval',
                    message: 'Seu pagamento está aguardando aprovação do pai de santo.'
                });
            } else {
                setNotifications({
                    type: 'success',
                    message: 'Suas mensalidades estão em dia! Axé!'
                });
            }
        };

        const fetchEvents = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data: eventsData } = await supabase
                .from('calendar_events')
                .select('*')
                .gte('event_date', today)
                .order('event_date', { ascending: true });

            if (eventsData) {
                setEvents(eventsData);

                const email = localStorage.getItem('userEmail');
                if (email) {
                    const { data: member } = await supabase.from('members').select('id').eq('email', email).single();
                    if (member) {
                        const eventIds = eventsData.map(e => e.id);

                        // Check own attendance
                        const { data: attendance } = await supabase
                            .from('event_attendance')
                            .select('event_id')
                            .eq('member_id', member.id)
                            .in('event_id', eventIds);

                        if (attendance) {
                            const map: Record<string, boolean> = {};
                            attendance.forEach((a: any) => map[a.event_id] = true);
                            setAttendanceMap(map);
                        }

                        // Get all attendance stats
                        const { data: allAttendance } = await supabase
                            .from('event_attendance')
                            .select('event_id, members(name:full_name, avatarUrl:avatar_url)')
                            .in('event_id', eventIds);

                        if (allAttendance) {
                            const stats: Record<string, { count: number, members: { name: string, avatarUrl: string }[] }> = {};
                            allAttendance.forEach((a: any) => {
                                if (!stats[a.event_id]) {
                                    stats[a.event_id] = { count: 0, members: [] };
                                }
                                stats[a.event_id].count++;
                                if (a.members) {
                                    // Handle single member join (it returns an object, not array usually if FK is 1-to-many but here it is many-to-one so it returns ONE member per row)
                                    // Wait, select('members(name)') returns a single object if relational.
                                    // Let's coerce type
                                    const memberData = Array.isArray(a.members) ? a.members[0] : a.members;
                                    if (memberData) {
                                        stats[a.event_id].members.push({ name: memberData.name, avatarUrl: memberData.avatarUrl });
                                    }
                                }
                            });
                            setAttendanceStats(stats);
                        }
                    }
                }
            }
        };

        const fetchDonations = async () => {
            const today = new Date().toISOString().split('T')[0];

            // Fetch items + parent list info
            const { data } = await supabase
                .from('donation_items')
                .select(`
                    *,
                    pledges:donation_pledges (quantity),
                    list:donation_lists (event_date)
                `)
                .order('created_at', { ascending: false });

            if (data) {
                // Client-side filter: only show items from valid lists
                const validItems = data.filter((item: any) => {
                    if (!item.list || !item.list.event_date) return true; // No date = valid? Or assume valid.
                    return item.list.event_date >= today;
                }).slice(0, 3); // Apply limit after filtering

                setDonationItems(validItems);
            }
        };

        const fetchBirthdays = async () => {
            // Fetch members with birthdays
            // Since we can't easily do "MONTH(birth_date) = X" in standard Postgrest helper without a computed column or RPC,
            // we will fetch `birth_date, full_name, avatar_url` for all members and filter in JS. Not efficient for 1M users, but fine for simple org.

            const { data } = await supabase
                .from('members')
                .select('id, full_name, avatar_url, birth_date')
                .not('birth_date', 'is', null);

            if (data) {
                const currentMonth = new Date().getMonth() + 1;
                const currentMonthBirthdays = data.filter((m: any) => {
                    if (!m.birth_date) return false;
                    const [_y, month, _d] = m.birth_date.split('-');
                    return parseInt(month) === currentMonth;
                }).map((m: any) => ({
                    ...m,
                    day: parseInt(m.birth_date.split('-')[2])
                })).sort((a: any, b: any) => a.day - b.day);

                setBirthdays(currentMonthBirthdays);
            }
        };

        checkMonthlyFees();
        fetchEvents();
        fetchDonations();
        fetchBirthdays();
    }, []);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <MemberSidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole={userRole} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-y-auto p-6 md:p-10 relative">
                <div className="flex justify-between items-center md:justify-end mb-4 md:mb-0 relative z-40">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 bg-white dark:bg-surface-dark rounded-lg shadow-sm text-gray-500 dark:text-white z-10"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>

                    <div className="block">
                        <NotificationBell userRole="member" />
                    </div>
                </div>

                {isSettingsPage ? (
                    <MemberSettings />
                ) : (
                    <>
                        <div className="max-w-7xl mx-auto space-y-8 w-full mt-8 md:mt-0">

                            {/* Payment Notifications */}
                            {notifications && (
                                <div className={`w-full rounded-2xl p-6 border flex items-start gap-4 shadow-sm ${notifications.type === 'late'
                                    ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                                    : notifications.type === 'pending_approval'
                                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                        : 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
                                    }`}>
                                    <div className={`p-2 rounded-full ${notifications.type === 'late' ? 'bg-red-500/20'
                                        : notifications.type === 'pending_approval' ? 'bg-yellow-500/20'
                                            : 'bg-green-500/20'
                                        }`}>
                                        <span className="material-symbols-outlined text-2xl">
                                            {notifications.type === 'late' ? 'warning'
                                                : notifications.type === 'pending_approval' ? 'hourglass_top' : 'check_circle'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">
                                            {notifications.type === 'late' ? 'Atenção!'
                                                : notifications.type === 'pending_approval' ? 'Pagamento em Análise' : 'Em Dia'}
                                        </h3>
                                        <p className="text-sm font-medium opacity-90 mb-2">
                                            {notifications.message}
                                        </p>
                                        {notifications.total !== undefined && notifications.total > 0 && (
                                            <div className="mt-2 inline-flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-red-500/10">
                                                <span className="text-xs uppercase font-bold tracking-wider">Valor Total:</span>
                                                <span className="font-black text-lg">
                                                    {notifications.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {notifications.type === 'late' && (
                                        <Link
                                            to="/filhos/mensalidades"
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-700 transition-colors self-center whitespace-nowrap"
                                        >
                                            Regularizar
                                        </Link>
                                    )}
                                </div>
                            )}

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
                                            events.map((event, index) => {
                                                const isConfirmed = attendanceMap[event.id];
                                                return (
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
                                                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                                                                {event.event_time?.slice(0, 5)}h - {event.type}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                                                {event.description || 'Sem descrição.'}
                                                            </p>

                                                            {event.type === 'Gira' && (
                                                                <div className="mt-3 flex flex-col gap-2">
                                                                    <div className="flex items-center justify-between">
                                                                        {isConfirmed ? (
                                                                            <button
                                                                                onClick={() => handleCancelAttendance(event.id)}
                                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                                                            >
                                                                                <span className="material-symbols-outlined text-sm">cancel</span>
                                                                                Cancelar Presença
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleConfirmAttendance(event.id)}
                                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold"
                                                                            >
                                                                                <span className="material-symbols-outlined text-sm">front_hand</span>
                                                                                Confirmar Presença
                                                                            </button>
                                                                        )}

                                                                        {attendanceStats[event.id]?.count > 0 && (
                                                                            <button
                                                                                onClick={() => setShowAttendanceModal(event.id)}
                                                                                className="text-xs text-gray-500 hover:text-primary underline flex items-center gap-1"
                                                                            >
                                                                                <span className="material-symbols-outlined text-sm">group</span>
                                                                                {attendanceStats[event.id].count} confirmados
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                { /* Pedidos de Doações */}
                                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-border-dark flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">volunteer_activism</span>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Pedidos de Doações</h3>
                                        </div>
                                        <Link to="/filhos/doacoes" className="text-primary hover:underline text-xs font-bold uppercase tracking-wider">Ver tudo</Link>
                                    </div>
                                    {/* ... content ... */}
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

                            {/* Aniversariantes */}
                            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-border-dark mt-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-pink-100 dark:bg-pink-900/20 p-2 rounded-full text-pink-500">
                                        <span className="material-symbols-outlined">cake</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Aniversariantes do Mês</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Celebre a vida dos nossos irmãos!</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {birthdays.length === 0 ? (
                                        <div className="col-span-full text-center py-4 text-gray-400 text-sm">
                                            Nenhum aniversariante neste mês.
                                        </div>
                                    ) : (
                                        birthdays.map(b => (
                                            <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <div className="size-10 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                                    {b.avatar_url ? (
                                                        <img src={b.avatar_url} alt={b.full_name} className="size-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-gray-400">person</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{b.full_name}</p>
                                                    <div className="flex items-center gap-1 text-xs text-pink-500 font-bold">
                                                        <span className="material-symbols-outlined text-[10px]">celebration</span>
                                                        <span>Dia {b.day}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
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

            {/* Attendance List Modal */}
            {showAttendanceModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAttendanceModal(null)}>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 dark:border-border-dark flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white">Filhos Confirmados</h3>
                            <button onClick={() => setShowAttendanceModal(null)} className="text-gray-500 hover:bg-gray-100 rounded-full p-1">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                            {attendanceStats[showAttendanceModal]?.members.map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        {m.avatarUrl ? <img src={m.avatarUrl} alt={m.name} className="size-full rounded-full object-cover" /> : m.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{m.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-black/20 text-center">
                            <p className="text-sm font-bold text-primary">
                                Total: {attendanceStats[showAttendanceModal]?.count} filhos
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default MemberDashboard;
