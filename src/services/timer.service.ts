
import { Injectable, signal, computed, effect } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private readonly STORAGE_KEY = 'focusflow_settings';
  private readonly HISTORY_KEY = 'focusflow_history';

  // State
  settings = signal<TimerSettings>({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    goal: 8,
    autoStart: false,
    metronome: false
  });

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
    return (this.timeLeft() / total);
  });

  sessionsCompletedToday = computed(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return this.history().filter(s => s.mode === 'work' && new Date(s.timestamp).setHours(0, 0, 0, 0) === today).length;
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
      document.title = `${display} - ${modeLabel}`;
    });

    // Handle session end
    effect(() => {
      if (this.timeLeft() === 0 && this.isRunning()) {
        this.handleSessionComplete();
      }
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

    // Auto switch mode logic could go here, but manual is often better
  }

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

  private loadState() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) this.settings.set(JSON.parse(saved));
    
    const savedHist = localStorage.getItem(this.HISTORY_KEY);
    if (savedHist) this.history.set(JSON.parse(savedHist));

    this.timeLeft.set(this.totalSeconds());
  }
}
