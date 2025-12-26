
import { Component, inject, computed } from '@angular/core';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-timer-display',
  template: `
    <div class="relative flex items-center justify-center group">
      <!-- Background Ring -->
      <svg class="w-64 h-64 md:w-80 md:h-80" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="45"
          fill="transparent"
          stroke="currentColor"
          stroke-width="3"
          class="text-slate-800"
        />
        <!-- Progress Ring -->
        <circle
          cx="50" cy="50" r="45"
          fill="transparent"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          class="progress-ring__circle"
          [style.color]="modeColor()"
          [style.stroke-dasharray]="circumference"
          [style.stroke-dashoffset]="strokeOffset()"
        />
      </svg>

      <!-- Center Text -->
      <div class="absolute flex flex-col items-center">
        <span class="timer-font text-5xl md:text-7xl font-medium tabular-nums tracking-tighter"
              [style.color]="modeColor()">
          {{ displayTime() }}
        </span>
        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mt-2">
          {{ timer.mode() === 'work' ? 'Focus Session' : 'Rest Phase' }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class TimerDisplayComponent {
  timer = inject(TimerService);
  circumference = 2 * Math.PI * 45;

  displayTime = computed(() => {
    const totalSeconds = this.timer.timeLeft();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  modeColor = computed(() => {
    switch(this.timer.mode()) {
      case 'work': return '#f43f5e'; // rose-500
      case 'shortBreak': return '#10b981'; // emerald-500
      case 'longBreak': return '#3b82f6'; // blue-500
      default: return '#f43f5e';
    }
  });

  strokeOffset = computed(() => {
    const progress = this.timer.progress();
    return this.circumference * (1 - progress);
  });
}
