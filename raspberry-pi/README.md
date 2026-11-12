# HARDER — Raspberry Pi 5

Prototype voor Raspberry Pi OS Desktop 64-bit, scherm, luidsprekers en USB-microfoon.
De meegeleverde video duurt 29,36 seconden. Eerste deel speelt tot 18 seconden;
het venster sluit daar en de schermvullende woordcontrole verschijnt. Na succes
speelt dezelfde video vanaf 18 seconden verder. Dit is technisch stoppen/hervatten
met twee mpv-processen, geen naadloze pauze op hetzelfde videovenster. De snede is
op videoframenauwkeurigheid; een korte vensterovergang is mogelijk.

## Installeren
Pak de ZIP uit in je thuismap. Open een terminal in de map harder-pi:

    bash install.sh
    .venv/bin/python app.py --devices

Noteer het nummer van je USB-input (bijvoorbeeld 2). Gebruik dat nummer hieronder.
Internet nodig bij installatie; daarna werkt herkenning offline. Gebruik de
64-bit Desktop-versie van Raspberry Pi OS, niet Lite. Start vanuit de desktop.

## Echte 80 dB: eerst kalibreren
De grens is strikt MEER DAN 80 dB SPL, Z/ongewogen, energetisch gemiddeld over
het herkende woord (geen piek, geen dBA). Deze software is geen gecertificeerde
klasse-1/2 geluidsmeter. De nauwkeurigheid wordt bepaald door microfoon,
frequentierespons, referentie en kalibratie. Alleen een offset levert bij een
ongekalibreerde consumentenmicrofoon geen gegarandeerde absolute nauwkeurigheid.
Gebruik een vlakke meetmicrofoon en een geschikte akoestische kalibrator of
gekalibreerde referentiemeter met Z-weging. Een UMIK-calibratiebestand wordt in
DIT prototype niet automatisch ingelezen: ook daarmee is onderstaande
referentiekalibratie nodig. Voor formele meetzekerheid is validatie noodzakelijk.

1. Kies de USB-microfoon direct, niet een virtuele/default input. Schakel AGC,
   automatische gain, noise suppression en andere audioverbeteringen uit.
2. Zet gain vast; gebruik bijvoorbeeld 20 cm mondafstand met een fysieke markering.
3. Met een passende akoestische kalibrator: stel het bekende referentieniveau in.
   Of gebruik stabiel breedbandgeluid met een gekalibreerde Z-referentiemeter
   direct naast de microfoon. Lees het werkelijke niveau af. Niet schatten!
4. Bij een werkelijk gemeten 80 dB Z:

       .venv/bin/python app.py --device 2 --calibrate 80

   Bij een passende 94 dB-kalibrator gebruik je --calibrate 94. De opname duurt
   vijf seconden. De app weigert sterk wisselend of overstuurd referentiegeluid.
5. Controleer daarna met de referentiemeter op meerdere niveaus rond 80 dB en
   met spraak. Herhaal kalibratie na wijzigingen aan gain, kabel/audio-interface,
   instellingen of microfoon. Software kan gainwijzigingen niet zelf detecteren.

Zonder calibration.json kan het spel niet starten. De apparaatnaam wordt
gecontroleerd, maar twee identieke microfoons kunnen dezelfde naam hebben.

## Starten

    .venv/bin/python app.py --device 2

Video start onmiddellijk. Bij 18 seconden verschijnt HARDER. Wacht tot
'Luisteren' verschijnt, zeg alleen 'Harder' en wacht op feedback. Elke poging
heeft drie seconden opnametijd; tussen pogingen zit een korte pauze.
Escape sluit de applicatie wanneer het appvenster actief is. Tijdens video:
gebruik Alt+Tab naar HARDER en Escape als de desktop de toets aan mpv geeft.
Na afloop blijft Bedankt staan; herstart het commando voor de volgende deelnemer.

## Acceptatieregel
- Vrije Nederlandse spraakherkenning met Vosk small-nl-0.22, geen gedwongen
  herkenning waarbij elk geluid naar 'harder' wordt omgezet.
- Volledige transcriptie moet precies 'harder' zijn; confidence minimaal 0,85.
- Minstens 150 ms woordduur; het volume wordt over die woordtimestamps bepaald.
- Woordniveau strikt >80 dB SPL (Z); 80,0 exact is niet voldoende.
- Oversturing en audio-overflow blokkeren succes.
- Audio wordt alleen tijdelijk in RAM verwerkt, niet opgeslagen.

Herkenning is probabilistisch: confidence is geen garantie en verkeerde woorden
kunnen soms verkeerd herkend worden. Omgevingsgeluid tijdens het woord telt mee
in de geluidsdruk. De software kan NIET bewijzen dat alle gemeten energie alleen
van de deelnemer komt. Gebruik een rustige, afgeschermde plek; bij luide events is
extra akoestische inrichting en praktijktesten nodig. Ook een afgespeelde opname
van 'harder' kan slagen: er is geen liveness- of persoonsverificatie.

## Praktijktest vóór gebruik
Controleer video-overgang, audio en microfoon op de Pi. Probeer meerdere stemmen
met 'harder' onder en boven 80 dB, 'water', 'hallo', alleen klappen, muziek en
stilte. Test ook een klap gevolgd door zacht 'harder'. Controleer de SPL met de
referentiemeter. Test gainwijziging, losgekoppelde mic en oversturing.
Syntaxis en numerieke beslislogica zijn getest tijdens oplevering. Afspelen op Pi,
werkelijke microfoonmetingen en spraaknauwkeurigheid zijn hier niet getest.

Bronnen: https://alphacephei.com/vosk/models en https://mpv.io/manual/stable/
