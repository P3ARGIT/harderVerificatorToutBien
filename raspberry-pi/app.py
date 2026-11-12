#!/usr/bin/env python3
import argparse, json, math, pathlib, subprocess, threading, queue
import numpy as np
import sounddevice as sd
from scipy.signal import resample_poly
from vosk import Model, KaldiRecognizer
import tkinter as tk
ROOT = pathlib.Path(__file__).resolve().parent
RATE = 48000

def dbfs(x):
    return 20 * math.log10(max(float(np.sqrt(np.mean(np.asarray(x, dtype=float)**2))), 1e-12))

def verdict(result, samples, offset):
    words = result.get('result', [])
    if result.get('text', '').strip().lower() != 'harder' or len(words) != 1:
        return False, 'Zeg alleen: HARDER'
    w = words[0]
    if w.get('conf', 0) < .85:
        return False, 'Niet duidelijk genoeg. Probeer opnieuw.'
    segment = samples[int(w['start']*RATE):int(w['end']*RATE)]
    if len(segment) < .15*RATE:
        return False, 'Woord te kort of onduidelijk.'
    if np.max(np.abs(samples)) >= .99:
        return False, 'Microfoon overstuurd! Verlaag gain en kalibreer opnieuw.'
    level = dbfs(segment) + offset
    return level > 80, f'HARDER herkend — {level:.1f} dB SPL (Z)'

def capture(device, seconds):
    # Blocking reads expose overflows; invalid recordings must never unlock.
    chunks = []
    with sd.InputStream(device=device, channels=1, samplerate=RATE, dtype='float32') as stream:
        for _ in range(int(seconds*10)):
            chunk, overflow = stream.read(RATE//10)
            if overflow:
                raise RuntimeError('Audio-overflow: opname ongeldig; probeer opnieuw.')
            chunks.append(chunk[:, 0].copy())
    return np.concatenate(chunks)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--devices', action='store_true')
    p.add_argument('--device', type=int)
    p.add_argument('--calibrate', type=float, metavar='REFERENCE_DB_SPL')
    a = p.parse_args()
    if a.devices:
        print(sd.query_devices()); return
    if a.device is None:
        p.error('Kies expliciet --device NUMMER; zie --devices')
    identity = dict(sd.query_devices(a.device, 'input'))['name']
    calpath = ROOT/'calibration.json'
    if a.calibrate is not None:
        if not 60 <= a.calibrate <= 110:
            p.error('Referentieniveau moet tussen 60 en 110 dB SPL liggen.')
        print('Meet 5 seconden stabiel referentiegeluid. Zie README voor Z-weging!')
        x = capture(a.device, 5)
        levels = [dbfs(v) for v in np.array_split(x, 10)]
        if np.max(np.abs(x)) >= .99 or max(levels)-min(levels) > 1.5 or dbfs(x) < -65:
            raise RuntimeError('Kalibratie geweigerd: overstuurd, instabiel of te stil.')
        calpath.write_text(json.dumps({'device': identity, 'rate': RATE,
            'offset': a.calibrate-dbfs(x), 'reference_db': a.calibrate}, indent=2))
        print('Kalibratie opgeslagen. Wijzig microfoongain hierna niet.'); return
    if not calpath.exists():
        p.error('Eerst echte SPL-kalibratie uitvoeren. Lees README.md.')
    cal = json.loads(calpath.read_text())
    if cal['device'] != identity or cal['rate'] != RATE:
        p.error('Microfoon gewijzigd: opnieuw kalibreren.')
    model = Model(str(ROOT/'model'))
    # Full Dutch vocabulary, deliberately NOT a forced one-word grammar.
    events = queue.Queue()
    root = tk.Tk(); root.title('HARDER'); root.configure(bg='#101820')
    root.attributes('-fullscreen', True)
    label = tk.Label(root, text='HARDER', font=('Sans', 48, 'bold'), fg='white', bg='#101820', wraplength=1000)
    label.pack(expand=True)
    status = tk.Label(root, text='', font=('Sans', 22), fg='#69e0ba', bg='#101820'); status.pack(pady=30)
    proc = None; closed = False
    def close(*_):
        nonlocal closed
        closed = True
        if proc and proc.poll() is None: proc.terminate()
        root.destroy()
    root.bind('<Escape>', close); root.protocol('WM_DELETE_WINDOW', close)
    def video(start, end=None):
        nonlocal proc
        cmd = ['mpv','--no-config','--fs','--no-terminal','--input-default-bindings=no',
               '--osc=no','--stop-screensaver=yes',f'--start={start}']
        if end is not None: cmd += [f'--end={end}']
        proc = subprocess.Popen(cmd+[str(ROOT/'video.mov')])
    def listen():
        try:
            x = capture(a.device, 3)
            rec = KaldiRecognizer(model, 16000); rec.SetWords(True)
            pcm = np.clip(resample_poly(x, 1, 3)*32767, -32768, 32767).astype('<i2')
            # One bounded attempt; use final result for complete word timestamps.
            rec.AcceptWaveform(pcm.tobytes())
            result = json.loads(rec.FinalResult())
            ok, message = verdict(result, x, cal['offset'])
            events.put((ok, message))
        except Exception as e:
            events.put((False, str(e)))
    def attempt():
        if closed: return
        label.config(text='Zeg nu: HARDER\nLuisteren… (3 seconden)')
        threading.Thread(target=listen, daemon=True).start()
    def check_audio():
        if closed: return
        try:
            ok, message = events.get_nowait()
            status.config(text=message)
            if ok:
                label.config(text='Gelukt!'); root.after(700, resume); return
            label.config(text='Nog eens! Meer dan 80 dB nodig.')
            root.after(1300, attempt)
        except queue.Empty: pass
        root.after(100, check_audio)
    def resume():
        if closed: return
        video(18)
        root.after(100, finish)
    def finish():
        if proc.poll() is None: root.after(100, finish)
        else:
            label.config(text='Bedankt!')
            status.config(text='Sluit met Escape. Start opnieuw voor een volgende ronde.')
    def wait_intro():
        if proc.poll() is None: root.after(30, wait_intro)
        elif proc.returncode != 0:
            label.config(text='Video kon niet afspelen.'); status.config(text='Controleer mpv en video.mov')
        else:
            root.after(800, attempt) # avoid video sound tail
            check_audio()
    video(0,18); wait_intro(); root.mainloop()

if __name__ == '__main__': main()
