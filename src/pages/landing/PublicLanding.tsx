import { useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const PAGE_EVENTS_TABLE = 'page_events';

function trackEvent(eventType: 'page_view' | 'button_click', label?: string) {
  if (!isSupabaseConfigured) return;

  supabase
    .from(PAGE_EVENTS_TABLE)
    .insert({ event_type: eventType, label: label || null })
    .then(({ error }) => {
      if (error) {
        console.error('[Landing Page] Erro ao registrar evento:', error);
      }
    });
}

const buttonItems = [
  { label: 'Agendar Demo', href: '#demo' },
  { label: 'Fale Conosco', href: '#contato' },
  { label: 'Ver Planos', href: '#planos' },
  { label: 'Baixar App', href: '#app' },
];

const PublicLanding = () => {
  useEffect(() => {
    trackEvent('page_view');
  }, []);

  const handleClick = useCallback((label: string) => {
    trackEvent('button_click', label);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black text-black tracking-tight">AXIUM</span>
          <nav className="hidden md:flex items-center gap-8">
            {buttonItems.map(item => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => handleClick(item.label)}
                className="text-sm font-medium text-neutral-600 hover:text-black transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/login"
              className="text-sm font-bold text-black hover:text-neutral-600 transition-colors"
            >
              Entrar
            </a>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-6xl md:text-7xl font-black text-black tracking-tighter leading-tight mb-6">
          Transforme seu negócio<br />com a <span className="text-neutral-400">Axium</span>
        </h1>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          A plataforma completa para gestão empresarial. CRM, financeiro, tarefas e muito mais
          em um só lugar.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {buttonItems.map(item => (
            <button
              key={item.label}
              onClick={() => handleClick(item.label)}
              className="px-8 py-4 bg-black text-white text-sm font-bold rounded-2xl hover:bg-neutral-800 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section id="demo" className="border-t border-neutral-100 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-black tracking-tight mb-4">Solicite uma Demonstração</h2>
          <p className="text-neutral-500 mb-8">Preencha o formulário e nossa equipe entrará em contato.</p>
          <div className="max-w-md mx-auto space-y-4">
            <input type="text" placeholder="Seu nome" className="w-full px-5 py-4 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-black transition-colors" />
            <input type="email" placeholder="Seu e-mail" className="w-full px-5 py-4 border border-neutral-200 rounded-2xl text-sm outline-none focus:border-black transition-colors" />
            <button
              onClick={() => handleClick('Enviar Demo')}
              className="w-full px-8 py-4 bg-black text-white text-sm font-bold rounded-2xl hover:bg-neutral-800 transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-neutral-400 font-medium">
          &copy; {new Date().getFullYear()} Axium. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;
