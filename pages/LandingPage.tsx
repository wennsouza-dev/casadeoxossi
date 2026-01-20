import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../constants';
import { supabase } from '../lib/supabase';

const LandingPage: React.FC = () => {
  const [publicEvents, setPublicEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchPublicEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('is_public', true)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(4);

      if (data) setPublicEvents(data);
    };
    fetchPublicEvents();
  }, []);
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
            <a href="#sobre" className="text-sm font-bold text-white hover:text-primary transition-colors">Sobre</a>
            <a href="#giras" className="text-sm font-bold text-white hover:text-primary transition-colors">Giras</a>
            <a href="#contato" className="text-sm font-bold text-white hover:text-primary transition-colors">Localização</a>
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
              <a href="#contato" className="bg-white/10 backdrop-blur-md text-white border border-white/20 h-14 px-10 flex items-center justify-center rounded-xl font-black text-base hover:bg-white/20 transition-all">
                Como Chegar
              </a>
            </div>
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

        <section id="sobre" className="py-24 bg-white dark:bg-background-dark">
          <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="relative group rounded-3xl overflow-hidden shadow-2xl">
              <img src={IMAGES.ALTAR} alt="Altar sagrado" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
            <div className="space-y-6">
              <h3 className="text-primary text-[10px] font-bold uppercase tracking-[0.3em]">Nossa Missão</h3>
              <h2 className="text-4xl font-serif font-black dark:text-white leading-tight italic">O Sagrado Axé de Oxóssi em cada atendimento.</h2>
              <p className="text-gray-500 dark:text-[#9db9a6] text-lg leading-relaxed">
                Nossa casa é um templo dedicado à prática da Umbanda, focada no auxílio espiritual, caridade e na manutenção das tradições ancestrais sob a regência de Pai Oxóssi.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <span className="material-symbols-outlined text-primary mb-2">volunteer_activism</span>
                  <p className="text-sm font-bold dark:text-white">Caridade Gratuita</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <span className="material-symbols-outlined text-primary mb-2">forest</span>
                  <p className="text-sm font-bold dark:text-white">Respeito à Natureza</p>
                </div>
              </div>
            </div>
          </div>
        </section>
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
    </div>
  );
};

export default LandingPage;
