import { useEffect, useState, useCallback, useRef } from 'react';
import { useFranchiseStore } from '../store/franchiseStore';
import { fetchApi } from '../lib/api';
import { NotificationPermissionManager } from '../lib/NotificationPermissionManager';
import { SoundAlertEngine } from '../lib/SoundAlertEngine';
import { Bell, Volume2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export default function FranchisePushNotificationManager() {
  const { session, user } = useFranchiseStore();
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const isRegisteredRef = useRef(false);

  // 1. Create Native Notification Channels on Android / iOS
  const createChannels = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await PushNotifications.createChannel({
        id: 'olive_franchise_alerts',
        name: 'Franchise Alerts',
        description: 'Urgent alerts for franchise operations, branch milestones, and order alerts.',
        importance: 5,
        visibility: 1,
        vibration: true,
        sound: 'order_alert',
      });
      await PushNotifications.createChannel({
        id: 'olive_system',
        name: 'System Announcements',
        description: 'System-wide announcements and operational updates.',
        importance: 4,
        visibility: 1,
        vibration: true,
        sound: 'system_alert',
      });
    } catch (e) {
      console.warn('[Franchise PushManager] Channel creation notice:', e);
    }
  }, []);

  // 2. Token Registration across Platforms
  const registerToken = useCallback(async () => {
    if (isRegisteredRef.current) return;
    const franchiseId = session?.franchiseId || localStorage.getItem('franchise_id') || 'fra_primary';

    try {
      // Electron Desktop App
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        await fetchApi('/api/notifications/token', {
          method: 'POST',
          body: JSON.stringify({
            token: `franchise_desktop_${franchiseId}`,
            platform: 'electron',
            browser: 'electron',
            deviceName: `Franchise Management Desktop`,
            appName: 'franchise',
            role: 'franchise',
            franchiseId
          })
        });
        isRegisteredRef.current = true;
        return;
      }

      // Native Capacitor on Android / iOS
      if (Capacitor.isNativePlatform()) {
        await createChannels();

        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt' || permStatus.receive === ('prompt-with-rationale' as any)) {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
          console.warn('[Franchise PushManager] Native push permission not granted');
          return;
        }

        await PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', async (pushToken) => {
          if (pushToken.value) {
            await fetchApi('/api/notifications/token', {
              method: 'POST',
              body: JSON.stringify({
                token: pushToken.value,
                platform: Capacitor.getPlatform(),
                deviceName: `${Capacitor.getPlatform().toUpperCase()} Franchise Console`,
                appName: 'franchise',
                role: 'franchise',
                franchiseId
              })
            }).catch(() => {});
            isRegisteredRef.current = true;
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('[Franchise PushManager] Registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Franchise PushManager] Push received in foreground:', notification);
          SoundAlertEngine.playSound('new_order');
        });

        await PushNotifications.register();
        return;
      }

      // Web Push via Service Worker & Firebase Messaging
      if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => null);
        const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
        const { app } = await import('../lib/firebase');
        const supported = await isSupported().catch(() => false);
        if (supported) {
          const messaging = getMessaging(app);
          const currentToken = await getToken(messaging, {
            vapidKey: 'BDfxvZSqSw6Es3dvXz4VZMwjNFKMCCfRSgdCVty3rfqqBZ6AAWFlZ2EwWQR8ltp6DRMTUKOmH9Rlu0fjCziOKDk',
            serviceWorkerRegistration: swReg || undefined
          }).catch(() => null);

          if (currentToken) {
            await fetchApi('/api/notifications/token', {
              method: 'POST',
              body: JSON.stringify({
                token: currentToken,
                platform: 'web',
                browser: navigator.userAgent,
                deviceName: navigator.platform || 'Web Franchise Console',
                appName: 'franchise',
                role: 'franchise',
                franchiseId
              })
            });
            isRegisteredRef.current = true;
          }
        }
      }
    } catch (err: any) {
      console.warn('[Franchise PushManager] Token registration warning:', err.message);
    }
  }, [session, createChannels]);

  // 3. Evaluate Permission State on Mount / Session Change
  useEffect(() => {
    if (!session && !user) return;

    NotificationPermissionManager.checkPermission().then((info) => {
      if (info.state === 'NOT_DETERMINED') {
        setShowPromptBanner(true);
      } else if (info.state === 'GRANTED') {
        registerToken();
      }
    });
  }, [session, user, registerToken]);

  // 4. BroadcastChannel listener for background SW notifications
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('olive_pizza_notifications');
    channel.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === 'START_ALERT' || data.type === 'NEW_NOTIFICATION') {
        SoundAlertEngine.playSound('new_order');
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  const handleEnablePermission = async () => {
    SoundAlertEngine.unlockAudio();
    SoundAlertEngine.playSound('test');
    const res = await NotificationPermissionManager.requestPermission();
    setShowPromptBanner(false);

    if (res.state === 'GRANTED') {
      toast.success('Franchise operational alerts & chimes enabled!');
      await registerToken();
    } else if (res.state === 'BLOCKED') {
      toast.error('Notifications blocked by browser. Please enable them in browser settings.');
    }
  };

  return (
    <>
      {showPromptBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-4 shadow-2xl shadow-emerald-500/10 text-white animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-300">Enable Franchise Alerts</h4>
                <button 
                  onClick={() => setShowPromptBanner(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Allow notifications and chimes so you are instantly informed of new branch orders and status updates.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleEnablePermission}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Enable Alerts
                </button>
                <button
                  onClick={() => setShowPromptBanner(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
