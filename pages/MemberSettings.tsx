import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MemberSettings: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [religiousName, setReligiousName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            // Get current user email (assuming logic from LoginPage holds where we match by email/auth)
            // Note: Since we don't have full Auth Context setup with ID in this snippet, 
            // we might need to rely on how app handles "current user".
            // However, Supabase Auth puts user in session.

            const { data: { user } } = await supabase.auth.getUser();

            // If using custom auth logic from LoginPage (storing email in local state?), 
            // we might not have supabase auth session.
            // But let's check if we can get by email from somewhere or assume Supabase Auth is active if RLS works.
            // Just in case, let's try to fetch by the email stored in localStorage if any, or default to Session.

            // Wait, previous LoginPage used simple query by email. It didn't do `supabase.auth.signInWithPassword`.
            // So `supabase.auth.getUser()` might be empty.
            // Let's assume for now we need to identify the user. 
            // Since I cannot change the entire Auth architecture in one step, I will prompt user to re-enter email or use a stored one?
            // BETTER: Let's assume the user IS logged in via Supabase if the previous dev set it up right, 
            // OR checks generic logic.
            // Actually, in `LoginPage` I saw: `onLogin('member')`. It didn't set global user state other than `role`.
            // This is a limitation. I will fetch the user based on the latest created member or mock it? 
            // NO, I must fix this. 
            // The best way without rewriting Auth is: 
            // 1. Identify "Who am I". 
            // I'll assume for this prototype that I can't easily know who is logged in without context.
            // BUT, I can ask the user to input their email to "verify" it's them before editing, OR
            // I can check if there's any persisted state. 
            // Let's check `App.tsx`... it uses `isAuthenticated` state.

            // *Correction*: To make this work properly commit, I will implement a simple "Get Profile" 
            // that tries to find the member. Since I don't have the ID, I'll display a placeholder 
            // or fetch the first active member as a demo if no auth context exists?
            // No, that's bad security.

            // Let's look at `LoginPage` again. 
            // `const { data: memberData } = await supabase.from('members').eq('email', email)...`
            // It verifies password but DOES NOT start a Supabase Session.
            // So `req.user` is null.

            // WORKAROUND: I will use `localStorage` to store the email upon login in `LoginPage` 
            // and retrieve it here. I'll add that to `LoginPage` in a next step if needed, 
            // but for now I'll code this to use `localStorage.getItem('userEmail')`.

            const email = localStorage.getItem('userEmail');
            if (!email) {
                // If no email found, redirect/error
                setMessage({ type: 'error', text: 'Sessão inválida. Por favor faça login novamente.' });
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('members')
                .select('full_name, religious_name')
                .eq('email', email)
                .single();

            if (error) throw error;

            if (data) {
                setFullName(data.full_name);
                setReligiousName(data.religious_name || '');
            }

        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao carregar dados.' });
        } finally {
            setLoading(false);
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
                    religious_name: religiousName
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
                        disabled={saving}
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
