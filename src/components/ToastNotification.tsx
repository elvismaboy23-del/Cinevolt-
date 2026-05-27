import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, Play, Sparkles } from 'lucide-react';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'purchase';
  movieTitle?: string;
  coverUrl?: string;
}

interface ToastNotificationProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  onWatchMovie?: (movieTitle: string) => void;
}

export default function ToastNotification({ toasts, onClose, onWatchMovie }: ToastNotificationProps) {
  return (
    <div 
      id="toast-notifications-root"
      className="fixed bottom-6 right-6 z-55 flex flex-col gap-3.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          // Icon and accent selector based on type
          let Icon = Info;
          let accentClass = "border-sky-500/30 text-sky-400 bg-sky-950/20";
          let iconColor = "text-sky-450";
          
          if (toast.type === 'success') {
            Icon = CheckCircle2;
            accentClass = "border-emerald-500/30 text-emerald-400 bg-emerald-950/15";
            iconColor = "text-emerald-400";
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            accentClass = "border-rose-500/30 text-rose-450 bg-rose-950/15";
            iconColor = "text-rose-500";
          } else if (toast.type === 'purchase') {
            Icon = Sparkles;
            accentClass = "border-brand/40 text-brand bg-brand/10";
            iconColor = "text-brand";
          }

          return (
            <motion.div
              layout
              id={`toast-card-${toast.id}`}
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 }, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`pointer-events-auto flex flex-col overflow-hidden rounded-2xl border backdrop-blur-md shadow-2xl shadow-black/65 ${accentClass} font-sans`}
            >
              {/* Progress Bar indicating auto-dismiss */}
              <div className="relative w-full h-[3px] bg-zinc-850/50 overflow-hidden">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 6, ease: 'linear' }}
                  className={`h-full ${
                    toast.type === 'purchase' ? 'bg-brand' : 
                    toast.type === 'success' ? 'bg-emerald-500' : 
                    toast.type === 'error' ? 'bg-rose-500' : 'bg-sky-500'
                  }`}
                />
              </div>

              {/* Toast content wrapper */}
              <div className="p-4.5 flex gap-3.5 relative">
                {/* Dismiss Button */}
                <button
                  id={`toast-close-${toast.id}`}
                  onClick={() => onClose(toast.id)}
                  className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded-md hover:bg-white/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Left Visual Identifier */}
                {toast.type === 'purchase' && toast.coverUrl ? (
                  <div className="relative w-11 h-15 rounded-lg overflow-hidden border border-brand/25 bg-zinc-900 shrink-0 shadow-lg mt-0.5">
                    <img 
                      src={toast.coverUrl} 
                      alt={toast.movieTitle || 'Cover'} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ) : (
                  <div className={`p-2 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center border ${
                    toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                    toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20' :
                    toast.type === 'purchase' ? 'bg-brand/15 border-brand/20' : 'bg-sky-500/10 border-sky-500/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                )}

                {/* Right text contents */}
                <div className="space-y-1.5 pr-6 w-full">
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-zinc-100">
                    {toast.title}
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">
                    {toast.message}
                  </p>

                  {/* Context actions like direct play / watch */}
                  {toast.type === 'purchase' && toast.movieTitle && onWatchMovie && (
                    <div className="pt-2">
                      <button
                        id={`toast-watch-${toast.id}`}
                        onClick={() => {
                          onWatchMovie(toast.movieTitle!);
                          onClose(toast.id);
                        }}
                        className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-slate-950 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 hover:scale-102 mt-0.5"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Watch Full Movie Now</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
