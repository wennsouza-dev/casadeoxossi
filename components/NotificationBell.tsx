import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'agenda' | 'donation' | 'finance' | 'member' | 'system';
    link?: string;
    read: boolean;
    created_at: string;
}

interface NotificationBellProps {
    userRole: 'admin' | 'member' | null;
    align?: 'left' | 'right';
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userRole, align = 'right' }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) return;

            let query = supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (userRole === 'admin') {
                // Admin sees 'admin' or 'all' targets
                query = query.in('target_role', ['admin', 'all']);
            } else {
                // Member sees 'member', 'all', OR 'specific' for their ID
                // First get member ID
                const { data: member } = await supabase
                    .from('members')
                    .select('id')
                    .eq('email', userEmail)
                    .single();

                if (member) {
                    // Complex OR logic is hard in JS SDK single query without complex filters
                    // We'll fetch broadly and filter in memory or use logic string
                    // "target_role in (member, all) OR user_id = member.id"

                    // Supabase 'or' query syntax:
                    query = query.or(`target_role.in.(member,all),user_id.eq.${member.id}`);
                } else {
                    // Fallback if member not found (shouldn't happen if logged in)
                    query = query.in('target_role', ['member', 'all']);
                }
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }

        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        if (unreadCount === 0) return;

        // Optimistic update
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        setUnreadCount(0);

        // Batch update in BG
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            await supabase
                .from('notifications')
                .update({ read: true })
                .in('id', unreadIds);
        }
    };

    const toggleOpen = () => {
        if (!isOpen) {
            setIsOpen(true);
            fetchNotifications(); // Refresh on open
        } else {
            setIsOpen(false);
            markAsRead(); // Mark read on close? or maybe immediately?
            // Let's mark read when opening actually, or provide a "Mark all read" button?
            // User requested: "alerta... até verem a notificação total"
            // So simply opening the bell should probably mark them as read or "seen".
            markAsRead();
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchNotifications();

        // Poll every 60s for new notifications
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [userRole]);

    return (
        <div className="relative z-50">
            <button
                onClick={toggleOpen}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
                <span className={`material-symbols-outlined text-2xl ${unreadCount > 0 ? 'text-primary animate-pulse' : 'text-gray-500 dark:text-gray-400'}`}>
                    notifications
                </span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white dark:border-[#111813]"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/5 md:bg-transparent"
                        onClick={() => { setIsOpen(false); markAsRead(); }}
                    ></div>
                    <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-80 md:w-96 bg-white dark:bg-[#1A2C22] rounded-2xl shadow-xl border border-gray-100 dark:border-[#28392e] overflow-hidden z-50`}>
                        <div className="p-4 border-b border-gray-100 dark:border-[#28392e] flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white">Notificações</h3>
                            <button onClick={fetchNotifications} className="text-gray-400 hover:text-primary">
                                <span className="material-symbols-outlined text-sm">refresh</span>
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {loading && notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">Carregando...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center text-gray-400 gap-2">
                                    <span className="material-symbols-outlined text-3xl opacity-50">notifications_off</span>
                                    <span className="text-sm">Nenhuma notificação nova.</span>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-[#28392e]">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${!notification.read ? 'bg-primary/5 dark:bg-primary/5' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 
                                                    ${notification.type === 'agenda' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20' :
                                                        notification.type === 'donation' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20' :
                                                            notification.type === 'finance' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/20'}`}
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {notification.type === 'agenda' ? 'event' :
                                                            notification.type === 'donation' ? 'volunteer_activism' :
                                                                notification.type === 'finance' ? 'payments' :
                                                                    'info'}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`text-sm font-bold ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 mt-2 block">
                                                        {new Date(notification.created_at).toLocaleString('pt-BR')}
                                                    </span>

                                                    {notification.link && (
                                                        <Link
                                                            to={notification.link}
                                                            onClick={() => setIsOpen(false)}
                                                            className="mt-3 block text-center w-full py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white transition-colors"
                                                        >
                                                            Ver Detalhes
                                                        </Link>
                                                    )}
                                                </div>
                                                {!notification.read && (
                                                    <div className="shrink-0">
                                                        <span className="block h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-[#1A2C22]"></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
