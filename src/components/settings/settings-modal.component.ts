
import { Component, inject, output, signal } from '@angular/core';
import { TimerService, TimerSettings } from '../../services/timer.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-modal',
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        <div class="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <i class="fa-solid fa-sliders text-rose-500"></i>
            Settings
          </h2>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors">
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <!-- Intervals -->
          <div class="space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-500">Duration (Minutes)</h3>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs mb-2 text-slate-400">Work</label>
                <input type="number" [(ngModel)]="localSettings.work" 
                       class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none">
              </div>
              <div>
                <label class="block text-xs mb-2 text-slate-400">Short</label>
                <input type="number" [(ngModel)]="localSettings.shortBreak" 
                       class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none">
              </div>
              <div>
                <label class="block text-xs mb-2 text-slate-400">Long</label>
                <input type="number" [(ngModel)]="localSettings.longBreak" 
                       class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none">
              </div>
            </div>
          </div>

          <!-- Metronome & Goal -->
          <div class="space-y-4 pt-4 border-t border-slate-800">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium">Metronome</h3>
                <p class="text-xs text-slate-500">Soft ticking while focused</p>
              </div>
              <button (click)="localSettings.metronome = !localSettings.metronome"
                      [class]="localSettings.metronome ? 'bg-rose-500' : 'bg-slate-800'"
                      class="w-12 h-6 rounded-full relative transition-colors">
                <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"
                     [style.transform]="localSettings.metronome ? 'translateX(24px)' : 'translateX(0)'"></div>
              </button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium">Daily Goal</h3>
                <p class="text-xs text-slate-500">Number of sessions per day</p>
              </div>
              <input type="number" [(ngModel)]="localSettings.goal"
                     class="w-16 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-center focus:ring-2 focus:ring-rose-500 outline-none">
            </div>
          </div>
        </div>

        <div class="p-6 bg-slate-800/50 flex gap-4">
          <button (click)="close.emit()" 
                  class="flex-1 py-3 px-4 rounded-xl border border-slate-700 font-semibold hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button (click)="save()"
                  class="flex-1 py-3 px-4 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  `
})
export class SettingsModalComponent {
  timer = inject(TimerService);
  close = output<void>();

  localSettings: TimerSettings = { ...this.timer.settings() };

  save() {
    this.timer.updateSettings(this.localSettings);
    this.close.emit();
  }
}
