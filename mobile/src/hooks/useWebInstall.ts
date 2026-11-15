import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface WebInstallState {
  /** Only true in a browser (not in native Android/iOS/Expo Go). */
  isWeb: boolean;
  /** True when the app is running as an installed standalone PWA. */
  isStandalone: boolean;
  /** Exposed when the browser fires beforeinstallprompt (Chrome/Android). */
  canPromptInstall: boolean;
  /** Trigger the native install prompt; resolves when dismissed. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable' | 'installed'>;
}

/**
 * Browser-only install detection for the NKfy PWA.
 * Detects standalone mode and the beforeinstallprompt event so we can hide
 * the "Install / Download app" call-to-action once the app is installed.
 */
export function useWebInstall(): WebInstallState {
  const isWeb = Platform.OS === 'web';
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;

    const computeStandalone = () => {
      const standalone =
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (window.navigator as any).standalone === true;
      setIsStandalone(Boolean(standalone));
    };
    computeStandalone();

    const onBeforeInstallPrompt = (event: any) => {
      event.preventDefault?.();
      setDeferredPrompt(event);
    };
    const onAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', onAppInstalled as any);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', onAppInstalled as any);
    };
  }, [isWeb]);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable' | 'installed'> => {
    if (!isWeb || typeof window === 'undefined') return 'unavailable';
    if (isStandalone) return 'installed';
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt?.();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
      } catch {
        return 'unavailable';
      }
    }
    return 'unavailable';
  };

  return {
    isWeb,
    isStandalone,
    canPromptInstall: Boolean(deferredPrompt),
    promptInstall,
  };
}
