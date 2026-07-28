import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { RegisterSWOptions } from 'virtual:pwa-register';

type SWRegistration = {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
};

const PWAUpdatePrompt = () => {
  const [state, setState] = useState<SWRegistration>({
    needRefresh: false,
    offlineReady: false,
    updateServiceWorker: async () => {},
  });

  useEffect(() => {
    let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

    async function register() {
      const { registerSW } = await import('virtual:pwa-register');

      updateSW = registerSW({
        onNeedRefresh() {
          setState((prev) => ({ ...prev, needRefresh: true }));
        },
        onOfflineReady() {
          setState((prev) => ({ ...prev, offlineReady: true }));
          setTimeout(() => {
            setState((prev) => ({ ...prev, offlineReady: false }));
          }, 4000);
        },
      } as RegisterSWOptions);

      setState((prev) => ({
        ...prev,
        updateServiceWorker: (reload) => updateSW?.(reload) ?? Promise.resolve(),
      }));
    }

    register();

    return () => {
      updateSW = null;
    };
  }, []);

  const handleUpdate = useCallback(() => {
    state.updateServiceWorker(true);
  }, [state.updateServiceWorker]);

  useEffect(() => {
    if (state.needRefresh) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, needRefresh: false }));
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [state.needRefresh]);

  if (state.offlineReady) {
    return (
      <div className="fixed bottom-24 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 backdrop-blur-sm" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        App pronto para uso offline
      </div>
    );
  }

  if (!state.needRefresh) return null;

  return (
    <div className="fixed bottom-24 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-black/90 backdrop-blur-lg text-white px-4 md:px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 md:gap-3 text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 max-w-[90vw]" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <span className="whitespace-nowrap text-xs md:text-sm">Nova versão disponível</span>
      <button
        onClick={handleUpdate}
        className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-200 transition-colors shrink-0"
      >
        Atualizar
      </button>
      <button
        onClick={() => setState(prev => ({ ...prev, needRefresh: false }))}
        className="text-neutral-400 hover:text-white transition-colors shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
        title="Dispensar"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default PWAUpdatePrompt;
