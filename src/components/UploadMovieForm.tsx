import React, { useState } from 'react';
import { Film, Image as ImageIcon, Video, DollarSign, Clock, HelpCircle, CheckCircle, Plus, Upload, X } from 'lucide-react';
import { Movie } from '../types';

interface UploadMovieFormProps {
  producerId: string;
  producerName: string;
  onUploadSuccess: (newMovie: Movie) => void;
}

const POSTER_PRESETS = [
  { name: 'Cosmic Gold', url: 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?q=80&w=600&auto=format&fit=crop font-sans' },
  { name: 'Urban Shadows', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop' },
  { name: 'Golden Savannah', url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=600&auto=format&fit=crop' },
  { name: 'Neon Arcade', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop' }
];

export default function UploadMovieForm({
  producerId,
  producerName,
  onUploadSuccess,
}: UploadMovieFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFileName, setCoverFileName] = useState('');
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  
  // High-fidelity .mp4 file states
  const [thrillerUrl, setThrillerUrl] = useState('');
  const [thrillerFileName, setThrillerFileName] = useState('');
  const [isDraggingThriller, setIsDraggingThriller] = useState(false);

  const [fullMovieUrl, setFullMovieUrl] = useState('');
  const [fullMovieFileName, setFullMovieFileName] = useState('');
  const [isDraggingFullMovie, setIsDraggingFullMovie] = useState(false);

  const [priceCedis, setPriceCedis] = useState('');
  const [category, setCategory] = useState('Epic Drama');
  const [durationMins, setDurationMins] = useState('110');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleCoverFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }
    try {
      const localUrl = URL.createObjectURL(file);
      setCoverUrl(localUrl);
      setCoverFileName(file.name);
    } catch (e) {
      alert('Could not process this image file. Please test with another cover image.');
    }
  };

  const handleThrillerFile = (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.endsWith('.mp4')) {
      alert('Please upload a valid .mp4 video file.');
      return;
    }
    try {
      const localUrl = URL.createObjectURL(file);
      setThrillerUrl(localUrl);
      setThrillerFileName(file.name);
    } catch (e) {
      alert('Could not process this video file. Please test with another .mp4 video.');
    }
  };

  const handleFullMovieFile = (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.endsWith('.mp4')) {
      alert('Please upload a valid .mp4 video file.');
      return;
    }
    try {
      const localUrl = URL.createObjectURL(file);
      setFullMovieUrl(localUrl);
      setFullMovieFileName(file.name);
    } catch (e) {
      alert('Could not process this video file. Please test with another .mp4 video.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !coverUrl || !thrillerUrl || !fullMovieUrl || !priceCedis || !durationMins) {
      alert('Please complete all form parameters, including selecting or dragging both MP4 files (Thriller and Full Cut), to publish your film.');
      return;
    }

    const price = parseFloat(priceCedis);
    const duration = parseInt(durationMins);

    if (isNaN(price) || price <= 0) {
      alert('Please specify a positive price in Ghana Cedis.');
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      alert('Please specify a valid movie length in minutes.');
      return;
    }

    setIsSubmitting(true);
    setUploadMessage('Encrypting physical mastercut MP4 arrays & locking distributed nodes...');

    setTimeout(() => {
      const createdMovie: Movie = {
        id: `movie-user-${Date.now()}`,
        title,
        description,
        coverUrl,
        thrillerUrl,
        fullMovieUrl,
        priceCedis: price,
        category,
        durationMins: duration,
        producerId,
        producerName,
        createdAt: new Date().toISOString(),
        purchaseCount: 0
      };

      onUploadSuccess(createdMovie);
      setIsSubmitting(false);
      setUploadMessage('');
      
      // Reset form states cleanly
      setTitle('');
      setDescription('');
      setCoverUrl('');
      setThrillerUrl('');
      setThrillerFileName('');
      setFullMovieUrl('');
      setFullMovieFileName('');
      setPriceCedis('');
    }, 1800);
  };

  return (
    <div className="bg-sleek-card border border-sleek-border rounded-2xl overflow-hidden p-6 md:p-8 shadow-2xl">
      <div className="flex items-center gap-3 border-b border-sleek-border pb-5 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Film className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight uppercase font-display">Publish Film Cut (.MP4)</h2>
          <p className="text-xs text-zinc-400">Direct file uploads conformant with standard secure streaming player frameworks.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Info */}
          <div className="space-y-4 font-sans">
            <div className="space-y-1.5 col-span-2">
              <label htmlFor="title" className="text-xs font-bold text-zinc-350 block uppercase">Movie Title</label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Accra Sizzle: The Awakening"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-550 font-medium focus:outline-none focus:ring-1 focus:ring-brand transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="category" className="text-xs font-bold text-zinc-350 block uppercase">Genre / Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl px-4 py-3 text-xs font-bold text-brand focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
              >
                <option value="Epic Drama">Epic Drama</option>
                <option value="Action Thriller">Action Thriller</option>
                <option value="Romance">Romance</option>
                <option value="Documentary">Documentary</option>
                <option value="Comedy">Comedy</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="priceCedis" className="text-xs font-bold text-zinc-350 flex items-center justify-between uppercase">
                <span>Price (GH₵ Cedis)</span>
                <span className="text-[10px] text-brand font-semibold lowercase">paid in momo</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">GH₵</span>
                <input
                  id="priceCedis"
                  type="number"
                  placeholder="30.00"
                  step="0.01"
                  min="5"
                  value={priceCedis}
                  onChange={(e) => setPriceCedis(e.target.value)}
                  className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl pl-12 pr-4 py-3 text-sm text-zinc-100 focus:outline-none font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="durationMins" className="text-xs font-bold text-zinc-350 block uppercase">Duration (Minutes)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  id="durationMins"
                  type="number"
                  placeholder="120"
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                  className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-100 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Media Links */}
          <div className="space-y-4 font-sans">
            {/* Poster Input (Physical Image File Upload) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-350 block uppercase">
                Cover Image/Poster (.png, .jpg, .webp)
              </label>
              
              {coverUrl ? (
                <div className="bg-sleek-dark border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3 truncate">
                    {/* Tiny visual thumbnail preview */}
                    <img 
                      src={coverUrl} 
                      alt="Uploaded poster preview" 
                      className="w-10 h-10 object-cover rounded-lg border border-sleek-border shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-zinc-100 truncate" title={coverFileName || "Custom Poster Art"}>
                        {coverFileName || "Custom Poster Art"}
                      </p>
                      <p className="text-[10px] text-zinc-555 font-mono font-medium">Image asset indexed</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverUrl('');
                      setCoverFileName('');
                    }}
                    className="p-1.5 rounded-lg bg-sleek-card border border-sleek-border hover:border-red-500/40 hover:text-red-400 text-zinc-400 transition-all cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingCover(true);
                  }}
                  onDragLeave={() => setIsDraggingCover(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingCover(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleCoverFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative flex flex-col items-center justify-center min-h-[110px] ${
                    isDraggingCover
                      ? 'border-brand bg-brand/5 scale-[0.99]'
                      : 'border-slate-800 bg-sleek-dark/30 hover:border-brand/30 hover:bg-sleek-dark/50'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleCoverFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="cover-file-input"
                  />
                  <Upload className="w-5 h-5 text-zinc-500 mb-1.5 pointer-events-none" />
                  <p className="text-xs font-bold text-zinc-350 pointer-events-none">
                    Drag & Drop physical <span className="text-brand">poster image</span>
                  </p>
                  <p className="text-[10px] text-zinc-550 mt-0.5 pointer-events-none">
                    or click to pick local device file
                  </p>

                  <div className="mt-2.5 flex items-center justify-center flex-wrap gap-1 relative z-10 pointer-events-auto">
                    <span className="text-[8px] text-zinc-550 font-black self-center mr-1">PRESET COVERS:</span>
                    {POSTER_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverUrl(p.url);
                          setCoverFileName(`${p.name}.jpg`);
                        }}
                        className="text-[8px] bg-sleek-card hover:bg-sleek-dark text-zinc-300 py-1 px-2 rounded border border-sleek-border hover:border-brand/40 cursor-pointer transition-all font-mono"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Thriller / Trailer MP4 File Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-350 block uppercase">
                Thriller/Trailer Video (.mp4)
              </label>
              
              {thrillerUrl ? (
                <div className="bg-sleek-dark border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/45 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-zinc-100 truncate" title={thrillerFileName}>
                        {thrillerFileName || "Uploaded Thriller File"}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">Ready to stream</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setThrillerUrl('');
                      setThrillerFileName('');
                    }}
                    className="p-1.5 rounded-lg bg-sleek-card border border-sleek-border hover:border-red-500/40 hover:text-red-400 text-zinc-400 transition-all cursor-pointer"
                    title="Remove File"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingThriller(true);
                  }}
                  onDragLeave={() => setIsDraggingThriller(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingThriller(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleThrillerFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative flex flex-col items-center justify-center min-h-[110px] ${
                    isDraggingThriller
                      ? 'border-brand bg-brand/5 scale-[0.99]'
                      : 'border-sleek-border bg-sleek-dark/30 hover:border-brand/30 hover:bg-sleek-dark/50'
                  }`}
                >
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleThrillerFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="thriller-file-input"
                  />
                  <Upload className="w-5 h-5 text-zinc-500 mb-1.5 pointer-events-none" />
                  <p className="text-xs font-bold text-zinc-350 pointer-events-none">
                    Drag & Drop physical <span className="text-brand">.mp4</span> trailer
                  </p>
                  <p className="text-[10px] text-zinc-550 mt-0.5 pointer-events-none">
                    or click to pick local device file
                  </p>

                  <div className="mt-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Mixkit sample cinematic mp4
                        setThrillerUrl('https://assets.mixkit.co/videos/preview/mixkit-cinematic-shot-of-a-mystery-man-with-a-hoodie-42004-large.mp4');
                        setThrillerFileName('Dramatic Silhouette.mp4');
                      }}
                      className="relative z-10 px-2 py-0.5 bg-sleek-card hover:bg-sleek-dark border border-sleek-border hover:border-[#00F0FF]/40 text-[8px] uppercase tracking-wider font-extrabold text-[#00F0FF] rounded-md transition-all cursor-pointer"
                    >
                      ⚡ Use Sample Clip
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Full Length MP4 File Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-350 block uppercase">
                Full Length Movie Video (.mp4)
              </label>
              
              {fullMovieUrl ? (
                <div className="bg-sleek-dark border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/45 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-zinc-100 truncate" title={fullMovieFileName}>
                        {fullMovieFileName || "Uploaded Full Movie File"}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono font-medium">Full master cut indexed</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFullMovieUrl('');
                      setFullMovieFileName('');
                    }}
                    className="p-1.5 rounded-lg bg-sleek-card border border-sleek-border hover:border-red-500/40 hover:text-red-400 text-zinc-400 transition-all cursor-pointer"
                    title="Remove File"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFullMovie(true);
                  }}
                  onDragLeave={() => setIsDraggingFullMovie(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFullMovie(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFullMovieFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative flex flex-col items-center justify-center min-h-[110px] ${
                    isDraggingFullMovie
                      ? 'border-brand bg-brand/5 scale-[0.99]'
                      : 'border-sleek-border bg-sleek-dark/30 hover:border-brand/30 hover:bg-sleek-dark/50'
                  }`}
                >
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFullMovieFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="full-movie-file-input"
                  />
                  <Upload className="w-5 h-5 text-zinc-500 mb-1.5 pointer-events-none" />
                  <p className="text-xs font-bold text-zinc-350 pointer-events-none">
                    Drag & Drop physical <span className="text-brand">.mp4</span> full cut
                  </p>
                  <p className="text-[10px] text-zinc-550 mt-0.5 pointer-events-none">
                    or click to pick local device file
                  </p>

                  <div className="mt-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Mixkit sample rain reflection mp4
                        setFullMovieUrl('https://assets.mixkit.co/videos/preview/mixkit-car-headlights-reflected-on-rainy-asphalt-at-night-42261-large.mp4');
                        setFullMovieFileName('City Rain Reflection.mp4');
                      }}
                      className="relative z-10 px-2 py-0.5 bg-sleek-card hover:bg-sleek-dark border border-sleek-border hover:border-[#00F0FF]/40 text-[8px] uppercase tracking-wider font-extrabold text-[#00F0FF] rounded-md transition-all cursor-pointer"
                    >
                      ⚡ Use Sample Clip
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 font-sans">
          <label htmlFor="description" className="text-xs font-bold text-zinc-350 block uppercase">Movie Description</label>
          <textarea
            id="description"
            rows={3}
            placeholder="Introduce the theme, runtime context, cast, and creative summary of your submission..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-sleek-dark border border-sleek-border focus:border-brand rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none"
            required
          />
        </div>

        {/* Action Button */}
        <div>
          {isSubmitting ? (
            <div className="w-full py-4 text-center bg-sleek-dark rounded-xl border border-sleek-border text-brand font-bold animate-pulse text-xs uppercase tracking-widest flex items-center justify-center gap-3">
              <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin"></span>
              <span>{uploadMessage}</span>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-brand hover:bg-brand-hover text-black py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-brand/10 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Movie Listing</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
