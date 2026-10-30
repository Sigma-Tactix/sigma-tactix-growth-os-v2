import { execFile } from 'node:child_process';
import { promises as fs, existsSync } from 'node:fs';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const cliPath = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'hyperframes.cmd' : 'hyperframes');
const gsapPath = path.join(root, 'node_modules', 'gsap', 'dist', 'gsap.min.js');
const outputRoot = process.env.CREATIVE_RENDER_OUTPUT_DIR || path.join(root, '.creative-renders');
const macSayPath = '/usr/bin/say';

export interface DeterministicRenderRequest {
  taskId: string;
  title: string;
  subtitle?: string;
  cta?: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  durationSeconds: number;
}

export interface DeterministicRenderResult {
  outputPath: string;
  filename: string;
  durationSeconds: number;
  aspectRatio: DeterministicRenderRequest['aspectRatio'];
  sceneCount: number;
  hasVoiceover: true;
}

function escapeForScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function dimensions(aspectRatio: DeterministicRenderRequest['aspectRatio']) {
  if (aspectRatio === '9:16') return { width: 1080, height: 1920 };
  if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 };
}

function sceneCopy(request: DeterministicRenderRequest) {
  const ctaLabel = request.cta?.trim() || 'Visit now';
  return [
    { 
      eyebrow: '01 / THE SIGNAL', 
      title: request.title.slice(0, 160), 
      body: (request.subtitle || 'Evidence-led growth operations').slice(0, 240),
      isEndingFrame: false
    },
    { 
      eyebrow: '02 / THE SYSTEM', 
      title: 'Proof before performance.', 
      body: 'Connect evidence, decisions, and governed execution in one operating loop.',
      isEndingFrame: false
    },
    { 
      eyebrow: '03 / THE NEXT MOVE', 
      title: ctaLabel.toUpperCase() === 'SIGMATACTIX.COM' || ctaLabel === 'SIGMA TACTIX' ? 'Visit now' : ctaLabel.slice(0, 80), 
      body: 'Scale with governed autonomous growth infrastructure. Visit www.sigmatactix.com to initiate your pilot.',
      isEndingFrame: true,
      domain: 'www.sigmatactix.com',
      ctaText: 'Visit now'
    },
  ];
}

function compositionHtml(request: DeterministicRenderRequest) {
  const { width, height } = dimensions(request.aspectRatio);
  const data = escapeForScript({ scenes: sceneCopy(request), segment: request.durationSeconds / 3 });
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=${width}, height=${height}"/><script src="./gsap.min.js"></script><style>*{box-sizing:border-box}html,body,#root{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#07090d;color:#f5f5f4;font-family:Arial,sans-serif}.orb{position:absolute;width:${Math.round(width*.72)}px;height:${Math.round(width*.72)}px;border-radius:50%;filter:blur(3px);background:radial-gradient(circle at 35% 35%,#ff704d 0,#ff481b 22%,rgba(216,56,18,.35) 47%,transparent 72%);right:-${Math.round(width*.18)}px;top:-${Math.round(height*.1)}px;opacity:.64}.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,72,27,.11) 1px,transparent 1px),linear-gradient(90deg,rgba(255,72,27,.11) 1px,transparent 1px);background-size:72px 72px;mask-image:linear-gradient(to bottom,black,transparent)}.scene{position:absolute;inset:0;padding:${Math.round(width*.075)}px;display:flex;flex-direction:column;justify-content:flex-end;opacity:0}.eyebrow{font-size:${Math.round(width*.026)}px;letter-spacing:.22em;color:#ff704d;font-weight:700}.title{font-size:${Math.round(width*.078)}px;line-height:.98;letter-spacing:-.055em;max-width:86%;margin:28px 0;font-weight:800}.body{font-size:${Math.round(width*.026)}px;max-width:65%;line-height:1.35;color:#d4d4d8}.brand-logo{display:inline-flex;align-items:center;gap:12px;margin-bottom:20px;padding:8px 18px;border-radius:10px;background:rgba(255,72,27,0.14);border:1px solid rgba(255,72,27,0.4)}.brand-domain{color:#ff704d;font-size:${Math.round(width*.032)}px;font-weight:700;letter-spacing:.08em;margin-top:16px;display:block}.cta-badge{display:inline-block;margin-top:24px;padding:14px 28px;background:#ff481b;color:#ffffff;font-size:${Math.round(width*.03)}px;font-weight:800;border-radius:8px;letter-spacing:.08em;box-shadow:0 8px 24px rgba(255,72,27,0.4)}.footer{display:flex;justify-content:space-between;margin-top:${Math.round(height*.09)}px;padding-top:22px;border-top:1px solid rgba(255,72,27,.50);font-size:${Math.round(width*.019)}px;letter-spacing:.13em;color:#ff704d}.line{position:absolute;left:0;bottom:0;height:12px;width:100%;background:#ff481b;transform-origin:left}</style></head><body><main id="root" data-composition-id="main" data-start="0" data-duration="${request.durationSeconds}" data-width="${width}" data-height="${height}" data-fps="30"><div class="grid"></div><div class="orb"></div><div id="scenes"></div><div class="line"></div></main><script>const d=${data};const root=document.querySelector('#scenes');d.scenes.forEach((s,i)=>{const el=document.createElement('section');el.className='scene';if(s.isEndingFrame){el.innerHTML='<div class="brand-logo"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff704d" stroke-width="2.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg><span style="font-weight:800;color:#fff;letter-spacing:1px;">SIGMA TACTIX</span></div><div class="eyebrow">'+s.eyebrow+'</div><h1 class="title">'+s.title+'</h1><p class="body">'+s.body+'</p><span class="brand-domain">www.sigmatactix.com</span><div><span class="cta-badge">Visit now &rarr;</span></div><div class="footer"><span>SIGMA TACTIX / GROWTH OS</span><span>WWW.SIGMATACTIX.COM</span></div>';}else{el.innerHTML='<div class="eyebrow">'+s.eyebrow+'</div><h1 class="title">'+s.title+'</h1><p class="body">'+s.body+'</p><div class="footer"><span>SIGMA TACTIX / GROWTH OS</span><span>SCENE '+(i+1)+' / 3</span></div>';}root.appendChild(el)});const tl=gsap.timeline({paused:true});document.querySelectorAll('.scene').forEach((scene,i)=>{const start=i*d.segment;tl.to(scene,{opacity:1,duration:.22},start).from(scene.querySelectorAll('.brand-logo,.eyebrow,.title,.body,.brand-domain,.cta-badge,.footer'),{opacity:0,y:32,stagger:.12,duration:.42,ease:'power3.out'},start+.06).to(scene,{opacity:0,duration:.24},start+d.segment-.24)});tl.from('.line',{scaleX:0,duration:.7,ease:'power2.out'},.1).to('.orb',{x:-${Math.round(width*.12)},y:${Math.round(height*.08)},duration:${Math.max(1,request.durationSeconds-.4)},ease:'none'},0);window.__timelines=window.__timelines||{};window.__timelines.main=tl;tl.seek(0);</script></body></html>`;
}

function narrationFor(request: DeterministicRenderRequest) {
  // Calibrated for 0.75x speed (135 words per minute = 2.25 words per second)
  const raw = ['Sigma Tactix.', request.title, request.subtitle, 'Visit now at www.sigmatactix.com.'].filter(Boolean).join('. ').replace(/\s+/g, ' ').trim();
  const maxWords = Math.max(8, Math.floor(request.durationSeconds * 2.1));
  return raw.split(' ').slice(0, maxWords).join(' ');
}

async function hasAudioTrack(outputPath: string) {
  const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_type', '-of', 'default=nokey=1:noprint_wrappers=1', outputPath], { timeout: 15_000 });
  return stdout.trim() === 'audio';
}

export class HyperframesRenderer {
  isInstalled() { return existsSync(cliPath) && existsSync(gsapPath) && existsSync(macSayPath); }
  isReady() { return this.isInstalled() && process.env.CREATIVE_RENDER_ENABLED !== 'false'; }
  statusMessage() {
    if (!this.isInstalled()) return 'HyperFrames, GSAP, and the local macOS voice pipeline must be available before deterministic rendering is available.';
    if (!this.isReady()) return 'HyperFrames is installed but disabled by CREATIVE_RENDER_ENABLED=false.';
    return 'Local three-scene MP4 renderer with a stitched voice-over track. Each render requires a pending task to be approved; successful output is served only to the authenticated workspace.';
  }
  artifactPath(taskId: string) { return path.join(outputRoot, `${taskId}.mp4`); }
  async render(request: DeterministicRenderRequest): Promise<DeterministicRenderResult> {
    if (!this.isReady()) throw new Error(this.statusMessage());
    if (!/^task-[a-f0-9-]+$/i.test(request.taskId)) throw new Error('Invalid render task id.');
    if (!request.title.trim()) throw new Error('A render title is required.');
    if (!Number.isFinite(request.durationSeconds) || request.durationSeconds < 3 || request.durationSeconds > 30) throw new Error('Deterministic renders support 3–30 seconds.');
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sigma-hyperframes-'));
    const outputPath = this.artifactPath(request.taskId);
    const silentOutputPath = path.join(workDir, 'silent.mp4');
    const voicePath = path.join(workDir, 'voice.aiff');
    try {
      await fs.mkdir(outputRoot, { recursive: true });
      await fs.writeFile(path.join(workDir, 'index.html'), compositionHtml(request), 'utf8');
      await fs.copyFile(gsapPath, path.join(workDir, 'gsap.min.js'));
      await execFileAsync(cliPath, ['render', workDir, '--output', silentOutputPath, '--fps', '30', '--quality', 'delivery', '--strict', '--no-best-effort', '--low-memory-mode'], { timeout: 180_000, maxBuffer: 2_000_000 });
      // Deliberate 0.75x authoritative speech pace (135 words per minute)
      await execFileAsync(macSayPath, ['-r', '135', '-o', voicePath, narrationFor(request)], { timeout: 30_000, maxBuffer: 200_000 });
      await execFileAsync('ffmpeg', ['-y', '-i', silentOutputPath, '-i', voicePath, '-filter_complex', `[1:a]apad,atrim=duration=${request.durationSeconds}[voice]`, '-map', '0:v:0', '-map', '[voice]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', outputPath], { timeout: 45_000, maxBuffer: 2_000_000 });
      const [info, hasVoiceover] = await Promise.all([fs.stat(outputPath), hasAudioTrack(outputPath)]);
      if (!info.isFile() || info.size < 1_024) throw new Error('HyperFrames did not produce a valid MP4 artifact.');
      if (!hasVoiceover) throw new Error('The rendered MP4 has no voice-over audio stream.');
      return { outputPath, filename: path.basename(outputPath), durationSeconds: request.durationSeconds, aspectRatio: request.aspectRatio, sceneCount: 3, hasVoiceover: true };
    } catch (error: any) {
      const detail = String(error?.stderr || error?.message || 'unknown render failure').replace(/\s+/g, ' ').slice(0, 600);
      throw new Error(`HyperFrames render failed: ${detail}`);
    } finally {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }
}

export const hyperframesRenderer = new HyperframesRenderer();
