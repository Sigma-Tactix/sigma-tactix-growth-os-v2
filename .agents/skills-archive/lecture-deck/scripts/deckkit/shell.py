# -*- coding: utf-8 -*-
"""The deck shell: one HTML page, 1280x720 screens scaled to the window, keyboard navigation,
speaker notes (N), overview (O), blackout (B), fullscreen (F), print, copy buttons, and a
static mode (?static=1) that shows every animated element at its final state for rendering.

Everything visual comes from CSS variables the theme sets (see kit.theme_css). No fonts are
embedded; the theme names a Google Fonts import and a fallback stack.
"""

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
{font_link}
<style>
{theme_css}
*{{box-sizing:border-box}}
html,body{{margin:0;height:100%;background:var(--bg);color:var(--ink);font-family:var(--display);overflow:hidden}}
button{{font:inherit;cursor:pointer;border:0;background:none;color:inherit}}
#stage{{position:absolute;inset:0 0 44px 0;display:flex;align-items:center;justify-content:center;overflow:hidden}}
.frame{{width:1280px;height:720px;position:relative;transform-origin:center center;flex:0 0 auto}}
.slide{{display:none;position:absolute;inset:0;padding:54px 66px 74px;background:var(--bg);flex-direction:column;overflow:hidden}}
.slide.active{{display:flex}}
.card{{position:absolute;left:13px;top:32px;right:13px;bottom:10px;background:var(--card);border:1px solid var(--rule-on-bg);border-radius:6px;z-index:0}}
.flat .card{{left:0;top:0;right:0;bottom:0;border:0;border-radius:0}}
.flat .slide{{padding:44px 66px 74px}}
.slide-content{{position:relative;z-index:1;flex:1;min-height:0;display:flex;flex-direction:column}}
.bar-left,.bar-right{{position:absolute;top:8px;font:700 12.5px/1 var(--mono);letter-spacing:.06em;color:var(--on-bg);z-index:2;text-transform:uppercase}}
.bar-left{{left:21px}} .bar-right{{right:21px}}
.flat .bar-left,.flat .bar-right{{top:14px;left:66px;color:var(--muted)}} .flat .bar-right{{left:auto;right:66px}}
.foot{{position:absolute;left:54px;bottom:22px;font:700 11.5px/1 var(--mono);color:var(--muted);letter-spacing:.09em;z-index:2;text-transform:uppercase}}
.pill{{position:absolute;right:26px;bottom:19px;display:flex;z-index:2}}
.pill span{{padding:7px 14px 8px;font:700 10.5px/1 var(--mono);letter-spacing:.05em;color:var(--card);background:var(--ink)}}
.pill span+span{{background:var(--muted)}}
.prog{{position:absolute;left:14px;bottom:11px;height:2px;background:var(--highlight);z-index:2}}
.flat .prog{{left:0;bottom:0;height:3px}}
h2{{font-family:var(--display);color:var(--ink);font-size:46px;line-height:1.08;letter-spacing:-.01em;margin:0 0 14px;font-weight:700}}
.eyebrow{{font:13px var(--mono);letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:8px}}
.mode{{display:flex;align-items:center;gap:12px;font:13px var(--mono);letter-spacing:1.3px;color:var(--muted);margin:-4px 0 12px;text-transform:uppercase}}
.mode i{{width:11px;height:11px;border-radius:50%;background:var(--mode-slides);flex:0 0 auto}}
.mode-share i{{background:var(--mode-share)}} .mode-breakout i{{background:var(--mode-breakout)}} .mode-solo i{{background:var(--mode-solo)}} .mode-handoff i{{background:var(--mode-handoff)}} .mode-break i{{background:var(--mode-break)}}
.mode b{{color:var(--ink);font-weight:700}} .mode span{{color:var(--muted);text-transform:none;letter-spacing:.4px}}
.click-path{{margin:14px 0 0}}
.click-path p{{font-size:23px;line-height:1.35;border-top:1px solid var(--rule);padding:14px 0;margin:0;color:var(--ink)}}
.click-path b{{display:inline-block;font:22px var(--mono);color:var(--muted);margin-right:18px}}
.click-path strong{{font-weight:700}}
.teaching-cue{{font-size:24px;font-weight:700;line-height:1.25;border-top:1px solid var(--rule);padding-top:18px;margin:22px 0 0;color:var(--ink)}}
.footnote{{font:15px/1.4 var(--mono);color:var(--muted);margin:16px 0 0}}
.chat-model{{margin:20px 0 0}}
.chat-model p{{font-size:20px;line-height:1.35;padding:16px 20px;background:var(--panel);margin:10px 0;color:var(--ink)}}
.chat-model b{{display:block;font:13px var(--mono);letter-spacing:1px;color:var(--muted);margin-bottom:8px;text-transform:uppercase}}
.chat-model.prompt p{{font-size:15.5px;line-height:1.4;padding:14px 18px}}
.panels{{display:grid;gap:14px;margin:18px 0 0}}
.panel{{background:var(--panel);border-top:4px solid var(--ink);padding:16px 18px 18px;display:flex;flex-direction:column;min-height:0}}
.panel .glyph{{margin-bottom:10px;line-height:0}}
.panel b{{display:block;font-family:var(--display);font-size:23px;line-height:1.15;margin-bottom:8px;color:var(--ink)}}
.panel span{{display:block;line-height:1.3;color:var(--muted)}}
.ideas{{display:grid;gap:12px;margin:18px 0}}
.idea{{background:var(--panel);border-top:3px solid var(--ink);padding:14px 16px}}
.idea b{{display:block;font:13px var(--mono);letter-spacing:1.2px;color:var(--muted);margin-bottom:8px;text-transform:uppercase}}
.idea span{{display:block;font-size:18px;line-height:1.25;color:var(--ink)}}
.twocol{{display:grid;gap:26px;flex:1;min-height:0;align-items:start}}
.copybtn{{font:500 15px var(--mono);padding:8px 14px;border:1px solid var(--ink);color:var(--ink);border-radius:4px;align-self:flex-start;margin-top:6px}}
svg text{{font-family:var(--display)}}
/* animation: individual translate/scale properties so SVG transform attributes survive */
.slide [data-in]{{opacity:0}}
.slide.active [data-in]{{animation:ebin .5s cubic-bezier(.22,.75,.2,1) forwards;animation-delay:calc(var(--d,0)*.35s)}}
@keyframes ebin{{from{{opacity:0;translate:0 8px}}to{{opacity:1;translate:0 0}}}}
.slide [data-draw]{{stroke-dasharray:1;stroke-dashoffset:1}}
.slide.active [data-draw]{{animation:ebdraw .6s ease-out forwards;animation-delay:calc(var(--d,0)*.35s)}}
@keyframes ebdraw{{to{{stroke-dashoffset:0}}}}
.slide.active [data-march]{{animation:ebmarch 1.4s linear infinite}}
.slide.active [data-in][data-march]{{animation:ebin .5s cubic-bezier(.22,.75,.2,1) calc(var(--d,0)*.35s) forwards,ebmarch 1.4s linear calc(var(--d,0)*.35s) infinite}}
@keyframes ebmarch{{to{{stroke-dashoffset:-22}}}}
.slide [data-grow]{{transform-box:fill-box;transform-origin:left center;scale:0 1}}
.slide.active [data-grow]{{animation:ebgrow .7s cubic-bezier(.22,.75,.2,1) forwards;animation-delay:calc(var(--d,0)*.35s)}}
@keyframes ebgrow{{to{{scale:1 1}}}}
.slide [data-rise]{{transform-box:fill-box;transform-origin:center bottom;scale:1 0}}
.slide.active [data-rise]{{animation:ebrise .7s cubic-bezier(.22,.75,.2,1) forwards;animation-delay:calc(var(--d,0)*.35s)}}
@keyframes ebrise{{to{{scale:1 1}}}}
.slide [data-slide]{{opacity:0}}
.slide.active [data-slide]{{animation:ebslide .55s cubic-bezier(.22,.75,.2,1) forwards;animation-delay:calc(var(--d,0)*.35s)}}
@keyframes ebslide{{from{{opacity:0;translate:-28px 0}}to{{opacity:1;translate:0 0}}}}
.slide [data-drop]{{opacity:0}}
.slide.active [data-drop]{{animation:ebdrop .55s cubic-bezier(.22,.75,.2,1) forwards;animation-delay:calc(var(--d,0)*.35s)}}
@keyframes ebdrop{{from{{opacity:0;translate:0 -18px}}to{{opacity:1;translate:0 0}}}}
.slide [data-fade]{{opacity:1}}
.slide.active [data-fade]{{animation:ebfade .6s ease-out forwards;animation-delay:calc(var(--d,0)*.35s)}}
@keyframes ebfade{{to{{opacity:.25}}}}
body.static [data-in],body.static [data-slide],body.static [data-drop]{{opacity:1!important;animation:none!important;translate:0 0!important}}
body.static [data-draw]{{stroke-dashoffset:0!important;animation:none!important}}
body.static [data-grow],body.static [data-rise]{{scale:1 1!important;animation:none!important}}
body.static [data-march]{{animation:none!important}}
body.static [data-fade]{{opacity:.25!important;animation:none!important}}
/* toolbar, notes, overview */
#toolbar{{position:fixed;left:0;right:0;bottom:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;background:var(--bg);color:var(--on-bg);font:11px var(--mono);letter-spacing:.06em;z-index:20;border-top:1px solid var(--rule-on-bg)}}
#toolbar .group{{display:flex;gap:8px;align-items:center}}
#toolbar button{{padding:6px 10px;border:1px solid var(--rule-on-bg);border-radius:6px;color:var(--on-bg);font:11px var(--mono)}}
#toolbar button:disabled{{opacity:.35;cursor:default}}
#toolbar .hint{{opacity:.7}}
#notes{{position:fixed;top:0;right:0;bottom:44px;width:380px;background:var(--card);color:var(--ink);border-left:1px solid var(--rule);padding:18px 20px;overflow:auto;display:none;z-index:25;font-size:15px;line-height:1.45}}
#notes.open{{display:block}}
#notes h3{{font:700 13px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}}
#notes pre{{white-space:pre-wrap;font:inherit;margin:0 0 16px}}
#notes .k{{font:700 12px var(--mono);letter-spacing:.08em;color:var(--highlight);text-transform:uppercase;display:block;margin:14px 0 4px}}
#notes .tools{{display:flex;gap:8px;margin-bottom:12px}}
#notes .tools button{{padding:5px 9px;border:1px solid var(--rule);border-radius:6px;font:11px var(--mono)}}
body.notes-open #stage{{right:380px}}
dialog{{border:1px solid var(--rule);border-radius:10px;background:var(--card);color:var(--ink);padding:20px;max-width:900px;width:90vw;font-family:var(--display)}}
dialog::backdrop{{background:rgba(0,0,0,.55)}}
.dhead{{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}}
.dhead h2{{font-size:20px;margin:0}}
#ov{{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-height:70vh;overflow:auto}}
#ov button{{text-align:left;padding:10px 12px;border:1px solid var(--rule);border-radius:8px;font-size:14px;line-height:1.3}}
#ov button.cur{{border-color:var(--highlight);background:var(--panel)}}
#ov button small{{display:block;font:11px var(--mono);color:var(--muted);margin-bottom:4px}}
#copytext{{width:100%;min-height:200px;font:14px var(--mono);padding:10px;border:1px solid var(--rule);border-radius:6px;color:var(--ink);background:var(--panel)}}
#toast{{position:fixed;left:50%;bottom:60px;transform:translateX(-50%);background:var(--ink);color:var(--card);padding:9px 15px;border-radius:999px;font-size:13px;z-index:40}}
#toast[hidden]{{display:none}}
#blackout{{position:fixed;inset:0;background:#000;z-index:30;display:none}}
#blackout.on{{display:block}}
@media print{{
  @page{{size:1280px 720px;margin:0}}
  html,body{{overflow:visible;height:auto;background:var(--bg)}}
  #stage{{position:static;display:block;inset:auto}}
  .frame{{transform:none!important;width:1280px;height:720px;page-break-after:always;break-after:page}}
  .frame:last-child{{page-break-after:auto}}
  .slide{{display:flex!important;position:relative}}
  #toolbar,#notes,dialog,#toast,#blackout{{display:none!important}}
  [data-in],[data-slide],[data-drop]{{opacity:1!important;animation:none!important;translate:0 0!important}}
  [data-draw]{{stroke-dashoffset:0!important;animation:none!important}}
  [data-grow],[data-rise]{{scale:1 1!important;animation:none!important}}
  [data-fade]{{opacity:.25!important;animation:none!important}}
}}
</style>
<script>if(location.search.indexOf('static')>-1){{document.documentElement.classList.add('static');document.addEventListener('DOMContentLoaded',function(){{document.body.classList.add('static')}})}}</script>
</head>
<body class="{body_class}">
<div id="stage"><div class="frame" id="frame">
{slides}
</div></div>
<nav id="toolbar" aria-label="Presentation controls">
  <div class="group"><button id="prev" aria-label="Previous">←</button><span id="counter"></span><button id="next" aria-label="Next">→</button></div>
  <span class="hint">← → navigate · N notes · O overview · B blackout · F fullscreen</span>
  <div class="group"><button id="ovbtn">Overview</button><button id="notesbtn">Notes</button><button id="fsbtn">⛶</button><button id="printbtn">Print</button></div>
</nav>
<aside id="notes" aria-label="Speaker notes"><div class="tools"><button id="dlnotes">Download all notes</button><button id="closenotes">Close</button></div><h3 id="ntitle"></h3><div id="nbody"></div></aside>
<dialog id="ovdlg"><div class="dhead"><h2>{title} · overview</h2><button data-close>×</button></div><div id="ov"></div></dialog>
<dialog id="copydlg"><div class="dhead"><h2>Copy this text</h2><button data-close>×</button></div><p>Clipboard access is unavailable here. The text is selected: press Ctrl+C or Cmd+C.</p><textarea id="copytext" readonly></textarea></dialog>
<div id="toast" role="status" hidden></div>
<div id="blackout" aria-label="Blackout. Click to return."></div>
<script id="RESOURCES" type="application/json">{resources}</script>
<script>
(function(){{
  var $=function(id){{return document.getElementById(id)}};
  var slides=Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var resources=JSON.parse($('RESOURCES').textContent||'{{}}');
  var cur=Math.max(0,Math.min(slides.length-1,(parseInt((location.hash||'').replace('#slide-',''),10)||1)-1));
  function fit(){{var w=window.innerWidth-(document.body.classList.contains('notes-open')?380:0),h=window.innerHeight-44;var s=Math.min(w/1280,h/720);$('frame').style.transform='scale('+s+')'}}
  function renderNotes(){{var s=slides[cur];$('ntitle').textContent=(cur+1)+' · '+(s.dataset.title||'');var t=(s.querySelector('aside')||{{}}).textContent||'';var html=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/^(SAY|DO NOW|LOOK FOR|IF STUCK|IF THE ROOM IS AHEAD|BRIDGE|SAY \\([^)]*\\))$/gm,'<span class="k">$1</span>');$('nbody').innerHTML='<pre>'+html+'</pre>'}}
  function go(n){{if(n<0||n>=slides.length)return;slides[cur].classList.remove('active');cur=n;var s=slides[cur];s.classList.add('active');
    // restart animations by forcing reflow
    void s.offsetWidth;
    $('counter').textContent=(cur+1)+' / '+slides.length;$('prev').disabled=cur===0;$('next').disabled=cur===slides.length-1;
    history.replaceState(null,'','#slide-'+(cur+1));renderNotes();
    Array.prototype.forEach.call(document.querySelectorAll('#ov button'),function(b,i){{b.classList.toggle('cur',i===cur)}})}}
  slides.forEach(function(s,i){{var b=document.createElement('button');b.innerHTML='<small>'+(i+1)+' · '+(s.dataset.time||'')+'</small>'+(s.dataset.title||'');b.addEventListener('click',function(){{$('ovdlg').close();go(i)}});$('ov').appendChild(b)}});
  $('prev').addEventListener('click',function(){{go(cur-1)}});$('next').addEventListener('click',function(){{go(cur+1)}});
  $('ovbtn').addEventListener('click',function(){{$('ovdlg').showModal()}});
  function toggleNotes(){{var o=$('notes').classList.toggle('open');document.body.classList.toggle('notes-open',o);fit()}}
  $('notesbtn').addEventListener('click',toggleNotes);$('closenotes').addEventListener('click',toggleNotes);
  $('fsbtn').addEventListener('click',function(){{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});
  $('printbtn').addEventListener('click',function(){{window.print()}});
  $('blackout').addEventListener('click',function(){{$('blackout').classList.remove('on')}});
  Array.prototype.forEach.call(document.querySelectorAll('[data-close]'),function(b){{b.addEventListener('click',function(){{b.closest('dialog').close()}})}});
  function toast(m){{var t=$('toast');t.textContent=m;t.hidden=false;setTimeout(function(){{t.hidden=true}},1600)}}
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'),function(b){{b.addEventListener('click',function(){{var k=b.dataset.copy,txt=resources[k]||'';
    if(navigator.clipboard&&navigator.clipboard.writeText){{navigator.clipboard.writeText(txt).then(function(){{toast('Copied')}},function(){{$('copytext').value=txt;$('copydlg').showModal();$('copytext').select()}})}}else{{$('copytext').value=txt;$('copydlg').showModal();$('copytext').select()}}}})}});
  $('dlnotes').addEventListener('click',function(){{var out=slides.map(function(s,i){{return '## '+(i+1)+' · '+(s.dataset.title||'')+' ('+(s.dataset.time||'')+')\\n\\n'+((s.querySelector('aside')||{{}}).textContent||'')}}).join('\\n\\n');
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out],{{type:'text/plain'}}));a.download='notes.txt';a.click()}});
  document.addEventListener('keydown',function(e){{if(e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT')return;var k=e.key;
    if(k==='ArrowRight'||k===' '||k==='PageDown'){{e.preventDefault();go(cur+1)}}else if(k==='ArrowLeft'||k==='PageUp'){{e.preventDefault();go(cur-1)}}
    else if(k==='Home'){{go(0)}}else if(k==='End'){{go(slides.length-1)}}else if(k==='n'||k==='N'){{toggleNotes()}}else if(k==='o'||k==='O'){{$('ovdlg').open?$('ovdlg').close():$('ovdlg').showModal()}}
    else if(k==='b'||k==='B'){{$('blackout').classList.toggle('on')}}else if(k==='f'||k==='F'){{$('fsbtn').click()}}}});
  window.addEventListener('resize',fit);window.addEventListener('hashchange',function(){{var n=(parseInt((location.hash||'').replace('#slide-',''),10)||1)-1;if(n!==cur)go(n)}});
  slides[cur].classList.add('active');cur=cur;go(cur);fit();
}})();
</script>
</body>
</html>
"""
