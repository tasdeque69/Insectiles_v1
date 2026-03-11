type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
};

type AnalyticsConfig = {
  endpoint: string;
  enabled: boolean;
};

class Analytics {
  private events: AnalyticsEvent[] = [];
  private config: AnalyticsConfig;
  private sessionId: string;
  private initialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.config = {
      endpoint: '/api/analytics',
      enabled: import.meta.env.DEV === false,
    };
  }

  private generateSessionId(): string {
    const stored = localStorage.getItem('insectiles_session');
    if (stored) return stored;
    const newId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('insectiles_session', newId);
    return newId;
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.track('session_start', { session_id: this.sessionId });
    this.flush();
  }

  track(eventName: string, properties?: Record<string, string | number | boolean>): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        session_id: this.sessionId,
      },
      timestamp: Date.now(),
    };

    this.events.push(event);

    if (this.events.length >= 10) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
        keepalive: true,
      });
    } catch {
      this.events = [...eventsToSend, ...this.events];
    }
  }

  trackGameStart(level: number): void {
    this.track('game_start', { level });
  }

  trackGameEnd(score: number, level: number, duration: number): void {
    this.track('game_end', { score, level, duration });
  }

  trackMatch(insectType: string, combo: number): void {
    this.track('match', { insect_type: insectType, combo });
  }

  trackPowerUp(type: string, effect: string): void {
    this.track('power_up', { type, effect });
  }

  trackError(errorType: string, message: string): void {
    this.track('error', { error_type: errorType, message });
  }

  trackMenuAction(action: string): void {
    this.track('menu_action', { action });
  }

  trackSettingsChange(setting: string, value: string | number | boolean): void {
    this.track('settings_change', { setting, value });
  }
}

export const analytics = new Analytics();
