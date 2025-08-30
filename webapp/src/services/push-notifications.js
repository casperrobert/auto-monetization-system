import ApiService from './api';

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }

  async initialize() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    // Register service worker
    this.registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');

    // Get VAPID public key
    const { publicKey } = await ApiService.request('/api/push/vapid-key');
    this.vapidPublicKey = publicKey;

    return this.registration;
  }

  async requestPermission() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
    return permission;
  }

  async subscribe() {
    if (!this.registration) {
      await this.initialize();
    }

    await this.requestPermission();

    // Subscribe to push notifications
    this.subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
    });

    // Send subscription to server
    await ApiService.request('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription: this.subscription })
    });

    console.log('Push notification subscription successful');
    return this.subscription;
  }

  async unsubscribe() {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      await ApiService.request('/api/push/unsubscribe', { method: 'POST' });
      this.subscription = null;
      console.log('Push notification unsubscribed');
    }
  }

  async testNotification() {
    try {
      await ApiService.request('/api/push/test', { method: 'POST' });
      console.log('Test notification sent');
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async getSubscriptionStatus() {
    if (!this.registration) {
      return { subscribed: false, supported: this.isSupported() };
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return {
      subscribed: !!subscription,
      supported: this.isSupported(),
      permission: Notification.permission
    };
  }
}

export default new PushNotificationService();