import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MemberSettings: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [religiousName, setReligiousName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const email = localStorage.getItem('userEmail');
            if (!email) {
                setMessage({ type: 'error', text: 'Sessão inválida. Por favor faça login novamente.' });
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('members')
                .select('full_name, religious_name, avatar_url')
                .eq('email', email)
                .single();

            if (error) throw error;

            if (data) {
                setFullName(data.full_name);
                setReligiousName(data.religious_name || '');
                setAvatarUrl(data.avatar_url);
            }

        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Você deve selecionar uma imagem para fazer upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
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
            const email = localStorage.getItem('userEmail');
            if (!email) throw new Error("No user email");

            const { error } = await supabase
                .from('members')
                .update({
                    full_name: fullName,
                    religious_name: religiousName,
                    avatar_url: avatarUrl
                })
                .eq('email', email);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao salvar alterações.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando seus dados...</div>;

    return (
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-border-dark max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Meus Dados</h2>

            {message && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">

                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-[#28392e] shadow-lg bg-gray-200">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#1A2C22] text-gray-400">
                                    <span className="material-symbols-outlined text-5xl">person</span>
                                </div>
                            )}
                        </div>
                        <label
                            htmlFor="avatar-upload"
                            className="absolute bottom-0 right-0 bg-primary hover:bg-primary-hover text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110"
                        >
                            <span className="material-symbols-outlined text-sm block">edit</span>
                            <input
                                id="avatar-upload"
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
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#9db9a6] mb-2">
                        Nome Civil
                    </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-4 text-sm dark:text-white dark:bg-[#1A2C22] focus:ring-primary focus:border-primary"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#9db9a6] mb-2">
                        Nome de Santo (Orixá/Entidade)
                    </label>
                    <input
                        type="text"
                        value={religiousName}
                        onChange={(e) => setReligiousName(e.target.value)}
                        placeholder="Ex: Ogum Beira Mar / Doçu"
                        className="w-full rounded-xl border-gray-200 dark:border-border-dark p-4 text-sm dark:text-white dark:bg-[#1A2C22] focus:ring-primary focus:border-primary"
                    />
                    <p className="text-xs text-gray-400 mt-2">Como você é chamado na casa.</p>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving || uploading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MemberSettings;
