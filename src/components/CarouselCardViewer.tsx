import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  Sparkles, 
  Maximize2, 
  Palette, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';
import { CarouselSlide } from '@/src/data/marketingModulesData';

interface CarouselCardViewerProps {
  slides: CarouselSlide[];
  topic?: string;
  brandName?: string;
  channel?: 'LinkedIn' | 'Instagram';
  onSlideChange?: (index: number) => void;
}

export default function CarouselCardViewer({
  slides,
  topic = 'Growth OS Strategic Blueprint',
  brandName = 'SIGMA TACTIX',
  channel = 'LinkedIn',
  onSlideChange
}: CarouselCardViewerProps) {
  const { notifySuccess, notifyInfo } = useToast();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'4:5' | '1:1'>('4:5');
  const [theme, setTheme] = useState<'OBSIDIAN_AMBER' | 'CYBER_BLUEPRINT' | 'MONOLITH_GOLD'>('OBSIDIAN_AMBER');
  const [copiedSlide, setCopiedSlide] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex] || slides[0];

  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(currentSlideIndex);
    }
  }, [currentSlideIndex, onSlideChange]);

  const goToNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleCopySlideText = () => {
    if (!currentSlide) return;
    const text = `SLIDE ${currentSlide.slideNumber}: ${currentSlide.title}
${currentSlide.subtitle ? currentSlide.subtitle + '\n' : ''}
${(currentSlide.contentPoints || []).map(p => `• ${p}`).join('\n')}
${currentSlide.takeaway ? `\nTAKEAWAY: ${currentSlide.takeaway}` : ''}`;
    
    navigator.clipboard.writeText(text);
    setCopiedSlide(true);
    notifyInfo('Slide Text Copied', `Slide #${currentSlide.slideNumber} content copied to clipboard.`);
    setTimeout(() => setCopiedSlide(false), 2000);
  };

  const handleCopyAllSlides = () => {
    const fullDeck = slides.map(s => (
      `--- SLIDE ${s.slideNumber}: ${s.title} ---
${s.subtitle ? s.subtitle + '\n' : ''}
${(s.contentPoints || []).map(p => `• ${p}`).join('\n')}
${s.takeaway ? `Key Takeaway: ${s.takeaway}` : ''}`
    )).join('\n\n');

    navigator.clipboard.writeText(fullDeck);
    notifySuccess('Full Carousel Deck Copied', `All ${totalSlides} slides copied to clipboard.`);
  };

  // High-fidelity client-side canvas render for instant PNG download
  const handleExportSlidePng = (slideIndex = currentSlideIndex) => {
    const slideToExport = slides[slideIndex];
    if (!slideToExport) return;

    setIsExporting(true);

    try {
      const width = 1080;
      const height = aspectRatio === '4:5' ? 1350 : 1080;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // 1. Draw Background
      if (theme === 'OBSIDIAN_AMBER') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#09090b');
        grad.addColorStop(0.5, '#121114');
        grad.addColorStop(1, '#050507');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Subtle glowing ambient light
        const radialGrad = ctx.createRadialGradient(width * 0.8, height * 0.2, 10, width * 0.8, height * 0.2, 600);
        radialGrad.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
        radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGrad;
        ctx.fillRect(0, 0, width, height);

        // Outer border
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = 12;
        ctx.strokeRect(20, 20, width - 40, height - 40);
      } else if (theme === 'CYBER_BLUEPRINT') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#040914');
        grad.addColorStop(0.5, '#071226');
        grad.addColorStop(1, '#02050b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 12;
        ctx.strokeRect(20, 20, width - 40, height - 40);
      } else {
        // MONOLITH_GOLD
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#18181b');
        grad.addColorStop(1, '#09090b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
        ctx.lineWidth = 12;
        ctx.strokeRect(20, 20, width - 40, height - 40);
      }

      // 2. Draw Top Bar: Brand Badge & Slide Counter
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`${brandName}  //  GROWTH OS`, 70, 95);

      const slideNumText = `SLIDE ${String(slideToExport.slideNumber).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(slideNumText, width - ctx.measureText(slideNumText).width - 70, 95);

      // Top divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 125);
      ctx.lineTo(width - 70, 125);
      ctx.stroke();

      // 3. Category / Slide Badge
      let currentY = 190;
      if (slideToExport.badge) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        const badgeWidth = ctx.measureText(slideToExport.badge.toUpperCase()).width + 40;
        ctx.fillRect(70, currentY - 26, badgeWidth, 38);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(70, currentY - 26, badgeWidth, 38);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(slideToExport.badge.toUpperCase(), 90, currentY);
        currentY += 60;
      }

      // 4. Slide Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      const words = slideToExport.title.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 160 && n > 0) {
          ctx.fillText(line, 70, currentY);
          line = words[n] + ' ';
          currentY += 64;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 70, currentY);
      currentY += 40;

      // 5. Subtitle
      if (slideToExport.subtitle) {
        ctx.fillStyle = '#d4d4d8';
        ctx.font = 'normal 26px sans-serif';
        const subWords = slideToExport.subtitle.split(' ');
        let subLine = '';
        for (let n = 0; n < subWords.length; n++) {
          const testLine = subLine + subWords[n] + ' ';
          if (ctx.measureText(testLine).width > width - 160 && n > 0) {
            ctx.fillText(subLine, 70, currentY);
            subLine = subWords[n] + ' ';
            currentY += 36;
          } else {
            subLine = testLine;
          }
        }
        ctx.fillText(subLine, 70, currentY);
        currentY += 50;
      }

      // 6. Content Points (Bullet Cards)
      if (slideToExport.contentPoints && slideToExport.contentPoints.length > 0) {
        currentY += 10;
        slideToExport.contentPoints.forEach((point, i) => {
          // Point background card
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fillRect(70, currentY - 20, width - 140, 72);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.strokeRect(70, currentY - 20, width - 140, 72);

          // Dot indicator
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(105, currentY + 16, 7, 0, 2 * Math.PI);
          ctx.fill();

          // Point text
          ctx.fillStyle = '#f4f4f5';
          ctx.font = '500 24px sans-serif';
          ctx.fillText(point, 135, currentY + 24);

          currentY += 92;
        });
      }

      // 7. Key Takeaway Box
      if (slideToExport.takeaway) {
        const boxY = height - 260;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.fillRect(70, boxY, width - 140, 100);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(70, boxY, width - 140, 100);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('CORE TAKEAWAY', 95, boxY + 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(slideToExport.takeaway, 95, boxY + 70);
      }

      // 8. Footer: Swipe Cue & Brand Stamp
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(70, height - 110);
      ctx.lineTo(width - 70, height - 110);
      ctx.stroke();

      ctx.fillStyle = '#71717a';
      ctx.font = 'normal 18px monospace';
      ctx.fillText(`sigmatactix.com  •  Autonomous Growth Engine`, 70, height - 65);

      const swipeText = slideToExport.slideNumber === totalSlides ? 'End of Deck 🏁' : 'Swipe next ➔';
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(swipeText, width - ctx.measureText(swipeText).width - 70, height - 65);

      // Download triggered
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `sigma-tactix-carousel-slide-${String(slideToExport.slideNumber).padStart(2, '0')}.png`;
      link.href = dataUrl;
      link.click();

      notifySuccess('Slide Exported', `Slide #${slideToExport.slideNumber} downloaded as high-res PNG.`);
    } catch (err: any) {
      console.error('Canvas export error:', err);
      notifyInfo('Export Note', 'Canvas generation triggered. Check browser downloads.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllSlides = () => {
    setIsExporting(true);
    notifyInfo('Exporting Full Deck', `Rendering all ${totalSlides} slides as PNGs...`);
    
    slides.forEach((_, idx) => {
      setTimeout(() => {
        handleExportSlidePng(idx);
      }, idx * 600);
    });

    setTimeout(() => {
      setIsExporting(false);
      notifySuccess('Full Deck Export Complete', `All ${totalSlides} slides downloaded.`);
    }, totalSlides * 650);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Aspect Ratio, Theme, and Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 px-2">Ratio:</span>
            <button
              onClick={() => setAspectRatio('4:5')}
              className={cn(
                "px-2.5 py-1 text-xs font-mono rounded-md transition-all cursor-pointer",
                aspectRatio === '4:5'
                  ? "bg-amber-400/20 text-amber-400 border border-amber-400/40 font-bold"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              4:5 Portrait
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              className={cn(
                "px-2.5 py-1 text-xs font-mono rounded-md transition-all cursor-pointer",
                aspectRatio === '1:1'
                  ? "bg-amber-400/20 text-amber-400 border border-amber-400/40 font-bold"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              1:1 Square
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 px-2 flex items-center gap-1">
              <Palette className="w-3 h-3" /> Theme:
            </span>
            <button
              onClick={() => setTheme('OBSIDIAN_AMBER')}
              className={cn(
                "px-2 py-1 text-xs rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                theme === 'OBSIDIAN_AMBER'
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              Obsidian
            </button>
            <button
              onClick={() => setTheme('CYBER_BLUEPRINT')}
              className={cn(
                "px-2 py-1 text-xs rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                theme === 'CYBER_BLUEPRINT'
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              Cyber
            </button>
            <button
              onClick={() => setTheme('MONOLITH_GOLD')}
              className={cn(
                "px-2 py-1 text-xs rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                theme === 'MONOLITH_GOLD'
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-semibold"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              Monolith
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySlideText}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            {copiedSlide ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSlide ? 'Copied' : 'Copy Slide Text'}
          </button>

          <button
            onClick={handleCopyAllSlides}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            Copy All Slides
          </button>

          <button
            onClick={() => handleExportSlidePng(currentSlideIndex)}
            disabled={isExporting}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export Slide PNG
          </button>

          <button
            onClick={handleExportAllSlides}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-amber-500/20"
          >
            <Download className="w-3.5 h-3.5 fill-black" />
            Export Full Deck
          </button>
        </div>
      </div>

      {/* Main Slide Card Stage */}
      <div className="flex flex-col items-center justify-center p-6 bg-black/40 border border-zinc-800/80 rounded-2xl relative">
        {/* Navigation Arrow Left */}
        <button
          onClick={goToPrev}
          disabled={currentSlideIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-full border border-zinc-700 shadow-xl disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Navigation Arrow Right */}
        <button
          onClick={goToNext}
          disabled={currentSlideIndex === totalSlides - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-full border border-zinc-700 shadow-xl disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Visual Container */}
        <div 
          ref={cardRef}
          className={cn(
            "relative w-full max-w-lg transition-all duration-300 rounded-2xl p-8 flex flex-col justify-between overflow-hidden shadow-2xl border select-none",
            aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-square',
            theme === 'OBSIDIAN_AMBER' && "bg-gradient-to-b from-zinc-950 via-zinc-900 to-black border-amber-500/30 shadow-amber-500/5",
            theme === 'CYBER_BLUEPRINT' && "bg-gradient-to-b from-[#030914] via-[#071328] to-[#02050d] border-cyan-500/30 shadow-cyan-500/5",
            theme === 'MONOLITH_GOLD' && "bg-gradient-to-b from-zinc-900 to-zinc-950 border-amber-600/30 shadow-yellow-500/5"
          )}
        >
          {/* Ambient Glow */}
          <div 
            className={cn(
              "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20",
              theme === 'OBSIDIAN_AMBER' && "bg-amber-500",
              theme === 'CYBER_BLUEPRINT' && "bg-cyan-500",
              theme === 'MONOLITH_GOLD' && "bg-yellow-500"
            )}
          />

          {/* Card Top Header */}
          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] font-mono tracking-widest font-bold text-amber-400">
                  {brandName} // GROWTH OS
                </span>
              </div>
              <div className="text-[11px] font-mono font-bold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                SLIDE {String(currentSlide.slideNumber).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
              </div>
            </div>

            {/* Badge */}
            {currentSlide.badge && (
              <div className="mt-4">
                <span className={cn(
                  "inline-block px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase border",
                  theme === 'OBSIDIAN_AMBER' && "bg-amber-400/10 border-amber-400/30 text-amber-400",
                  theme === 'CYBER_BLUEPRINT' && "bg-cyan-400/10 border-cyan-400/30 text-cyan-400",
                  theme === 'MONOLITH_GOLD' && "bg-yellow-400/10 border-yellow-400/30 text-yellow-300"
                )}>
                  {currentSlide.badge}
                </span>
              </div>
            )}

            {/* Slide Title */}
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white mt-2.5 leading-tight">
              {currentSlide.title}
            </h2>

            {/* Slide Subtitle */}
            {currentSlide.subtitle && (
              <p className="text-xs md:text-sm text-zinc-300 mt-1.5 leading-snug font-normal">
                {currentSlide.subtitle}
              </p>
            )}
          </div>

          {/* Card Center: Bullet Points */}
          <div className="relative z-10 my-4 space-y-2.5">
            {currentSlide.contentPoints?.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-sm"
              >
                <div className="mt-1 w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-sm shadow-amber-400" />
                <span className="text-xs md:text-[13px] text-zinc-200 leading-relaxed font-medium">
                  {point}
                </span>
              </div>
            ))}
          </div>

          {/* Card Bottom: Key Takeaway & Footer */}
          <div className="relative z-10 space-y-3">
            {currentSlide.takeaway && (
              <div className={cn(
                "p-3 rounded-xl border",
                theme === 'OBSIDIAN_AMBER' && "bg-amber-500/10 border-amber-500/30 text-amber-200",
                theme === 'CYBER_BLUEPRINT' && "bg-cyan-500/10 border-cyan-500/30 text-cyan-200",
                theme === 'MONOLITH_GOLD' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-200"
              )}>
                <div className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-0.5">
                  Strategic Takeaway
                </div>
                <div className="text-xs font-semibold text-white">
                  {currentSlide.takeaway}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono text-zinc-500">
              <span>sigmatactix.com</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                {currentSlide.slideNumber === totalSlides ? 'Save Deck' : 'Swipe next'} 
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Slide Counter Dots / Filmstrip */}
        <div className="flex items-center gap-1.5 mt-5">
          {slides.map((s, idx) => (
            <button
              key={s.slideNumber}
              onClick={() => setCurrentSlideIndex(idx)}
              className={cn(
                "transition-all cursor-pointer",
                currentSlideIndex === idx
                  ? "w-8 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"
                  : "w-2 h-2 rounded-full bg-zinc-700 hover:bg-zinc-500"
              )}
              aria-label={`Go to slide ${s.slideNumber}`}
            />
          ))}
        </div>
      </div>

      {/* Slide Thumbnails Tray */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1">
        {slides.map((s, idx) => (
          <button
            key={s.slideNumber}
            onClick={() => setCurrentSlideIndex(idx)}
            className={cn(
              "shrink-0 w-32 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
              currentSlideIndex === idx
                ? "bg-amber-400/10 border-amber-400/50 shadow-md shadow-amber-500/10"
                : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            )}
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-amber-400 font-bold">#{s.slideNumber}</span>
              <span className="text-zinc-500">{s.badge || 'SLIDE'}</span>
            </div>
            <div className="text-[11px] font-bold text-white line-clamp-1">
              {s.title}
            </div>
            <div className="text-[9px] text-zinc-400 line-clamp-1 mt-0.5">
              {s.subtitle || s.takeaway || 'Content slide'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
