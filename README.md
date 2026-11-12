# harderVerificatorToutBien

## Raspberry Pi 5
De oorspronkelijke versie van 12 november 2026 staat ongewijzigd in `raspberry-pi/`.
Zie daar README.md voor installatie en verplichte geluidsdruk-kalibratie.
Video stopt bij 18 seconden; 'harder' en >80 dB SPL (Z) tijdens het woord zijn
vereist om verder te spelen. Geen gecertificeerde geluidsmeter.

## iPhone-test
`iphone/` is een statische HTTPS-webapp voor Safari, met dezelfde video.
Open in Safari, start de video, geef na 18 seconden microfoon- en
spraakherkenningstoegang en zeg alleen 'Harder'. Relatieve drempel instelbaar.
Deze versie meet dBFS, NIET 80 dB SPL. Safari-woordherkenning en Web Audio zijn
aparte audiopaden: de tijdkoppeling geldt voor de luisterpoging, niet exact
voor het woord. Achtergrondgeluid in de poging kan meetellen. Browserherkenning
kan netwerk/Apple-spraakdiensten gebruiken. Geen opnames worden opgeslagen.

## Validatie
Pi: syntax en numerieke acceptatietest geslaagd. Niet op fysieke Pi getest.
iPhone-webapp: JavaScript syntax gecontroleerd en videopauze op 18,0 seconden
plus overgang naar woordscherm gecontroleerd in desktopbrowser. Fysieke
Safari-microfoon/spraakherkenning op iPhone nog te testen.
