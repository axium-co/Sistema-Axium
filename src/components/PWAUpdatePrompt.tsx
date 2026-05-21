import { useEffect, useState, useCallback } from 'react';
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
        state.updateServiceWorker(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.needRefresh, state.updateServiceWorker]);

  if (state.offlineReady) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 duration-300">
        App pronto para uso offline
      </div>
    );
  }

  if (!state.needRefresh) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 max-w-[90vw]">
      <span className="whitespace-nowrap">Nova versão disponível</span>
      <button
        onClick={handleUpdate}
        className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-200 transition-colors shrink-0"
      >
        Atualizar agora
      </button>
    </div>
  );
};

export default PWAUpdatePrompt;
