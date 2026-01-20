import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

const AdminSettings: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [fullName, setFullName] = useState('');
    const [religiousName, setReligiousName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const email = localStorage.getItem('userEmail');
            if (!email) {
                // For admin, we might not have set userEmail in localStorage if they logged in via a different flow?
                // Wait, logic in LoginPage sets userEmail for everyone.
                // But if they are just "Admin Pai Antonio" hardcoded?
                // Let's assume we want to edit the "Admin Wenn" profile we created.
                // If localStorage is empty, let's fallback to 'wennsouza@gmail.com' for safety if userRole is admin.
                // But better to warn.
            }

            const targetEmail = email || 'wennsouza@gmail.com'; // Default to master admin for now if lost context

            const { data, error } = await supabase
                .from('members')
                .select('full_name, religious_name, avatar_url')
                .eq('email', targetEmail) // Fetch by email
                .single();

            if (error) {
                // Try fetching by role if email fails? No, keep simple.
                throw error;
            }

            if (data) {
                setFullName(data.full_name);
                setReligiousName(data.religious_name || '');
                setAvatarUrl(data.avatar_url);
            }

        } catch (err: any) {
            console.error(err);
            // Don't show critical error, maybe just empty state
            // setMessage({ type: 'error', text: 'Erro ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Você deve selecionar uma imagem.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `admin-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(publicUrl);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const email = localStorage.getItem('userEmail') || 'wennsouza@gmail.com';

            const { error } = await supabase
                .from('members')
                .update({
                    full_name: fullName,
                    religious_name: religiousName,
                    avatar_url: avatarUrl
                })
                .eq('email', email);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            // Optionally update localStorage or force refresh to update sidebar?
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao salvar alterações.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
                <header className="h-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] flex items-center justify-between px-6 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configurações do Admin</h2>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-2xl mx-auto space-y-8">

                        <div className="bg-white dark:bg-[#1A2C22] rounded-3xl p-8 border border-gray-100 dark:border-[#28392e]">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Perfil do Administrador</h3>

                            {message && (
                                <div className={`p-4 rounded-xl mb-6 text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center gap-4 mb-8">
                                    <div className="relative group">
                                        <div className="size-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-800 shadow-lg bg-gray-200">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Admin Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                                                    <span className="material-symbols-outlined text-5xl">person</span>
                                                </div>
                                            )}
                                        </div>
                                        <label
                                            htmlFor="admin-avatar-upload"
                                            className="absolute bottom-0 right-0 bg-primary hover:bg-primary-hover text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110"
                                        >
                                            <span className="material-symbols-outlined text-sm block">edit</span>
                                            <input
                                                id="admin-avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleUpload}
                                                disabled={uploading}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    {uploading && <p className="text-xs text-primary font-bold animate-pulse">Enviando foto...</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nome de Exibição</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#111813] dark:text-white"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Título / Cargo</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#111813] dark:text-white"
                                        value={religiousName}
                                        onChange={e => setReligiousName(e.target.value)}
                                        placeholder="Ex: Pai de Santo"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving || uploading}
                                        className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
                                    >
                                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminSettings;
