import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../constants';
import { supabase } from '../lib/supabase';

interface HouseSettings {
  address: string;
  google_maps_iframe: string;
  transport_image_url: string | null;
}

const LandingPage: React.FC = () => {
  const [publicEvents, setPublicEvents] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [settings, setSettings] = useState<HouseSettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Events
    const today = new Date().toISOString().split('T')[0];
    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('is_public', true)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(4);
    if (events) setPublicEvents(events);

    // Settings
    const { data: setts } = await supabase.from('app_settings').select('*').limit(1).single();
    if (setts) setSettings(setts);

    // Gallery
    const { data: photos } = await supabase.from('gallery_photos').select('*').order('created_at', { ascending: false }).limit(30);
    if (photos) setGallery(photos);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-white/10 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-20 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[32px]">forest</span>
            <h2 className="text-xl font-black tracking-tight text-white font-serif italic">Casa de Oxóssi</h2>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <a href="#inicio" className="text-sm font-bold text-white hover:text-primary transition-colors">Início</a>
            <a href="#giras" className="text-sm font-bold text-white hover:text-primary transition-colors">Giras</a>
            <a href="#galeria" className="text-sm font-bold text-white hover:text-primary transition-colors">A Casa</a>
            <a href="#localizacao" className="text-sm font-bold text-white hover:text-primary transition-colors">Localização</a>
          </nav>
          <Link
            to="/login"
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20"
          >
            Portal Filhos
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section
          id="inicio"
          className="relative h-[80vh] min-h-[600px] flex items-center justify-center text-center p-8 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${IMAGES.HERO}')` }}
        >
          <div className="max-w-3xl space-y-8 animate-fade-in">
            <span className="inline-block px-4 py-1 rounded-full border border-primary/40 text-primary text-[10px] font-bold uppercase tracking-widest bg-black/20 backdrop-blur-sm">
              Okê Arô, Oxóssi!
            </span>
            <h1 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight font-serif italic">
              Sinta o Axé da Floresta
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
              Um porto seguro de caridade, luz e cura espiritual sob a proteção do grande caçador das almas.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#giras" className="bg-primary hover:bg-primary-hover text-white h-14 px-10 flex items-center justify-center rounded-xl font-black text-base transition-all transform hover:scale-105 shadow-xl shadow-primary/20">
                Próximas Giras
              </a>
              <a href="#localizacao" className="bg-white/10 backdrop-blur-md text-white border border-white/20 h-14 px-10 flex items-center justify-center rounded-xl font-black text-base hover:bg-white/20 transition-all">
                Como Chegar
              </a>
            </div>

            {/* Helper text for mini map if requested by user, but keeping the section below is better */}
          </div>
        </section>

        {/* Dynamic Agenda Section */}
        {publicEvents.length > 0 && (
          <section id="giras" className="py-24 bg-[#0B1610] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-primary text-[10px] font-bold uppercase tracking-[0.3em]">Agenda Aberta</span>
                <h2 className="text-4xl font-serif font-black text-white leading-tight italic mt-2 mb-4">Próximas Giras e Eventos</h2>
                <p className="text-[#9db9a6]">Participe de nossos encontros abertos à comunidade. Todos são bem-vindos para receber o axé.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {publicEvents.map(event => (
                  <div key={event.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9db9a6]">
                          {new Date(event.event_date).toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </p>
                        <p className="text-white font-bold text-lg leading-none">
                          {new Date(event.event_date).getDate()} {new Date(event.event_date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                        </p>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                    <p className="text-sm text-[#9db9a6] line-clamp-3">{event.description || 'Evento aberto ao público.'}</p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-bold text-primary">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {event.event_time.slice(0, 5)}h
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {gallery.length > 0 && (
          <section id="galeria" className="py-24 bg-white dark:bg-background-dark">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-primary text-[10px] font-bold uppercase tracking-[0.3em]">Nossa Casa</span>
                <h2 className="text-4xl font-serif font-black text-gray-900 dark:text-white leading-tight italic mt-2 mb-4">Um Lugar de Paz</h2>
                <p className="text-gray-500 dark:text-gray-400">Conheça um pouco do nosso espaço sagrado.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.map((photo, index) => (
                  <div key={photo.id} className={`rounded-xl overflow-hidden shadow-lg bg-gray-100 dark:bg-white/5 relative group ${index === 0 ? 'col-span-2 row-span-2' : ''}`}>
                    <img src={photo.url} alt="Galeria" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Location Section */}
        {(settings?.google_maps_iframe || settings?.address) && (
          <section id="localizacao" className="py-24 bg-gray-50 dark:bg-[#0f1f15] border-t border-gray-200 dark:border-white/5">
            <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-8">
                <div>
                  <span className="text-primary text-[10px] font-bold uppercase tracking-[0.3em]">Localização</span>
                  <h2 className="text-4xl font-serif font-black text-gray-900 dark:text-white leading-tight italic mt-2 mb-4">Como Chegar</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 font-medium mb-2">{settings.address}</p>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Venha conhecer nossa casa e sentir a energia de perto. Estamos de portas abertas para lhe receber.</p>
                </div>

                {settings.transport_image_url && (
                  <div
                    className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSettings(prev => prev ? { ...prev, _showTransportZoom: true } as any : null)}
                  >
                    <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined">directions_bus</span> Transporte Público
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full ml-auto">Clique para ampliar</span>
                    </h4>
                    <img src={settings.transport_image_url} alt="Horários de Ônibus" className="rounded-xl w-full border border-gray-100 dark:border-white/5" />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col items-center justify-center text-center gap-2 hover:border-primary/50 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">map</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">Abrir no Maps</span>
                  </a>
                </div>
              </div>

              <div className="h-[500px] w-full bg-gray-200 dark:bg-surface-dark rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-white/5 relative">
                {settings.google_maps_iframe && settings.google_maps_iframe.includes('<iframe') ? (
                  <div dangerouslySetInnerHTML={{ __html: settings.google_maps_iframe.replace('width="600"', 'width="100%"').replace('height="450"', 'height="100%"') }} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4 p-8 text-center bg-gray-100 dark:bg-white/5">
                    <span className="material-symbols-outlined text-6xl text-primary/50">map</span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white mb-2">Ver localização no mapa</p>
                      <a
                        href={settings.google_maps_iframe && !settings.google_maps_iframe.includes('<iframe') ? settings.google_maps_iframe : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Clique para abrir o Google Maps
                      </a>
                    </div>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                  Casa de Oxóssi
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-accent-brown dark:bg-[#0B1610] text-white py-16 px-6 border-t-[6px] border-primary">
        <div className="max-w-[1200px] mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-primary text-[40px]">forest</span>
            <h2 className="text-3xl font-black font-serif italic">Casa de Oxóssi</h2>
          </div>
          <p className="max-w-2xl mx-auto text-white/70 text-sm leading-relaxed italic">
            "Nas matas de Oxóssi a flecha é certeira, o axé é de lei e a caridade é a bandeira."
          </p>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
            <p>© 2024 Casa de Oxóssi. Todos os direitos reservados.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-primary transition-colors">Instagram</a>
              <a href="#" className="hover:text-primary transition-colors">Facebook</a>
              <a href="#" className="hover:text-primary transition-colors">Youtube</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Transport Image Zoom Modal */}
      {(settings as any)?._showTransportZoom && settings?.transport_image_url && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSettings(prev => prev ? { ...prev, _showTransportZoom: false } as any : null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setSettings(prev => prev ? { ...prev, _showTransportZoom: false } as any : null)}
          >
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          <img
            src={settings.transport_image_url}
            alt="Horários de Ônibus Ampliado"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default LandingPage;
