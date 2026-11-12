# Safari test v2

Deze versie vervangt de gelijktijdige microfooncontrole door twee afzonderlijke stappen: eerst woordherkenning, daarna relatieve volumemeting. Zeg het woord twee keer. De tweede uitspraak wordt NIET op inhoud gecontroleerd. Dit is een workaround/testmodus, geen gecombineerde 80 dB-verificatie. De Raspberry Pi-versie blijft ongewijzigd.

Spraakherkenning start direct vanuit de tik zonder voorafgaande async microfoonaanvraag. Tijdens stap 1 is geen getUserMedia-stream actief. Stap 2 begint pas op een nieuwe tik nadat de herkenner is gesloten. Code en gemockte overgang getest; werking op fysieke iPhone moet nog bevestigd worden.
