'use strict';
const $=id=>document.getElementById(id), video=$('video');
const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
let wordVerified=false;
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
function readyButton(){ $('listen').disabled=false; $('threshold').disabled=false; }
function listenWord(){
 if(!Speech){status('Spraakherkenning ontbreekt. Open rechtstreeks in Safari en controleer of Siri/dicteren beschikbaar is.');return;}
 cleanup(); const id=++attempt; state='listening';transcript='';hasResult=false;
 $('listen').disabled=true;$('threshold').disabled=true;$('heard').textContent='';status('Spraakherkenning starten…');
 try{
 recognition=new Speech();recognition.lang='nl-NL';recognition.continuous=false;recognition.interimResults=true;
 recognition.onstart=()=>status('Stap 1/2: zeg alleen “Harder”. De volumemeter is nu bewust uit.');
 recognition.onresult=e=>{transcript=Array.from(e.results).map(r=>r[0].transcript).join(' ');$('heard').textContent=`Gehoord: “${transcript}”`;hasResult=Array.from(e.results).some(r=>r.isFinal);};
 recognition.onerror=e=>{if(id!==attempt)return;state='challenge';cleanup();readyButton();status(`Spraakfout: ${e.error}. Controleer Safari-microfoontoegang, Siri/dicteren en internet. Sluit deze tab en open de link opnieuw als de microfoon stil blijft.`);};
 recognition.onend=()=>{if(id!==attempt||state!=='listening')return;state='challenge';cleanup();readyButton();if(hasResult&&normalize(transcript)==='harder'){wordVerified=true;$('title').textContent='Woord herkend ✓';$('listen').textContent='Stap 2 · meet mijn volume';status('Tik hieronder en zeg “Harder” nogmaals, luid genoeg. Deze tweede uitspraak wordt alleen op volume gecontroleerd.');}else status('Geen duidelijk “Harder” herkend. Tik en probeer opnieuw.');};
 // Start synchronously from the actual tap, before any await/permission work.
 recognition.start();
 timer=setTimeout(()=>{if(id!==attempt||state!=='listening')return;state='challenge';cleanup();readyButton();status('Geen antwoord van de spraakdienst. Controleer Siri/dicteren en microfoontoegang. Sluit de Safari-tab volledig en probeer opnieuw.');},15000);
 }catch(e){state='challenge';cleanup();readyButton();status('Spraakherkenning kon niet starten: '+e.message);}
}
async function listenVolume(){
 cleanup();const id=++attempt;state='listening';above=run=0;peak=-120;last=0;
 $('listen').disabled=true;$('threshold').disabled=true;status('Stap 2/2: microfoon voorbereiden…');
 timer=setTimeout(()=>{if(id!==attempt)return;state='challenge';cleanup();readyButton();status('Geen microfoontoegang ontvangen. Geef Safari toestemming en probeer opnieuw.');},15000);
 try{
 ctx=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();
 const acquired=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
 if(id!==attempt||state!=='listening'){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;
 await ctx.resume();source=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=2048;source.connect(analyser);
 const data=new Float32Array(analyser.fftSize);const track=stream.getAudioTracks()[0];
 status('Zeg nu opnieuw “Harder”, luid genoeg. Volumetest: 4 seconden.');
 function meter(now){if(id!==attempt||state!=='listening')return;analyser.getFloatTimeDomainData(data);let power=0;for(const v of data)power+=v*v;const db=20*Math.log10(Math.max(1e-6,Math.sqrt(power/data.length)));const pct=Math.max(0,Math.min(100,(db+60)/60*100));$('fill').style.width=pct+'%';$('fill').parentElement.setAttribute('aria-valuenow',Math.round(pct));$('level').textContent=db.toFixed(1)+' dBFS';peak=Math.max(peak,db);const dt=last?Math.min(70,now-last):0;run=db>threshold()?run+dt:0;above=Math.max(above,run);last=now;frame=requestAnimationFrame(meter);}
 frame=requestAnimationFrame(meter);clearTimeout(timer);
 timer=setTimeout(()=>{if(id!==attempt)return;const muted=track.muted;state='challenge';cleanup();readyButton();if(muted||peak < -100){status('Safari levert geen microfoongeluid. Sluit deze tab volledig, open opnieuw en sta de microfoon toe.');return;}if(above>=250&&peak<-.1){state='passed';wordVerified=false;$('title').textContent='Beide tests geslaagd';status('Woord en volume afzonderlijk getest. Tik om de video verder te spelen.');$('listen').classList.add('hidden');$('continue').classList.remove('hidden');$('phase').textContent='03 / GELUKT';}else status(peak>=-.1?'Microfoon overstuurd. Houd meer afstand en probeer stap 2 opnieuw.':'Nog te stil. Probeer stap 2 luider, of verlaag de relatieve testdrempel.');},4000);
 }catch(e){if(id!==attempt)return;state='challenge';cleanup();readyButton();status('Microfoonfout: '+e.message);}
}
$('listen').onclick=()=>wordVerified?listenVolume():listenWord();
$('reset').onclick=()=>{++attempt;cleanup();wordVerified=false;$('listen').textContent='Stap 1 · herken Harder';state='ready';video.pause();video.currentTime=0;$('start').classList.remove('hidden');$('start').disabled=false;$('start').textContent='Start de ervaring →';$('challenge').classList.add('hidden');$('listen').classList.remove('hidden');$('listen').disabled=false;$('continue').classList.add('hidden');$('threshold').disabled=false;$('title').textContent='Zeg “Harder”';$('phase').textContent='01 / DE VIDEO';$('fill').style.width='0';$('heard').textContent='';status('Tik hieronder en geef toegang tot je microfoon.');};
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state==='listening'){++attempt;state='challenge';cleanup();readyButton();status('Test onderbroken. Houd Safari op de voorgrond en probeer opnieuw.');}video.pause();}else if(state==='intro'){$('start').disabled=false;$('start').textContent='Video hervatten →';}});
window.addEventListener('pagehide',cleanup);
