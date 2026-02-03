import React, { useState, useEffect, useRef } from 'react';
import MemberSidebar from '../components/MemberSidebar';
import { supabase } from '../lib/supabase';

interface Message {
    id: string;
    content: string;
    member_id: string;
    created_at: string;
    member?: {
        full_name: string;
        avatar_url: string | null;
    };
}

const MemberChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentMember, setCurrentMember] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCurrentMember = async () => {
            const email = localStorage.getItem('userEmail');
            if (!email) return;
            const { data } = await supabase.from('members').select('id, full_name, avatar_url').eq('email', email).single();
            if (data) setCurrentMember(data);
        };
        fetchCurrentMember();
        fetchMessages();

        // Subscribe to Realtime
        const channel = supabase
            .channel('public:chat_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                // Fetch the new message with member details (since payload only has raw data)
                fetchNewMessageDetails(payload.new.id);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('chat_messages')
            .select(`
                *,
                member:members (full_name, avatar_url)
            `)
            .order('created_at', { ascending: true })
            .limit(50);

        if (data) setMessages(data);
        scrollToBottom();
    };

    const fetchNewMessageDetails = async (id: string) => {
        const { data } = await supabase
            .from('chat_messages')
            .select(`
                *,
                member:members (full_name, avatar_url)
            `)
            .eq('id', id)
            .single();

        if (data) {
            setMessages(prev => [...prev, data]);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentMember) return;

        const msg = newMessage;
        setNewMessage(''); // Optimistic clear

        const { error } = await supabase.from('chat_messages').insert({
            content: msg,
            member_id: currentMember.id
        });

        if (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem.');
            setNewMessage(msg); // Restore if failed
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark h-screen flex overflow-hidden font-display">
            <MemberSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-full relative">
                {/* Header */}
                <header className="px-6 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-[#28392e] flex items-center justify-between shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:text-white dark:hover:bg-white/10 rounded-lg">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">forum</span>
                                Bate-papo
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Converse com os irmãos da casa.</p>
                        </div>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/50 dark:bg-black/20">
                    {messages.map((msg, index) => {
                        const isMe = msg.member_id === currentMember?.id;
                        const showAvatar = index === 0 || messages[index - 1].member_id !== msg.member_id;

                        return (
                            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${!showAvatar ? (isMe ? 'mr-11' : 'ml-11') : ''}`}>
                                {showAvatar ? (
                                    <div
                                        className="w-8 h-8 rounded-full bg-gray-200 bg-cover bg-center shrink-0 border border-gray-100 dark:border-gray-700"
                                        style={{ backgroundImage: msg.member?.avatar_url ? `url('${msg.member.avatar_url}')` : 'none' }}
                                    >
                                        {!msg.member?.avatar_url && <span className="material-symbols-outlined text-gray-400 text-xs flex items-center justify-center h-full">person</span>}
                                    </div>
                                ) : null}

                                <div className={`max-w-[80%] md:max-w-[60%] space-y-1`}>
                                    {showAvatar && !isMe && (
                                        <span className="text-[10px] font-bold text-gray-500 ml-1 block">
                                            {msg.member?.full_name.split(' ')[0]}
                                        </span>
                                    )}
                                    <div
                                        className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                                            ${isMe
                                                ? 'bg-primary text-white rounded-tr-none'
                                                : 'bg-white dark:bg-[#1A2C22] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-white/5'
                                            }
                                        `}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className={`text-[10px] text-gray-400 block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-[#28392e] shrink-0">
                    <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 rounded-xl border-gray-200 dark:border-white/10 dark:bg-black/20 dark:text-white p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary/20 aspect-square"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default MemberChat;
