import { useEffect } from 'react';
import { WsMessage } from './useWebSocket';

interface UseAppLifecycleOptions {
  sendWsMessage: (message: WsMessage) => void;
}

/**
 * Hook per gestire il lifecycle dell'app (focus/blur)
 * Invia messaggi WebSocket quando l'app va in background o torna in foreground
 */
export function useAppLifecycle({ sendWsMessage }: UseAppLifecycleOptions) {
  useEffect(() => {
    const handleFocus = () => {
      console.log('🟢 [App] Window focused - tornato online');
      sendWsMessage({ type: 'user_online', user_id: '' });
    };

    const handleBlur = () => {
      console.log('😴 [App] Window blurred - stato away');
      sendWsMessage({ type: 'user_away', user_id: '' });
    };

    // Aggiungi listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [sendWsMessage]);
}
