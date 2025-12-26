
import { Component, inject, signal } from '@angular/core';
import { TimerService, TimerMode } from './services/timer.service';
import { TimerDisplayComponent } from './components/timer-display/timer-display.component';
import { SettingsModalComponent } from './components/settings/settings-modal.component';

@Component({
  selector: 'app-root',
  imports: [TimerDisplayComponent, SettingsModalComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  timer = inject(TimerService);
  isSettingsOpen = signal(false);

  setMode(mode: TimerMode) {
    this.timer.setMode(mode);
  }

  getModeBgClass() {
    switch(this.timer.mode()) {
      case 'work': return 'bg-rose-500/5';
      case 'shortBreak': return 'bg-emerald-500/5';
      case 'longBreak': return 'bg-blue-500/5';
    }
  }

  formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
