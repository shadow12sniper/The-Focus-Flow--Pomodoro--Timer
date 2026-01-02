
import { Injectable, signal, computed, effect } from '@angular/core';

// Declare chrome API for extension support
declare const chrome: any;

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
  goal: number;
  autoStart: boolean;
  metronome: boolean;
}

export interface SessionRecord {
  id: string;
  mode: TimerMode;
  timestamp: number;
  durationMinutes: number;
}

export const PRESET_SITES = [
  { name: 'YouTube', domain: 'youtube.com', icon: 'fa-brands fa-youtube', color: 'text-red-500' },
  { name: 'TikTok', domain: 'tiktok.com', icon: 'fa-brands fa-tiktok', color: 'text-pink-400' },
  { name: 'Instagram', domain: 'instagram.com', icon: 'fa-brands fa-instagram', color: 'text-pink-500' },
  { name: 'Facebook', domain: 'facebook.com', icon: 'fa-brands fa-facebook', color: 'text-blue-500' },
  { name: 'X / Twitter', domain: 'twitter.com', icon: 'fa-brands fa-x-twitter', color: 'text-slate-100' },
  { name: 'Reddit', domain: 'reddit.com', icon: 'fa-brands fa-reddit', color: 'text-orange-500' },
  { name: 'Netflix', domain: 'netflix.com', icon: 'fa-solid fa-film', color: 'text-red-600' },
  { name: 'Twitch', domain: 'twitch.tv', icon: 'fa-brands fa-twitch', color: 'text-purple-400' },
  { name: 'Discord', domain: 'discord.com', icon: 'fa-brands fa-discord', color: 'text-indigo-400' },
  { name: 'Pinterest', domain: 'pinterest.com', icon: 'fa-brands fa-pinterest', color: 'text-red-500' },
  { name: 'Amazon', domain: 'amazon.com', icon: 'fa-brands fa-amazon', color: 'text-amber-500' },
  { name: 'LinkedIn', domain: 'linkedin.com', icon: 'fa-brands fa-linkedin', color: 'text-blue-400' }
];

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private readonly STORAGE_KEY = 'focusflow_settings';
  private readonly HISTORY_KEY = 'focusflow_history';
  private readonly BLOCKED_SITES_KEY = 'focusflow_blocked_sites';

  // State
  settings = signal<TimerSettings>({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    goal: 8,
    autoStart: false,
    metronome: false
  });

  blockedSites = signal<string[]>([
    'youtube.com',
    'tiktok.com',
    'twitter.com',
    'instagram.com',
    'facebook.com',
    'reddit.com',
    'netflix.com'
  ]);

  mode = signal<TimerMode>('work');
  isRunning = signal<boolean>(false);
  timeLeft = signal<number>(25 * 60);
  history = signal<SessionRecord[]>([]);

  // Computed
  totalSeconds = computed(() => {
    const s = this.settings();
    const m = this.mode();
    if (m === 'work') return s.work * 60;
    if (m === 'shortBreak') return s.shortBreak * 60;
    return s.longBreak * 60;
  });

  progress = computed(() => {
    const total = this.totalSeconds();
    if (total === 0) return 0;
    return Math.min(1, this.timeLeft() / total);
  });

  sessionsCompletedToday = computed(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return this.history().filter(s => s.mode === 'work' && new Date(s.timestamp).setHours(0, 0, 0, 0) === today).length;
  });

  isBlockingActive = computed(() => {
    return this.mode() === 'work' && this.isRunning();
  });

  private timerInterval: any = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.loadState();
    
    // Sync Title Effect
    effect(() => {
      const minutes = Math.floor(this.timeLeft() / 60);
      const seconds = this.timeLeft() % 60;
      const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      const modeLabel = this.mode() === 'work' ? 'Focus' : 'Break';
      const blockedPrefix = this.isBlockingActive() ? '🛡️ ' : '';
      document.title = `${blockedPrefix}${display} - ${modeLabel}`;
    });

    // Handle session end
    effect(() => {
      if (this.timeLeft() === 0 && this.isRunning()) {
        this.handleSessionComplete();
      }
    });

    // Extension Sync Effect
    effect(() => {
      this.syncExtensionState();
    });
  }

  toggle() {
    if (this.isRunning()) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  pause() {
    this.isRunning.set(false);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  reset() {
    this.pause();
    this.timeLeft.set(this.totalSeconds());
  }

  addTime(minutes: number) {
    this.timeLeft.update(t => t + (minutes * 60));
  }

  setMode(newMode: TimerMode) {
    this.pause();
    this.mode.set(newMode);
    this.timeLeft.set(this.totalSeconds());
  }

  updateSettings(newSettings: Partial<TimerSettings>) {
    this.settings.update(s => ({ ...s, ...newSettings }));
    this.saveSettings();
    if (!this.isRunning()) {
      this.timeLeft.set(this.totalSeconds());
    }
  }

  toggleSite(site: string) {
    const clean = site.trim().toLowerCase();
    if (this.blockedSites().includes(clean)) {
      this.removeBlockedSite(clean);
    } else {
      this.addBlockedSite(clean);
    }
  }

  addBlockedSite(site: string) {
    // Simple URL cleanup
    const clean = site.trim().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
    if (clean && !this.blockedSites().includes(clean)) {
      this.blockedSites.update(sites => [...sites, clean]);
      this.saveBlockedSites();
    }
  }

  removeBlockedSite(site: string) {
    this.blockedSites.update(sites => sites.filter(s => s !== site));
    this.saveBlockedSites();
  }

  private tick() {
    if (this.timeLeft() > 0) {
      this.timeLeft.update(t => t - 1);
      if (this.settings().metronome) {
        this.playTick();
      }
    }
  }

  private handleSessionComplete() {
    this.pause();
    this.playDing();
    this.sendNotification();

    if (this.mode() === 'work') {
      const record: SessionRecord = {
        id: crypto.randomUUID(),
        mode: 'work',
        timestamp: Date.now(),
        durationMinutes: this.settings().work
      };
      this.history.update(h => [record, ...h].slice(0, 50));
      this.saveHistory();
    }
  }

  // --- Extension Communication ---

  private syncExtensionState() {
    // Check if running in extension context
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;
    
    if (!isExtension) return;

    // We only block if we are in 'work' mode and the timer is running
    const shouldBlock = this.isBlockingActive();
    const sites = this.blockedSites();

    const payload = {
      type: 'SYNC_BLOCKING_STATE',
      isBlocking: shouldBlock,
      sites: sites
    };

    try {
      chrome.runtime.sendMessage(payload).catch(() => {
        // Ignore errors if background script is not ready or context invalidated
      });
    } catch (e) {
      console.warn('Failed to sync with extension background:', e);
    }
  }

  // --- Audio & Utils ---

  private playTick() {
    this.playTone(800, 0.01, 0.1);
  }

  private playDing() {
    this.playTone(440, 0.5, 0.3);
    setTimeout(() => this.playTone(660, 0.5, 0.3), 100);
  }

  private playTone(freq: number, duration: number, volume: number) {
    if (!this.audioContext) this.audioContext = new AudioContext();
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  private sendNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session Complete', {
        body: this.mode() === 'work' ? 'Great focus! Time for a break.' : 'Break is over. Ready to focus?',
        icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693510.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  private saveSettings() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings()));
  }

  private saveHistory() {
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.history()));
  }

  private saveBlockedSites() {
    localStorage.setItem(this.BLOCKED_SITES_KEY, JSON.stringify(this.blockedSites()));
  }

  private loadState() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) this.settings.set(JSON.parse(saved));
    
    const savedHist = localStorage.getItem(this.HISTORY_KEY);
    if (savedHist) this.history.set(JSON.parse(savedHist));

    const savedSites = localStorage.getItem(this.BLOCKED_SITES_KEY);
    if (savedSites) this.blockedSites.set(JSON.parse(savedSites));

    this.timeLeft.set(this.totalSeconds());
  }
}
