
import { Component, inject, output, computed, signal } from '@angular/core';
import { TimerService, TimerSettings, PRESET_SITES } from '../../services/timer.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-modal',
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <!-- Main Modal -->
      <div class="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col relative">
        
        <!-- Confirmation Overlay -->
        @if (confirmationSite()) {
          <div class="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
            <div class="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-rose-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Wait! You're in Focus Mode.</h3>
            <p class="text-slate-400 mb-8 leading-relaxed">
              You are attempting to visit <span class="text-rose-400 font-mono">{{ confirmationSite() }}</span> which is currently blocked. This might break your flow.
              <br><br>
              <span class="font-medium text-white">Are you sure you want to visit this site?</span>
            </p>
            <div class="flex flex-col w-full gap-3">
              <button (click)="cancelVisit()" 
                      class="w-full py-3.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors border border-slate-700">
                No, stay focused
              </button>
              <button (click)="confirmVisit()" 
                      class="w-full py-3.5 rounded-xl bg-transparent text-rose-400 font-medium hover:bg-rose-500/10 transition-colors">
                Yes, I really need to
              </button>
            </div>
          </div>
        }

        <!-- Header -->
        <div class="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <!-- Settings Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-rose-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Settings
          </h2>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <!-- Intervals -->
          <div class="space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-500">Timer Intervals (Minutes)</h3>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs mb-2 text-slate-400">Work</label>
                <input type="number" [(ngModel)]="localSettings.work" 
                       class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none">
              </div>
              <div>
                <label class="block text-xs mb-2 text-slate-400">Short</label>
                <input type="number" [(ngModel)]="localSettings.shortBreak" 
                       class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
              </div>
              <div>
                <label class="block text-xs mb-2 text-slate-400">Long</label>
                <input type="number" [(ngModel)]="localSettings.longBreak" 
                       class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
            </div>
          </div>

          <!-- Preferences -->
          <div class="space-y-4">
             <h3 class="text-xs font-bold uppercase tracking-widest text-slate-500">Preferences</h3>
             <div class="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-sm">Metronome Sound</h3>
                    <p class="text-xs text-slate-500">Ticking sound during focus</p>
                  </div>
                  <button (click)="localSettings.metronome = !localSettings.metronome"
                          [class]="localSettings.metronome ? 'bg-rose-500' : 'bg-slate-800'"
                          class="w-10 h-5 rounded-full relative transition-colors">
                    <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform"
                        [style.transform]="localSettings.metronome ? 'translateX(20px)' : 'translateX(0)'"></div>
                  </button>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-sm">Daily Session Goal</h3>
                    <p class="text-xs text-slate-500">Target work sessions</p>
                  </div>
                  <input type="number" [(ngModel)]="localSettings.goal"
                        class="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-sm text-center focus:ring-2 focus:ring-rose-500 outline-none">
                </div>
             </div>
          </div>

          <!-- Site Blocker -->
          <div class="space-y-6 pt-4 border-t border-slate-800/50">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-200">Site Blocker</h3>
                <p class="text-xs text-slate-500">Manage blocked websites during focus sessions</p>
              </div>
              <div class="px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-medium">
                {{ timer.blockedSites().length }} active
              </div>
            </div>

            <!-- Search & Add -->
            <div class="relative mb-2">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-slate-500">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                 </svg>
              </div>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                (ngModelChange)="onInput()"
                placeholder="Search or add domain (e.g. twitter.com)"
                (keyup.enter)="addFromSearch()"
                [class.border-rose-500]="errorMessage()"
                [class.focus:ring-rose-500]="errorMessage()"
                [class.border-slate-800]="!errorMessage()"
                [class.focus:ring-rose-500]="!errorMessage()"
                class="w-full bg-slate-950 border rounded-xl pl-10 pr-20 py-3 text-sm focus:ring-2 outline-none placeholder:text-slate-600 transition-all"
              >
              <button 
                (click)="addFromSearch()"
                [disabled]="!searchQuery() || isQueryBlocked()"
                class="absolute right-2 top-2 bottom-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-xs font-bold rounded-lg transition-colors">
                {{ isQueryBlocked() && searchQuery() ? 'Added' : 'Add' }}
              </button>
            </div>
            
            <!-- Validation Message -->
             <div class="h-4 pl-3">
              @if (errorMessage()) {
                <div class="text-[10px] text-rose-400 font-medium animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                     <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                   </svg>
                   {{ errorMessage() }}
                </div>
              }
             </div>

            <!-- Active Blocked List (Filtered by Search) -->
            @if (filteredBlockedSites().length > 0) {
              <div class="space-y-2">
                <h4 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Blocked Sites ({{ filteredBlockedSites().length }})
                </h4>
                <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                  @for (site of filteredBlockedSites(); track site) {
                    <div class="animate-in fade-in zoom-in duration-200 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg pl-2 pr-2 py-1.5 text-sm flex items-center gap-2 group hover:border-rose-500/50 transition-colors">
                      <img [src]="'https://www.google.com/s2/favicons?domain=' + site + '&sz=32'" 
                           class="w-4 h-4 rounded-full opacity-80" 
                           alt=""
                           onerror="this.style.display='none'">
                      <span class="font-medium">{{ site }}</span>
                      
                      <!-- Visit Link -->
                      <button (click)="visitSite(site, $event)" 
                              class="ml-1 p-0.5 hover:bg-slate-800 rounded text-slate-600 hover:text-rose-400 transition-colors" 
                              title="Visit Site">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </button>

                      <button (click)="timer.removeBlockedSite(site)" 
                              class="p-0.5 hover:bg-rose-500/20 rounded text-slate-600 hover:text-rose-400 transition-colors" 
                              title="Remove">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              </div>
            } @else if (timer.blockedSites().length > 0 && searchQuery() && !errorMessage()) {
               <div class="text-xs text-slate-600 italic px-2">
                 No blocked sites match "{{ searchQuery() }}".
               </div>
            } @else if (timer.blockedSites().length === 0) {
              <div class="text-xs text-slate-600 italic px-2">
                No sites blocked yet. Add one above or select a popular platform below.
              </div>
            }

            <!-- Popular / Presets (Filtered by Search) -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Popular Platforms
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (site of filteredPresets(); track site.domain) {
                  <div class="relative group">
                    <button (click)="timer.toggleSite(site.domain)"
                            [class.border-rose-500]="timer.blockedSites().includes(site.domain)"
                            [class.bg-slate-800]="timer.blockedSites().includes(site.domain)"
                            [class.bg-slate-900]="!timer.blockedSites().includes(site.domain)"
                            class="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-800 hover:border-slate-600 transition-all text-left">
                      <div class="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center shrink-0 border border-slate-800">
                        <i [class]="site.icon + ' text-lg transition-transform group-hover:scale-110 ' + site.color"></i>
                      </div>
                      <div class="flex flex-col overflow-hidden min-w-0">
                        <span class="text-sm font-medium truncate w-full"
                              [class.text-white]="timer.blockedSites().includes(site.domain)"
                              [class.text-slate-400]="!timer.blockedSites().includes(site.domain)">
                          {{ site.name }}
                        </span>
                        <span class="text-[10px] text-slate-500 truncate w-full group-hover:text-slate-400 transition-colors">
                          {{ site.domain }}
                        </span>
                      </div>
                    </button>
                    
                    <!-- Top Right Actions -->
                    <div class="absolute top-2 right-2 flex items-center gap-1">
                       <!-- Visit Button -->
                       <button (click)="visitSite(site.domain, $event)"
                               class="p-1 rounded-md text-slate-600 hover:text-rose-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
                               title="Visit Site">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                             <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                       </button>

                       <!-- Blocked Indicator -->
                       @if (timer.blockedSites().includes(site.domain)) {
                        <div class="text-rose-500 animate-in zoom-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                            <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                          </svg>
                        </div>
                       }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-6 bg-slate-800/30 border-t border-slate-800 flex gap-4 shrink-0">
          <button (click)="close.emit()" 
                  class="flex-1 py-3 px-4 rounded-xl border border-slate-700 font-semibold hover:bg-slate-800 transition-colors text-sm">
            Cancel
          </button>
          <button (click)="save()"
                  class="flex-1 py-3 px-4 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 text-sm">
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
  presets = PRESET_SITES;

  localSettings: TimerSettings = { ...this.timer.settings() };
  searchQuery = signal('');
  errorMessage = signal('');
  confirmationSite = signal<string | null>(null);

  filteredBlockedSites = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sites = this.timer.blockedSites().slice().sort(); // Sort alphabetically
    if (!q) return sites;
    return sites.filter(s => s.toLowerCase().includes(q));
  });

  filteredPresets = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.presets;
    return this.presets.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.domain.toLowerCase().includes(q)
    );
  });

  isQueryBlocked = computed(() => {
     const q = this.searchQuery().toLowerCase().trim();
     if (!q) return true; // Treat empty as blocked so "Added" doesn't show up weirdly
     const clean = q.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
     return this.timer.blockedSites().includes(clean);
  });

  onInput() {
    this.errorMessage.set('');
  }

  addFromSearch() {
    const raw = this.searchQuery().trim();
    if (!raw) return;

    // Check if already blocked (simulate service cleanup for check)
    const clean = raw.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
    
    if (this.timer.blockedSites().includes(clean)) {
        this.errorMessage.set('This site is already blocked');
        return;
    }

    // Basic Domain Validation
    // Matches: example.com, sub.example.co.uk
    // Must start with alphanumeric, contain dots, end with 2+ char TLD
    const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

    if (!domainRegex.test(clean)) {
        this.errorMessage.set('Invalid domain format (e.g. example.com)');
        return;
    }

    if (clean) {
      this.timer.addBlockedSite(raw);
      this.searchQuery.set('');
      this.errorMessage.set('');
    }
  }

  visitSite(domain: string, e?: Event) {
    e?.stopPropagation(); // Prevent parent click
    
    // Cleanup domain to add protocol if needed (just in case)
    const url = domain.startsWith('http') ? domain : domain;
    
    const isBlocked = this.timer.blockedSites().includes(domain);
    // Logic: If blocked AND timer is actively blocking (Work Mode + Running)
    if (isBlocked && this.timer.isBlockingActive()) {
      this.confirmationSite.set(domain);
    } else {
      window.open(`https://${url}`, '_blank');
    }
  }

  confirmVisit() {
    const site = this.confirmationSite();
    if (site) {
      window.open(`https://${site}`, '_blank');
    }
    this.confirmationSite.set(null);
  }

  cancelVisit() {
    this.confirmationSite.set(null);
  }

  save() {
    this.timer.updateSettings(this.localSettings);
    this.close.emit();
  }
}
