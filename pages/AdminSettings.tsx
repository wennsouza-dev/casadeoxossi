import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

const AdminSettings: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'house'>('profile');

    // Member Profile State
    const [fullName, setFullName] = useState('');
    const [religiousName, setReligiousName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // House Settings State
    const [address, setAddress] = useState('');
    const [mapsFrame, setMapsFrame] = useState('');
    const [transportUrl, setTransportUrl] = useState<string | null>(null);
    const [gallery, setGallery] = useState<{ id: string, url: string }[]>([]);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchUserData();
        if (activeTab === 'house') fetchHouseData();
    }, [activeTab]);

    const fetchUserData = async () => {
        try {
            const email = localStorage.getItem('userEmail');
            if (email) {
                const { data } = await supabase.from('members').select('*').eq('email', email).single();
                if (data) {
                    setFullName(data.full_name);
                    setReligiousName(data.religious_name || '');
                    setAvatarUrl(data.avatar_url);
                }
            }
        } catch (err) { console.error(err); }
    };

    const fetchHouseData = async () => {
        setLoading(true);
        // Fetch Settings (Singleton ideally, for now taking first)
        const { data: settings } = await supabase.from('app_settings').select('*').limit(1).single();
        if (settings) {
            setAddress(settings.address || '');
            setMapsFrame(settings.google_maps_iframe || '');
            setTransportUrl(settings.transport_image_url);
        }

        // Fetch Gallery
        const { data: photos } = await supabase.from('gallery_photos').select('*').order('created_at', { ascending: false });
        if (photos) setGallery(photos);

        setLoading(false);
    };

    // --- Profile Handlers ---
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const email = localStorage.getItem('userEmail');
        if (!email) return;

        // Check if member entry exists
        const { data: existingMember } = await supabase
            .from('members')
            .select('id')
            .eq('email', email)
            .single();

        let error;

        if (existingMember) {
            ({ error } = await supabase
                .from('members')
                .update({
                    full_name: fullName,
                    religious_name: religiousName,
                    avatar_url: avatarUrl
                })
                .eq('email', email));
        } else {
            // Create new member entry for Admin
            ({ error } = await supabase
                .from('members')
                .insert([{
                    email: email,
                    full_name: fullName,
                    religious_name: religiousName,
                    avatar_url: avatarUrl,
                    role: 'Administrador',
                    status: 'Ativo',
                    monthly_fee_status: 'Isento',
                    active: true,
                    created_at: new Date().toISOString()
                }]));
        }

        if (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Erro ao salvar.' });
        } else {
            setMessage({ type: 'success', text: 'Perfil atualizado!' });
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileName = `admin-avatar-${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('avatars').upload(fileName, file);
        if (!error) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setAvatarUrl(data.publicUrl);
        }
        setUploading(false);
    };

    // --- House Handlers ---
    const handleSaveHouse = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Upsert settings (ensure at least one row exists or update first)
        const { data: existing } = await supabase.from('app_settings').select('id').limit(1).single();

        let error;
        if (existing) {
            ({ error } = await supabase.from('app_settings').update({ address, google_maps_iframe: mapsFrame, transport_image_url: transportUrl }).eq('id', existing.id));
        } else {
            ({ error } = await supabase.from('app_settings').insert({ address, google_maps_iframe: mapsFrame, transport_image_url: transportUrl }));
        }

        if (error) setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
        else setMessage({ type: 'success', text: 'Configurações da Casa salvas!' });
    };

    const handleTransportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileName = `transport-${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('avatars').upload(fileName, file); // Using avatars bucket for simplicity or create 'assets'
        if (!error) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setTransportUrl(data.publicUrl);
        }
        setUploading(false);
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (gallery.length + e.target.files.length > 30) return alert('Limite de 30 fotos atingido.');

        setUploading(true);

        for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i];
            const fileName = `gallery-${Date.now()}-${i}.${file.name.split('.').pop()}`;
            const { error } = await supabase.storage.from('avatars').upload(fileName, file);
            if (!error) {
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
                await supabase.from('gallery_photos').insert({ url: publicUrl });
            }
        }

        fetchHouseData();
        setUploading(false);
    };

    const handleDeletePhoto = async (id: string) => {
        if (!confirm('Excluir foto?')) return;
        await supabase.from('gallery_photos').delete().eq('id', id);
        fetchHouseData();
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <Sidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 md:py-0 px-6 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] sticky top-0 z-10 w-full">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-white dark:hover:bg-white/10 shrink-0">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">Configurações</h2>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button onClick={() => setActiveTab('profile')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${activeTab === 'profile' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>Meu Perfil</button>
                        <button onClick={() => setActiveTab('house')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap ${activeTab === 'house' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>Casa de Oxóssi</button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {message && (
                            <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        {activeTab === 'profile' ? (
                            <div className="bg-white dark:bg-[#1A2C22] rounded-3xl p-8 border border-gray-100 dark:border-[#28392e]">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Perfil do Administrador</h3>
                                <form onSubmit={handleSaveProfile} className="space-y-6">
                                    <div className="flex flex-col items-center gap-4 mb-8">
                                        <div className="relative group">
                                            <div className="size-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-800 shadow-lg bg-gray-200">
                                                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400"><span className="material-symbols-outlined text-5xl">person</span></div>}
                                            </div>
                                            <label className="absolute bottom-0 right-0 bg-primary hover:bg-primary-hover text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                                                <span className="material-symbols-outlined text-sm block">edit</span>
                                                <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nome de Exibição</label>
                                        <input type="text" className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#111813] dark:text-white" value={fullName} onChange={e => setFullName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Título / Cargo</label>
                                        <input type="text" className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#111813] dark:text-white" value={religiousName} onChange={e => setReligiousName(e.target.value)} placeholder="Ex: Pai de Santo" />
                                    </div>
                                    <button type="submit" disabled={uploading} className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-70">Salvar Perfil</button>
                                </form>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="bg-white dark:bg-[#1A2C22] rounded-3xl p-8 border border-gray-100 dark:border-[#28392e]">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Informações da Casa</h3>
                                    <form onSubmit={handleSaveHouse} className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Endereço Completo</label>
                                            <input type="text" className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#111813] dark:text-white" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Google Maps (URL do Iframe)</label>
                                            <textarea className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:bg-[#111813] dark:text-white h-24" value={mapsFrame} onChange={e => setMapsFrame(e.target.value)} placeholder='<iframe src="..." ...></iframe>' />
                                            <p className="text-xs text-gray-400 mt-1">Copie o código de incorporação do Google Maps.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Infos de Transporte / Ônibus (Imagem)</label>
                                            <div className="flex items-center gap-4">
                                                {transportUrl && <img src={transportUrl} alt="Transporte" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />}
                                                <input type="file" accept="image/*" onChange={handleTransportUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={uploading} className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-70">Salvar Informações</button>
                                    </form>
                                </div>

                                <div className="bg-white dark:bg-[#1A2C22] rounded-3xl p-8 border border-gray-100 dark:border-[#28392e]">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Galeria do Barracão ({gallery.length}/30)</h3>
                                        <label className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-700 dark:text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">add_photo_alternate</span> Adicionar Fotos
                                            <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {gallery.map(photo => (
                                            <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                                                <img src={photo.url} alt="Galeria" className="w-full h-full object-cover" />
                                                <button onClick={() => handleDeletePhoto(photo.id)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                    <span className="material-symbols-outlined text-[14px] block">close</span>
                                                </button>
                                            </div>
                                        ))}
                                        {gallery.length === 0 && <p className="text-gray-400 text-sm col-span-4 text-center py-8">Nenhuma foto na galeria.</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminSettings;
