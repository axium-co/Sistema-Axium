import { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PageEvent {
  id: string;
  event_type: 'page_view' | 'button_click';
  label: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface DayView {
  date: string;
  views: number;
}

const PAGE_EVENTS_TABLE = 'page_events';

function buildViewsByDay(events: PageEvent[], now: number): DayView[] {
  const grouped: Record<string, number> = {};
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  events
    .filter(e => e.event_type === 'page_view')
    .forEach(e => {
      const day = new Date(e.created_at).toISOString().slice(0, 10);
      if (new Date(day) >= thirtyDaysAgo) {
        grouped[day] = (grouped[day] || 0) + 1;
      }
    });

  const days: DayView[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    days.push({ date: label, views: grouped[key] || 0 });
  }
  return days;
}

const LandingAnalytics = () => {
  const [events, setEvents] = useState<PageEvent[] | null>(
    () => isSupabaseConfigured ? null : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const isLoading = events === null && !error;

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchEvents = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from(PAGE_EVENTS_TABLE)
          .select('*')
          .gte('created_at', new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setEvents(data || []);
      } catch (err) {
        console.error('[Landing Analytics] Erro ao buscar eventos:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      }
    };

    fetchEvents();

    const channel = supabase
      .channel('page_events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: PAGE_EVENTS_TABLE },
        (payload) => {
          setEvents(prev => {
            if (!prev) return prev;
            const incoming = payload.new as PageEvent;
            if (prev.some(e => e.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [now]);

  const totalViews = useMemo(
    () => (events ?? []).filter(e => e.event_type === 'page_view').length,
    [events],
  );

  const clickEvents: PageEvent[] = useMemo(
    () => (events ?? [])
      .filter(e => e.event_type === 'button_click')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [events],
  );

  const totalClicks = useMemo(
    () => clickEvents.length,
    [clickEvents],
  );

  const uniqueButtons = useMemo(
    () => new Set(clickEvents.filter(e => e.label).map(e => e.label)).size,
    [clickEvents],
  );

  const viewsByDay: DayView[] = useMemo(
    () => buildViewsByDay(events ?? [], now),
    [events, now],
  );

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-4xl font-black text-black tracking-tighter mb-2">Landing Page</h1>
        <p className="text-neutral-500 text-sm font-medium mb-6">Analytics de eventos da landing page.</p>
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">{error}</div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="p-6">
        <h1 className="text-4xl font-black text-black tracking-tighter mb-2">Landing Page</h1>
        <p className="text-neutral-500 text-sm font-medium mb-6">Analytics de eventos da landing page.</p>
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-yellow-700 text-sm font-medium">
          Supabase não configurado. Configure as variáveis de ambiente para visualizar os dados.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-4xl font-black text-black tracking-tighter mb-2">Landing Page</h1>
        <p className="text-neutral-500 text-sm font-medium">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 min-h-screen">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter mb-1">Landing Page</h1>
          <p className="text-neutral-500 text-sm font-medium">Analytics de eventos da landing page — atualizado em tempo real.</p>
        </div>
        <a
          href={import.meta.env.VITE_LANDING_URL || 'https://axiumcompany.com.br/'}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition-colors shrink-0"
        >
          Visitar Landing Page
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Visualizações</p>
          <p className="text-5xl font-black text-black">{totalViews}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-3xl p-8">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Total de Cliques</p>
          <p className="text-5xl font-black text-black">{totalClicks}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-3xl p-8">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Botões únicos</p>
          <p className="text-5xl font-black text-black">{uniqueButtons}</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl p-8">
        <h2 className="font-black text-black text-lg tracking-tight mb-6">Visualizações por dia (últimos 30 dias)</h2>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={viewsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#a3a3a3' }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#a3a3a3' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e5e5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="views" fill="#000" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl p-8">
        <h2 className="font-black text-black text-lg tracking-tight mb-6">Cliques (cronológico)</h2>
        {clickEvents.length === 0 ? (
          <p className="text-neutral-400 text-sm font-medium">Nenhum clique registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {clickEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-black">{event.label || '—'}</span>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {new Date(event.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingAnalytics;
