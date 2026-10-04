#!/bin/zsh
set -euo pipefail

PROJECT_ROOT="/Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio"
FILM_ROOT="$PROJECT_ROOT/artifacts/video/sigma-growth-os-film"
BRAND_ROOT="$FILM_ROOT/brand"
FRAME_ROOT="$FILM_ROOT/frames"
OUTPUT_ROOT="$FILM_ROOT/output"
FPS="24"

mkdir -p "$FRAME_ROOT" "$OUTPUT_ROOT"

render_still() {
  local input_path="$1"
  local overlay_path="$2"
  local duration="$3"
  local output_path="$4"
  local frame_count=$((duration * FPS))

  ffmpeg -y -hide_banner -loglevel error \
    -loop 1 -i "$input_path" -loop 1 -i "$overlay_path" -t "$duration" \
    -filter_complex "[0:v]scale=2200:1240:force_original_aspect_ratio=increase,crop=2200:1240,zoompan=z='min(zoom+0.00032,1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frame_count}:s=1920x1080:fps=${FPS},eq=brightness=-0.035:saturation=0.92[base];[base][1:v]overlay=0:0,fade=t=in:st=0:d=0.45,fade=t=out:st=$((${duration} - 1)):d=1[v]" \
    -map "[v]" -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS" "$output_path"
}

render_logo_scene() {
  local background_color="$1"
  local logo_path="$2"
  local overlay_path="$3"
  local duration="$4"
  local logo_size="$5"
  local output_path="$6"

  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "color=c=${background_color}:s=1920x1080:r=${FPS}:d=${duration}" \
    -loop 1 -i "$logo_path" -loop 1 -i "$overlay_path" \
    -filter_complex "[1:v]scale=${logo_size}:${logo_size},fade=t=in:st=0.15:d=0.75:alpha=1,fade=t=out:st=$((${duration} - 1)):d=0.75:alpha=1[logo];[0:v][logo]overlay=x='(W-w)/2+18*sin(t*0.65)':y='(H-h)/2-90+10*cos(t*0.55)'[base];[base][2:v]overlay=0:0,fade=t=out:st=$((${duration} - 1)):d=1[v]" \
    -map "[v]" -t "$duration" -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS" "$output_path"
}

render_logo_scene "0x050505" "$BRAND_ROOT/wordmark-white-stacked.png" "$FILM_ROOT/overlays/01-intro.png" 5 760 "$FRAME_ROOT/01-intro.mp4"
render_logo_scene "0x070707" "$BRAND_ROOT/mark-orange.png" "$FILM_ROOT/overlays/02-fragmentation.png" 8 760 "$FRAME_ROOT/02-fragmentation.mp4"
render_still "$PROJECT_ROOT/sigmatactix-architecture.visual-check.1440x900.dark.png" "$FILM_ROOT/overlays/03-architecture.png" 7 "$FRAME_ROOT/03-architecture.mp4"
render_logo_scene "0xf4f4f4" "$BRAND_ROOT/wordmark-orange-black.png" "$FILM_ROOT/overlays/04-convergence.png" 8 920 "$FRAME_ROOT/04-convergence.mp4"
render_still "$PROJECT_ROOT/ultron_jarvis_mode_jarvis.png" "$FILM_ROOT/overlays/05-second-brain.png" 8 "$FRAME_ROOT/05-second-brain.mp4"
render_still "$PROJECT_ROOT/public/audit_evidence/agent_cockpit_heatmap_active_telemetry.png" "$FILM_ROOT/overlays/06-agents.png" 8 "$FRAME_ROOT/06-agents.mp4"
render_still "$PROJECT_ROOT/sovereign_crm_kanban_pipeline.png" "$FILM_ROOT/overlays/07-crm.png" 5 "$FRAME_ROOT/07-crm.mp4"
render_still "$PROJECT_ROOT/paid_ads_clean_slate_no_spend.png" "$FILM_ROOT/overlays/08-paid-media.png" 4 "$FRAME_ROOT/08-paid-media.mp4"
render_logo_scene "0x070707" "$BRAND_ROOT/wordmark-white-horizontal.png" "$FILM_ROOT/overlays/09-living-core.png" 8 920 "$FRAME_ROOT/09-living-core.mp4"
render_logo_scene "0x030303" "$BRAND_ROOT/wordmark-white-stacked.png" "$FILM_ROOT/overlays/10-outro.png" 7 760 "$FRAME_ROOT/10-outro.mp4"

ffmpeg -y -hide_banner -loglevel error \
  -f concat -safe 0 -i "$FILM_ROOT/concat.txt" -c copy "$OUTPUT_ROOT/picture-master.mp4"

ffmpeg -y -hide_banner -loglevel error \
  -f lavfi -i "aevalsrc=0.045*sin(2*PI*55*t)+0.025*sin(2*PI*82.41*t)+0.018*sin(2*PI*110*t)+0.009*sin(2*PI*220*t):s=48000:d=68" \
  -af "lowpass=f=1600,highpass=f=35,aecho=0.8:0.82:700:0.25,afade=t=in:st=0:d=2,afade=t=out:st=64:d=4" \
  -ar 48000 -ac 2 "$FILM_ROOT/audio/score.wav"

ffmpeg -y -hide_banner -loglevel error \
  -i "$OUTPUT_ROOT/picture-master.mp4" \
  -i "$FILM_ROOT/audio/score.wav" \
  -i "$FILM_ROOT/audio/voiceover.wav" \
  -filter_complex "[1:a]volume=0.7[score];[2:a]adelay=3000|3000,volume=1.0[voice];[score][voice]amix=inputs=2:duration=longest:dropout_transition=2:normalize=0,alimiter=limit=0.94[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -movflags +faststart -t 68 \
  "$OUTPUT_ROOT/sigma-tactix-growth-os-film.mp4"

ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of json "$OUTPUT_ROOT/sigma-tactix-growth-os-film.mp4"
