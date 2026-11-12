'use strict';
const $=id=>document.getElementById(id), video=$('video');
const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
let state='ready',stream,ctx,source,analyser,recognition,timer,frame,attempt=0;
let above=0,run=0,last=0,peak=-120,transcript='',hasResult=false;
const threshold=()=>Number($('threshold').value);
function setting(){ $('setting').textContent=`${threshold()} dBFS`;$('target').textContent=`Drempel ${threshold()} dBFS`; }
$('threshold').oninput=setting;setting();
function cleanup(){clearTimeout(timer);cancelAnimationFrame(frame);if(recognition){recognition.onend=null;recognition.onerror=null;recognition.onresult=null;try{recognition.abort();}catch{}recognition=null;}if(source)source.disconnect();source=null;stream?.getTracks().forEach(t=>t.stop());stream=null;if(ctx){ctx.close().catch(()=>{});ctx=null;}}
function status(s){$('status').textContent=s;}
function gate(){if(state!=='intro')return;state='challenge';video.pause();video.currentTime=18;$('start').classList.add('hidden');$('challenge').classList.remove('hidden');$('phase').textContent='02 / ZEG HARDER';}
function watch(){if(state!=='intro')return;if(video.currentTime>=18)gate();else requestAnimationFrame(watch);}
video.addEventListener('timeupdate',()=>{if(state==='intro'&&video.currentTime>=18)gate();});
video.addEventListener('seeking',()=>{if(state==='intro'&&video.currentTime>18)gate();});
video.addEventListener('error',()=>{$('start').disabled=false;$('start').textContent='Video laden mislukt · probeer opnieuw';});
$('start').onclick=async()=>{state='intro';$('start').disabled=true;try{await video.play();watch();}catch{state='ready';$('start').disabled=false;$('start').textContent='Tik om de video te starten';}};
async function resume(){try{await video.play();}catch{$('continue').classList.remove('hidden');status('Gelukt! Tik op Speel verder.');}}
$('continue').onclick=resume;
video.onended=()=>{if(state==='passed'){state='done';$('title').textContent='Tout bien!';status('Geslaagd. Begin opnieuw voor een nieuwe ronde.');$('continue').classList.add('hidden');}};
function normalize(s){return s.toLowerCase().replace(/[.,!?;:]/g,'').trim().replace(/\s+/g,' ');}
function decide(word,duration,max){return normalize(word)==='harder' && duration>=250 && max<-.1;}
function finish(id,error){if(id!==attempt||state!=='listening')return;state='challenge';cleanup();$('listen').disabled=false;$('threshold').disabled=false;$('heard').textContent=transcript?`Gehoord: “${transcript}”`:'';
 if(error){status(error);return;}
 if(decide(transcript,above,peak)){state='passed';$('title').textContent='Dat is HARDER.';status('Woord herkend en testdrempel gehaald.');$('phase').textContent='03 / GELUKT';$('listen').classList.add('hidden');resume();}
 else if(peak>=-.1)status('Microfoon overstuurd. Houd iets meer afstand en probeer opnieuw.');
 else if(!hasResult)status('Geen woord herkend. Tik en probeer opnieuw.');
 else if(normalize(transcript)!=='harder')status('Dat was niet alleen “Harder”. Probeer opnieuw.');
 else status('“Harder” herkend, maar te stil. Probeer luider of pas de testdrempel aan.');
}
$('listen').onclick=async()=>{
 if(!Speech){status('Spraakherkenning ontbreekt. Open deze link rechtstreeks in Safari.');return;}
 cleanup();const id=++attempt;state='listening';above=run=0;peak=-120;last=0;transcript='';hasResult=false;$('heard').textContent='';$('listen').disabled=true;$('threshold').disabled=true;status('Microfoon voorbereiden…');
 timer=setTimeout(()=>finish(id,'Geen antwoord binnen 12 seconden. Controleer de microfoontoegang en probeer opnieuw.'),12000);
 try{
 ctx=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();
 const acquired=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
 if(id!==attempt||state!=='listening'){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;
 source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=2048;source.connect(analyser);const data=new Float32Array(analyser.fftSize);
 let active=false;
 function meter(now){if(state!=='listening'||id!==attempt)return;analyser.getFloatTimeDomainData(data);let power=0;for(const v of data)power+=v*v;let db=20*Math.log10(Math.max(1e-6,Math.sqrt(power/data.length)));let pct=Math.max(0,Math.min(100,(db+60)/60*100));$('fill').style.width=pct+'%';$('fill').parentElement.setAttribute('aria-valuenow',Math.round(pct));$('level').textContent=db.toFixed(1)+' dBFS';if(active){peak=Math.max(peak,db);const dt=last?Math.min(70,now-last):0;run=db>threshold()?run+dt:0;above=Math.max(above,run);}last=now;frame=requestAnimationFrame(meter);}frame=requestAnimationFrame(meter);
 recognition=new Speech();recognition.lang='nl-NL';recognition.continuous=false;recognition.interimResults=false;recognition.maxAlternatives=1;
 recognition.onstart=()=>{active=true;status('Luisteren… zeg nu alleen “Harder”.');};
 recognition.onresult=e=>{transcript=Array.from(e.results).map(r=>r[0].transcript).join(' ');hasResult=true;};
 recognition.onerror=e=>finish(id,({'not-allowed':'Microfoon of spraakherkenning geweigerd. Geef Safari toegang in de instellingen.','network':'Spraakdienst niet bereikbaar. Controleer internet.','no-speech':'Geen spraak gehoord. Probeer opnieuw.','audio-capture':'Audio niet beschikbaar. Sluit andere apps die je microfoon gebruiken.'}[e.error]||`Spraakherkenning gestopt (${e.error}). Probeer opnieuw.`));
 recognition.onend=()=>finish(id);recognition.start();
 }catch(e){finish(id,`Microfoon starten mislukt: ${e.message}. Open rechtstreeks in Safari en geef toegang.`);}
};
$('reset').onclick=()=>{++attempt;cleanup();state='ready';video.pause();video.currentTime=0;$('start').classList.remove('hidden');$('start').disabled=false;$('start').textContent='Start de ervaring →';$('challenge').classList.add('hidden');$('listen').classList.remove('hidden');$('listen').disabled=false;$('continue').classList.add('hidden');$('threshold').disabled=false;$('title').textContent='Zeg “Harder”';$('phase').textContent='01 / DE VIDEO';$('fill').style.width='0';$('heard').textContent='';status('Tik hieronder en geef toegang tot je microfoon.');};
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state==='listening')finish(attempt,'Test onderbroken. Houd Safari op de voorgrond en probeer opnieuw.');video.pause();}else if(state==='intro'){$('start').disabled=false;$('start').textContent='Video hervatten →';}});
window.addEventListener('pagehide',cleanup);
