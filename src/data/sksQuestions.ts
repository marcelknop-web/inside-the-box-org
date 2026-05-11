// SKS amtlicher Fragenkatalog – ground truth
export interface SksQA { q: string; a: string }
export type SksTopic = "navigation" | "recht" | "wetter";
export const SKS_CATALOG: Record<SksTopic, SksQA[]> = {
  "navigation": [
    {
      "q": "Worauf müssen Sie als Schiffsführer vor Reiseantritt hinsichtlich der Seekarten und Seebücher achten?",
      "a": "Auf Vollständigkeit der Unterlagen und deren Berichtigung auf den neuesten Stand."
    },
    {
      "q": "Warum muss in der GPS-Navigation das jeweilige Kartendatum unbedingt berücksichtigt werden?",
      "a": "Weil sich das von GPS verwendete Bezugssystem WGS 84 (World Geodetic System 1984) von anderen verwendeten Bezugssystemen (Kartendatum) unterscheiden kann."
    },
    {
      "q": "Welche Differenzen können zwischen WGS 84 und anderen Bezugssystemen auftreten?",
      "a": "Die Differenzen von φ und λ liegen im Allgemeinen in der Größenordnung von 0,1 kbl bis 1 kbl, also etwa von 20 bis 200 m. Es können größere Unterschiede auftreten."
    },
    {
      "q": "Wo finden Sie in der Seekarte Angaben über das benutzte Bezugssystem und ggf. entsprechende Korrekturhinweise?",
      "a": "Am Kartenrand unter dem Titel."
    },
    {
      "q": "Wie lautet ggf. der Korrekturhinweis bezüglich GPS in der Seekarte, wenn das benutzte Kartendatum (z.B. ED 50) und WGS 84 nicht übereinstimmen?",
      "a": "Durch Satellitennavigation (z.B. GPS) erhaltene Positionen im WGS 84 sind 0,... Minuten nordwärts/südwärts und 0,... Minuten westwärts/ostwärts zu verlegen, um mit dieser Karte übereinzustimmen."
    },
    {
      "q": "Woran erkennen Sie, bis wann eine deutsche Seekarte „amtlich\" berichtigt ist?",
      "a": "Am Berichtigungsstempel des BSH oder einer amtlichen Seekartenberichtigungsstelle."
    },
    {
      "q": "Woran erkennen Sie, bis wann eine britische Seekarte „amtlich\" berichtigt ist?",
      "a": "Am Berichtigungsstempel auf der Rückseite der Seekarte."
    },
    {
      "q": "Was bedeutet der Stempel auf der britischen Seekarte: „Corrected up to N.T.M. 3595 1998\"?",
      "a": "Seekarte ist berichtigt bis zur Mitteilung Nr. 3595 der Admiralty Notices to Mariners (N.T.M.) in 1998."
    },
    {
      "q": "Welche Angaben enthalten die Nachrichten für Seefahrer (NfS)?",
      "a": "In den NfS werden für die sichere Schiffsführung wichtige Maßnahmen, Ereignisse und Veränderungen auf den Seeschifffahrtsstraßen, auf der hohen See sowie in den Hoheitsgewässern anderer Staaten im europäischen und angrenzenden Bereich bekannt gegeben."
    },
    {
      "q": "In welcher Sprache werden die Nachrichten für Seefahrer (NfS) verfasst?",
      "a": "Die Angaben erfolgen in deutscher und in englischer Sprache."
    },
    {
      "q": "Welche Angaben enthalten deutsche und britische Leuchtfeuerverzeichnisse?",
      "a": "Beschreibung der Leuchtfeuer, Feuerschiffe und Großtonnen sowie deren geografische Lage."
    },
    {
      "q": "Welche schwimmenden Schifffahrtszeichen werden in den britischen List of Lights und in deutschen Leuchtfeuerverzeichnissen nicht angegeben?",
      "a": "Tonnen kleiner als 8 m Höhe."
    },
    {
      "q": "Wo finden Sie Angaben über die Merkmale der Schifffahrtszeichen?",
      "a": "1. In den Leuchtfeuerverzeichnissen bzw. in der List of Lights sowie auszugsweise in den Seekarten.\n2. In der Karte 1/INT1 des BSH.\n3. Schwimmende Schifffahrtszeichen zusätzlich in der Anlage I zur SeeSchStro (z.B. Tonnen des Lateral- bzw. Kardinalsystems)."
    },
    {
      "q": "Worauf beziehen sich die Höhenangaben der Leuchtfeuer in Leuchtfeuerverzeichnissen in der Nord- und Ostsee?",
      "a": "In Gewässern mit Gezeiten (z.B. Nordsee) auf mittleres Hochwasser, in gezeitenlosen Gewässern (z.B. Ostsee) auf mittleren Wasserstand."
    },
    {
      "q": "Wo finden Sie Angaben über Brückensignale?",
      "a": "In den See- und Hafenhandbüchern und in den Seekarten."
    },
    {
      "q": "Welche Themen (Grobgliederung) enthalten die Seehandbücher des BSH?",
      "a": "1. Schifffahrtsangelegenheiten\n2. Naturverhältnisse\n3. Küstenkunde und Segelanweisungen"
    },
    {
      "q": "In welchem Quadranten liegt der rote Warnsektor eines Leitfeuers mit der Angabe „ot 030° - 042°\"?",
      "a": "Im Südwest-Quadranten. Angegeben sind die Peilungen zum Leuchtfeuer."
    },
    {
      "q": "Was sind Leitfeuer (direction lights)?",
      "a": "Leitfeuer sind Einzelfeuer, die durch Sektoren verschiedener Farbe oder Kennung (Leit- oder Warnsektoren) im Allgemeinen ein Fahrwasser, eine Hafeneinfahrt oder einen freien Seeraum zwischen Untiefen bezeichnen."
    },
    {
      "q": "Was sind Richtfeuer (leading lights)? Wann befindet man sich in einer Richtlinie eines Richtfeuers?",
      "a": "1. Richtfeuer sind Feuer, die als Unter- und Oberfeuer in Deckpeilung als Richtlinie beispielsweise einen Kurs im Fahrwasser, durch eine Hafeneinfahrt oder im freien Seeraum zwischen Untiefen bezeichnen.\n2. Ein Schiff befindet sich in der Richtlinie, wenn Unter- und Oberfeuer senkrecht unter-/ übereinander erscheinen."
    },
    {
      "q": "Was ist ein Torfeuer?",
      "a": "Ein Torfeuer besteht aus zwei Feuern gleicher Höhe, gleicher Lichtstärke und gleicher Kennung, die zu beiden Seiten der Fahrwasserachse einander genau gegenüber (rechtwinklig zur Fahrwasserachse) und von der Fahrwasserachse gleichweit entfernt angeordnet sind."
    },
    {
      "q": "Was ist die „Nenntragweite\" eines Feuers?",
      "a": "Nenntragweite ist die Tragweite eines Feuers für einen definierten Wert bei einer meteorologischen Sichtweite am Tage von 10 sm."
    },
    {
      "q": "Wovon hängt die „Tragweite\" eines Feuers ab?",
      "a": "Sie hängt u.a. ab von:\n1. der Lichtstärke (Helligkeit) des Feuers und\n2. Sichtwert (Lichtdurchlässigkeit der Atmosphäre)"
    },
    {
      "q": "In der Seekarte finden Sie bei einem Leuchtfeuer die Eintragung: 18M. Was bedeutet diese Angabe?",
      "a": "Es ist die Nenntragweite, hier 18 Seemeilen."
    },
    {
      "q": "Was ist die Sichtweite eines Feuers? Wovon hängt sie ab?",
      "a": "Sichtweite ist die Entfernung, auf die ein Leuchtfeuer über die Erdkrümmung (Kimm) hinweg vom Beobachter gesehen werden kann. Sie hängt ab von:\n1. der Feuerhöhe und\n2. der Augeshöhe des Beobachters"
    },
    {
      "q": "Wie müssen sich Tragweite und Sichtweite zueinander verhalten, damit das Verfahren zur Ortsbestimmung „Feuer in der Kimm\" angewandt werden kann?",
      "a": "Unter Tragweite versteht man denjenigen Abstand, in dem ein Feuer einen eben noch deutlichen Lichteindruck im Auge des Beobachters hervorruft."
    },
    {
      "q": "Wo findet man Tabellen zur Ermittlung des Abstandes eines Feuers in der Kimm?",
      "a": "In deutschen und britischen Leuchtfeuerverzeichnissen."
    },
    {
      "q": "Wo sind die in Seekarten verwendeten Symbole und Abkürzungen erklärt?",
      "a": "In der Karte 1/INT1 des BSH."
    },
    {
      "q": "Wer veröffentlicht die Bekanntmachungen für Seefahrer (BfS) und was umfassen diese Veröffentlichungen?",
      "a": "1. Die BfS werden von den jeweils zuständigen Behörden der Wasser- und Schifffahrtsverwaltung des Bundes bzw. der Länder veröffentlicht.\n2. Sie enthalten alle wichtigen Maßnahmen und Ereignisse auf den Seeschifffahrtsstraßen und der ausschließlichen Wirtschaftszone Deutschlands."
    },
    {
      "q": "Wie werden die Bekanntmachungen für Seefahrer (BfS) der Sportschifffahrt zur Kenntnis gebracht?",
      "a": "Die BfS werden an den amtlichen Aushangstellen (z.B. bei Wasser- und Schifffahrtsämtern, Hafenverwaltungen, WSP-Dienststellen, Schleusen, Yachthäfen) für das betreffende Seegebiet sowie im Internet unter www.elwis.de zur Kenntnis gebracht."
    },
    {
      "q": "Zählen Sie die am häufigsten vorkommenden Ereignisse und Maßnahmen auf, über die die Bekanntmachungen für Seefahrer (BfS) unterrichten.",
      "a": "1. Änderungen an Befeuerung, Betonnung und Landmarken\n2. veränderte Wassertiefen\n3. Wracke, Schifffahrtshindernisse, Rohrleitungen usw."
    },
    {
      "q": "Wer gibt die nautischen Warnnachrichten (NWN) heraus und von wem werden sie verbreitet?",
      "a": "Nautische Warnnachrichten (NWN) werden von den Verkehrszentralen für deren Zuständigkeitsbereich und von dem ständig besetzten Seewarndienst Emden für das gesamte deutsche Warngebiet zur Verbreitung über Funk herausgegeben. Der Rundfunksender Deutschlandfunk verbreitet alle über Funk abgegebenen NWN."
    },
    {
      "q": "Was bedeutet der Zusatz „vital\" bei einer nautischen Warnnachricht (NWN)?",
      "a": "Die NWN erhält den Zusatz „vital\", wenn die Warnung auf eine lebensbedrohende Gefahr hinweist."
    },
    {
      "q": "Welche Besonderheit bezüglich des Zusatzes „vital\" bei einer nautischen Warnnachricht (NWN) gibt es für die Sportschifffahrt?",
      "a": "Vitale nautische Warnnachrichten für die Sportschifffahrt werden während der Zeit vom 1. April bis zum 31. Oktober zur Verbreitung über ausgewählte private und öffentlich-rechtliche Rundfunkanstalten weitergeleitet."
    },
    {
      "q": "Wer gibt die Nachrichten für Seefahrer (NfS) heraus und wie und wie oft erfolgt die Herausgabe?",
      "a": "Die NfS werden vom BSH in Heftform und im Internet herausgegeben und erscheinen einmal wöchentlich."
    },
    {
      "q": "1. Was sind P-Nachrichten? 2. Wie verfährt man mit diesen Nachrichten im Berichtigungsverfahren?",
      "a": "1. P-Nachrichten sind solche, die eine bevorstehende (preliminary) Maßnahme ankündigen.\n2. Wegen der begrenzten Geltungsdauer werden keine Berichtigungen auf der Grundlage von P-Nachrichten vom BSH bzw. von amtlichen Seekartenberichtigungsstellen durchgeführt. Deshalb müssen vor Gebrauch jeder Seekarte die noch gültigen P-Nachrichten erfasst und in der Karte vermerkt werden."
    },
    {
      "q": "1. Was sind T-Nachrichten? 2. Wie verfährt man mit diesen Nachrichten im Berichtigungsverfahren (Begründung)?",
      "a": "1. T-Nachrichten sind solche, die über einen zeitweiligen (temporary) Zustand unterrichten.\n2. Wegen der begrenzten Geltungsdauer werden keine Berichtigungen auf der Grundlage von T-Nachrichten vom BSH bzw. von amtlichen Seekartenberichtigungsstellen durchgeführt. Deshalb müssen vor Gebrauch jeder Seekarte die noch gültigen T-Nachrichten erfasst und in der Karte vermerkt werden."
    },
    {
      "q": "Worauf muss beim Ansteuern einer Küste bei der Auswahl von Seekarten geachtet werden?",
      "a": "Seekarten mit größtmöglichem Maßstab verwenden. Nur in diesen Karten sind alle Schifffahrtszeichen und weitere für die Navigation wichtige Informationen eingetragen."
    },
    {
      "q": "Was müssen Sie bei Kursberechnungen hinsichtlich der in der Seekarte angegebenen Ortsmissweisungen beachten?",
      "a": "Die für ein bestimmtes Jahr angegebene Missweisung muss mittels der in der Seekarte angegebenen jährlichen Änderung für das aktuelle Jahr berichtigt werden."
    },
    {
      "q": "Was müssen Sie bei der Benutzung von deutschen Sportbootkarten beachten?",
      "a": "Sie werden weder vom BSH noch von den Seekartenvertriebsstellen berichtigt. Sie müssen also vom Nutzer nach dem Kauf vor Benutzung über die NfS auf den aktuellen Stand berichtigt werden."
    },
    {
      "q": "Nach welcher Faustregel können Sie m/s in Knoten umrechnen?",
      "a": "Doppelt soviele Knoten (kn) wie m/s oder m/s multipliziert mit 2 = kn."
    },
    {
      "q": "Was müssen Sie beachten, wenn Sie die mit Loggen ermittelte Fahrt z.B. für das Arbeiten in Seekarten berücksichtigen wollen?",
      "a": "Die üblichen Logmethoden liefern ausschließlich die Fahrt durch das Wasser (FdW). Um die Fahrt über Grund (FüG) zu ermitteln, müssen Stromrichtung und Stromgeschwindigkeit berücksichtigt werden."
    },
    {
      "q": "Welche Fahrt zeigen GPS-Geräte an?",
      "a": "Die Fahrt über Grund (FüG)."
    },
    {
      "q": "Welchen Kurs zeigen GPS-Geräte an?",
      "a": "Den Kurs über Grund (KÜG)."
    },
    {
      "q": "Warum müssen Sie Ihre Position regelmäßig in die Seekarte eintragen?",
      "a": "Um Abweichungen von der Kurslinie frühzeitig und sicher zu erkennen und um ggf. den Kurs zu berichtigen."
    },
    {
      "q": "Was ist die Besteckversetzung (BV)?",
      "a": "Richtung (rw) und Entfernung (in sm) vom Koppelort (O_k) zum beobachteten Ort (O_b), bezogen auf den gleichen Zeitpunkt."
    },
    {
      "q": "Welche Ursachen kann die Besteckversetzung (BV) haben?",
      "a": "Die BV kann folgende Ursachen haben:\n1. ungenaues Steuern und Koppeln\n2. Kursfehler (z. B. ungenaue Steuertafel)\n3. fehlende oder unvollständige Berücksichtigung von Strom und Wind"
    },
    {
      "q": "Warum sollte der Winkel zwischen zwei Peilungen nicht kleiner als 30° und nicht größer als 150° sein?",
      "a": "Damit der gefundene Standort eine ausreichend sichere Positionsbestimmung ergibt."
    },
    {
      "q": "Warum sind regelmäßige Kompasskontrollen erforderlich?",
      "a": "Zur Überprüfung der Funktionstüchtigkeit des Kompasses und der Werte in der Ablenkungstabelle."
    },
    {
      "q": "Wodurch können auch in gezeitenlosen Revieren erhebliche Wasserstandsschwankungen und Strömungen (z.B. Triftstrom) hervorgerufen werden?",
      "a": "Durch Stärke, Dauer und Richtung des Windes oder „Zurückschwappen\" aufgestauter Wassermassen (z.B. Ostsee)."
    },
    {
      "q": "Welche navigatorischen Vorbereitungen treffen Sie vor einer Fahrt in Dunkelheit?",
      "a": "1. Kurse und Kursänderungspunkte möglichst vorausbestimmen\n2. Untiefen und Hindernisse in der Karte besonders kennzeichnen\n3. in der Seekarte markieren, welche Leuchtfeuer wann und wo in der Kimm erscheinen\n4. Wegstrecke nach unbefeuerten Tonnen absuchen"
    },
    {
      "q": "Welche Möglichkeiten der terrestrischen Ortsbestimmung muss man kennen?",
      "a": "1. Kreuzpeilung\n2. Peilung und Abstand (Feuer in der Kimm, Radarabstand)\n3. Peilung und Lotung"
    },
    {
      "q": "Nennen Sie zwei Möglichkeiten der Ortsbestimmung, wenn Sie nur ein Objekt mit bekannten Merkmalen (z.B. Leuchtturm) in Sicht haben.",
      "a": "1. Peilung und Abstand (Feuer in der Kimm, Radarabstand)\n2. Peilung und Lotung"
    },
    {
      "q": "Welche Nordrichtungen werden in der Navigation unterschieden? Erläutern Sie diese kurz.",
      "a": "1. rwN: rechtweisend Nord ist die Richtung eines Meridians zum geografischen Nordpol\n2. mwN: missweisend Nord ist die Richtung des erdmagnetischen Feldes zum magnetischen Nordpol, abhängig von Schiffsort und Datum (Jahr)\n3. MgN: ist die Richtung zu Magnetkompass-Nord; in diese Richtung zeigt die durch das schiffsmagnetische Feld beeinflusste Kompassnadel an Bord"
    },
    {
      "q": "Nennen Sie den Winkel zwischen den Nordrichtungen rwN und MgN.",
      "a": "Der Winkel von rwN nach MgN ist die Fehlweisung (Fw) (Abl + Mw = Fw)."
    },
    {
      "q": "Wo finden Sie die erforderlichen Werte der Missweisung? Was ist dabei zu achten?",
      "a": "1. Die Missweisung findet sich in der Seekarte eingedruckt für ein bestimmtes Jahr.\n2. Dieser Wert muss mit der ebenfalls in der Seekarte angegebenen jährlichen Änderung auf das Jahr der Benutzung berichtigt werden."
    },
    {
      "q": "Wo finden Sie die erforderlichen Werte der Ablenkung? Worauf ist dabei zu achten?",
      "a": "1. Die Abl wird einer Ablenkungstabelle entnommen.\n2. Die Abl ist abhängig vom anliegenden Kurs."
    },
    {
      "q": "Warum muss für jedes Fahrzeug eine eigene Ablenkungstabelle (Steuertafel) erstellt werden?",
      "a": "Die Ablenkungstabelle kann auf jedem Schiff andere Werte haben."
    },
    {
      "q": "Worauf müssen Sie achten, wenn eine Magnetkompasspeilung (MgP) aus einer rechtweisenden Peilung (rwP) berechnet werden soll?",
      "a": "Abl für den anliegenden MgK (Magnetkompasskurs) aus der Steuertafel (Ablenkungstabelle) entnehmen; an die so erhaltene mwP (missweisende Peilung) die für das laufende Jahr der Seekarte entnommene Mw anbringen."
    },
    {
      "q": "Unter welchen Voraussetzungen ergibt sich eine brauchbare Standlinie aus einer Peilung?",
      "a": "Der Meeresgrund muss ausreichend regelmäßig und ausreichend steil ansteigen/abfallen."
    },
    {
      "q": "Neben den Fahrwassertonnen auf den Seeschifffahrtsstraßen weisen weitere Tonnen aus, die für die Sportschifffahrt anders wichtig sind. Welche Schifffahrtszeichen sind das?",
      "a": "Sonderzeichen zur Bezeichnung von Sperrgebieten und Kardinalzeichen für allgemeine Gefahrenstellen."
    },
    {
      "q": "Aus welchen nautischen Publikationen können Sie Sperr- und Verbotsgebiete mit ihren Grenzen ersehen?",
      "a": "Aus den Seekarten, Bekanntmachungen für Seefahrer (BfS) und Nautischen Warnnachrichten (NWN)."
    },
    {
      "q": "Welche Sonderzeichen kennzeichnen Reeden, besondere Gebiete oder Stellen, z.B. Warngebiete?",
      "a": "Gelbe Fasstonnen, Leuchttonnen, Spierentonnen oder Stangen."
    },
    {
      "q": "Welche Sonderzeichen kennzeichnen Sperrgebiete?",
      "a": "Gelbe Fasstonnen, Leuchttonnen, Spierentonnen oder Stangen mit einem breiten roten Band. Beschriftung auf Fasstonne oder Leuchtttonne mit schwarzen Buchstaben: „Sperrgebiet\" oder „Sperr-G.\""
    },
    {
      "q": "Was bedeutet das Ausliegen der folgenden Schifffahrtszeichen: weiße Fasstonne, Kugeltonne oder Stange mit einem - von oben gesehen - rechtwinkligen gelben Kreuz bzw. bei Stangen mit einem breiten gelben Band?",
      "a": "Fahrverbot für Maschinenfahrzeuge und Wassermotorräder auf wegen Badebetriebs gesperrten Wasserflächen."
    },
    {
      "q": "Wie stehen Sonne und Mond winkelmäßig zur Erde bei Springzeit und bei Nippzeit?",
      "a": "Bei Springzeit befinden sich Mond und Sonne in einer Ebene mit der Erde, bei Nippzeit stehen die Verbindungslinien Erde/Sonne und Erde/Mond im rechten Winkel zueinander."
    },
    {
      "q": "Erklären Sie den Begriff „Alter der Gezeit\"!",
      "a": "Das Alter der Gezeit gibt an, in welcher Phase (Nippzeit, Mittzeit, Springzeit) sich das aktuelle Tidengeschehen befindet."
    },
    {
      "q": "Warum findet man z. B. bei Bezugsorten in der Nordsee bzw. dem Englischen Kanal zeitweise nur ein Hoch- bzw. Niedrigwasser pro Tag?",
      "a": "Die Umlaufzeit des Mondes um die Erde dauert im Mittel 24 h 50 min (Mondtag) gegenüber dem Sonnentag (= 24 h). Deshalb „rutscht\" das letzte HW oder NW zeitweise in den nächsten Tag."
    },
    {
      "q": "Weshalb und wie können die tatsächlichen Wasserstände von den Angaben in den Gezeitentafeln teilweise erheblich abweichen?",
      "a": "Durch Wind und/oder sehr hohen bzw. sehr niedrigen Luftdruck können erhebliche Wasserstandsänderungen entstehen. Das Hochwasser bzw. das Niedrigwasser können höher oder niedriger sein als angegeben und früher oder später eintreten."
    },
    {
      "q": "Worauf beziehen sich die Tiefenangaben in Seekarten in den deutschen Gewässern der Ost- und Nordsee?",
      "a": "Auf Kartennull (KN)."
    },
    {
      "q": "Was ist Kartennull?",
      "a": "Kartennull (KN) ist die Bezugsfläche für die Tiefenangaben in einer Seekarte."
    },
    {
      "q": "Wie ist Kartennull (KN) in der Ost- und Nordsee und im Englischen Kanal definiert? Wo finden Sie die entsprechenden Angaben zur Kartennullebene?",
      "a": "In der Ostsee entspricht KN dem mittleren Wasserstand. In der Nordsee und im Englischen Kanal entspricht KN dem niedrigstmöglichen Gezeitenwasserstand (LAT, Lowest Astronomical Tide). In der jeweiligen Seekarte ist die Kartennullebene beschrieben."
    },
    {
      "q": "Was müssen Sie bedenken, wenn Sie die Wassertiefe außerhalb der Niedrigwasserzeit loten?",
      "a": "Beim folgenden Niedrigwasser wird die Wassertiefe geringer sein als zum Zeitpunkt der Lotung."
    },
    {
      "q": "Was ist die Kartentiefe?",
      "a": "Die Kartentiefe (KT) ist die auf Kartennull bezogene Wassertiefe. Kartentiefe ist Wassertiefe abzüglich Höhe der Gezeit."
    },
    {
      "q": "Mit welcher Wassertiefe können Sie bei einer Lotung normalerweise mindestens rechnen?",
      "a": "Mit der Kartentiefe."
    },
    {
      "q": "Welche Bedeutung hat die Angabe „Springzeit\" für die Wasserstände in Gezeitengebieten?",
      "a": "Zur Springzeit sind besonders hohe Hochwasser und besonders niedrige Niedrigwasser zu erwarten."
    },
    {
      "q": "Welche Bedeutung hat die Angabe „Nippzeit\" für die Wasserstände in Gezeitengebieten?",
      "a": "Zur Nippzeit sind besonders niedrige Hochwasser und besonders hohe Niedrigwasser zu erwarten."
    },
    {
      "q": "Welche Bedeutung haben die Angaben „Nippzeit\" bzw. „Springzeit\" für die Gezeitenströme?",
      "a": "Zur Springzeit setzen die Gezeitenströme z.T. deutlich stärker als zur Nippzeit."
    },
    {
      "q": "Wo können Sie Informationen über Gezeitenströme in Küstengewässern finden?",
      "a": "1. In Gezeitenstromatlanten, Seehandbüchern\n2. In Seekarten aus Gezeitenstromtabellen, die bezogen sind auf die Hochwasserzeiten des dort genannten Bezugsortes"
    },
    {
      "q": "Auf einer Seekarte finden Sie in Küstenähe die Tiefenangabe 2,3. Was bedeutet das?",
      "a": "Der Ort der Zahl liegt 2,3 m über Kartennull und kann trockenfallen."
    },
    {
      "q": "In welchem Zusammenhang stehen Kartentiefe (KT), Wassertiefe (WT) und Höhe der Gezeit (H)?",
      "a": "WT - H = KT oder KT + H = WT (Lösung auch als Skizze möglich)."
    },
    {
      "q": "Warum ist es in Tidengewässern wichtig, die Uhrzeit einer Lotung festzuhalten?",
      "a": "Um anhand der Gezeitentafel feststellen zu können, ob das Wasser steigt oder fällt."
    },
    {
      "q": "Was ist ein Pegel?",
      "a": "Eine Skala zur Anzeige des Wasserstandes."
    },
    {
      "q": "Welchen Einfluss kann der Wind auf die Gezeiten haben?",
      "a": "Der Wind kann Strömungen und Wasserstandsänderungen hervorrufen, die zu den Gezeitenströmen und den Gezeiten hinzutreten."
    },
    {
      "q": "Nennen Sie drei wichtige Vorzüge von GPS!",
      "a": "1. GPS arbeitet weltweit\n2. Die Positionsanzeige ist jederzeit verfügbar\n3. Der Positionsfehler ist gering"
    },
    {
      "q": "Wie groß ist die typische und realistische Genauigkeit von Positionen, die mit GPS oder DGPS ermittelt werden?",
      "a": "1. GPS: 10-20 m bei einer Wahrscheinlichkeit von etwa 95%\n2. DGPS: 1-10 m bei einer Wahrscheinlichkeit von etwa 95%"
    },
    {
      "q": "Was bedeutet die Abkürzung GPS?",
      "a": "Global Positioning System"
    },
    {
      "q": "Was ist das Grundprinzip von GPS?",
      "a": "Durch Laufzeitmessungen von GPS-Signalen vom Satelliten zum Empfänger und damit durch Abstandsmessungen zu den Satelliten wird die Ortsbestimmung ermöglicht."
    },
    {
      "q": "Was bedeutet die Abkürzung DGPS und nach welchem Prinzip arbeitet DGPS?",
      "a": "DGPS = Differential Global Positioning System. Hierbei handelt es sich um eine regionale Verbesserung der Ortsbestimmung. Dabei werden von Referenzstationen über Funk Korrekturwerte für die GPS-Messwerte an die Schiffe übertragen."
    },
    {
      "q": "Was ist bei Anbringung einer GPS-Antenne zu beachten?",
      "a": "1. Sie muss ringsum freie Sicht (ohne Abschattungen) haben\n2. Einwandfreie Erdung"
    },
    {
      "q": "Was bewirkt die Bedienung der MOB-Taste bei GPS-Geräten?",
      "a": "1. Die Position zur Zeit des Tastendrucks wird gespeichert\n2. Rechtweisende Peilung (rwP) und Distanz zu diesem Punkt werden angezeigt"
    },
    {
      "q": "Was bedeutet die Aussage „Die Ortsgenauigkeit beträgt 100 m mit einer Wahrscheinlichkeit von 95%\"?",
      "a": "Das Schiff befindet sich mit einer Wahrscheinlichkeit von 95% in einem Fehlerkreis von 100 m Radius um den beobachteten Ort. Also jede 20. Ortsbestimmung (5%) ist ungenauer als 100 m."
    },
    {
      "q": "Wie kann man feststellen, ob die GPS-Position genau bzw. zuverlässig ist?",
      "a": "1. Durch den vom Empfänger angezeigten HDOP (horizontal dilution of precision = Satellitenverteilung)\n2. Durch die vom Empfänger angezeigte Anzahl der getrackten Satelliten\n3. Durch Vergleich mit anderen Navigationssystemen und der Koppelposition"
    },
    {
      "q": "Was ist bei Eintragung eines GPS-Ortes in eine Seekarte zu beachten?",
      "a": "Das Bezugssystem muss übereinstimmen. Dies kann geschehen durch:\n1. Auswahl und Einstellung des Kartenbezugssystems im Empfänger\n2. Manuelle Verschiebung des GPS-Ortes um die in der Seekarte angegebenen N/S- und E/W-Korrekturen\n3. Verwendung von Seekarten, die auf dem System WGS-84 beruhen"
    },
    {
      "q": "Was ist ein Wegpunkt?",
      "a": "Geografische Koordinaten eines anzusteuernden Punktes."
    },
    {
      "q": "Was bedeutet WGS-84 und was wird damit erreicht?",
      "a": "1. Globales Bezugssystem, World Geodetic System 1984"
    },
    {
      "q": "Wodurch können Radarechos von kleinen Fahrzeugen und Tonnen auf den Sichtschirmen von Radargeräten verschwinden?\n1. Durch Seegang und/oder Niederschlag\n2. durch falsche Bedienung\n3. durch zu große Entfernung\n4. durch Gieren des eigenen Fahrzeugs bei relativ vorausorientierter Radardarstellung (head up)",
      "a": "1. Durch Seegang und/oder Niederschlag\n2. durch falsche Bedienung\n3. durch zu große Entfernung\n4. durch Gieren des eigenen Fahrzeugs bei relativ vorausorientierter Radardarstellung (head up)"
    },
    {
      "q": "Wie kann man mit Radar den eigenen Schiffsort bestimmen?\n1. Peilung eines Objektes gibt einen Peilstrahl als Standlinie\n2. Abstandsmessung mit dem VRM (Variable Range Marker) gibt einen Abstandskreis als Standlinie",
      "a": "1. Peilung eines Objektes gibt einen Peilstrahl als Standlinie\n2. Abstandsmessung mit dem VRM (Variable Range Marker) gibt einen Abstandskreis als Standlinie"
    },
    {
      "q": "Wie kann man ggf. verhindern, dass sich Echoanzeigen von Zielen (z.B. zwei Tonnen, zwei Molenköpfe) überlappen?\n1. Kurze Impulslänge wählen\n2. Messbereich verkleinern",
      "a": "1. Kurze Impulslänge wählen\n2. Messbereich verkleinern"
    },
    {
      "q": "Was bedeutet der Begriff AIS auf See?",
      "a": "AIS bezeichnet das automatische Identifizierungssystem (Automatic Identification System)."
    },
    {
      "q": "Welche Reichweite hat ein AIS-Bordgerät und wovon ist sie abhängig?",
      "a": "Die Reichweite und Ausbreitungsbedingungen entsprechen denen von UKW. Bei Handelsschiffen kann man von 20 bis 30 sm ausgehen. Die Reichweite ist abhängig von der Antennenhöhe."
    },
    {
      "q": "Wie kann die Reichweite eines AIS-Bordgerätes landseitig erhöht werden und wie wirken sich dabei Hindernisse (z.B. Berge) aus?",
      "a": "Unter bestimmten Umständen kann die Reichweite heraufgesetzt werden (z.B. mithilfe von „Relaisstationen“), wobei ggf. auch abschattende Hindernisse umgangen werden können."
    },
    {
      "q": "Welche AIS-Daten werden von Schiffen aus der Berufsschifffahrt gesendet?",
      "a": "• Statische Daten: ID, Rufzeichen, Länge und Breite des Schiffes u.a.\n• Dynamische Daten (i.W. Sensordaten): UTC, Position, Heading, Kurs und Fahrt über Grund, ggf. Rate-of-turn, Fahrstatus (z.B. Maschinenfahrzeug mit FdW, Ankerlieger, manövrierbehindertes Fahrzeug)\n• Reisebezogene Daten: Tiefgang, Zielort (Destination), ETA u.a."
    },
    {
      "q": "Wann kann man sich auf die Verfügbarkeit und Anzeige von AIS-Signalen anderer Fahrzeuge verlassen? Nennen Sie die wesentlichen Voraussetzungen!",
      "a": "Andere Fahrzeuge werden nur angezeigt, wenn das Fahrzeug auch sendet, d.h. wenn:\n1. das Fahrzeug mit AIS ausgerüstet ist\n2. das sendende Fahrzeug AIS nicht abgeschaltet hat\n3. GPS aktiv ist"
    },
    {
      "q": "Wie ist die Genauigkeit von AIS-Daten zu beurteilen (Position und manuell eingegebene Daten)?",
      "a": "Position: Mit AIS wird zusätzlich zur GPS-Position eines Schiffes die Information übertragen, ob es sich um einen GPS- oder DGPS-Ort handelt. Ist die GPS-Position eines Schiffes falsch, wird diese falsche Position auf allen anderen Schiffen angezeigt.\nManuell eingegebene Daten: Es muss damit gerechnet werden, dass Zielort, Tiefgang, Fahrstatus u.a. falsch sind, wenn sie - z.B. aus Nachlässigkeit - nicht von der Schiffsführung aufdatiert werden."
    },
    {
      "q": "Welche besondere Bedeutung hat AIS für die Sportschifffahrt im Vergleich mit der Radaranzeige auf anderen Schiffen?",
      "a": "Sportfahrzeuge werden häufig auf den Radargeräten anderer Schiffe nicht sicher angezeigt bzw. die Anzeigen gehen im Seegangsclutter oder in der Informationsfülle unter. Da jetzt auf vielen Schiffen die AIS-Daten zusätzlich im Radargerät dargestellt werden, besteht die Gefahr, dass Sportfahrzeuge noch weniger auffällig sind, wenn sie nicht selbst mit AIS ausgerüstet sind."
    },
    {
      "q": "Welche Navigationsgeräte sollten Sie auf einer Yacht auch bei Kurzfahrten nahe der Küste mindestens an Bord haben?",
      "a": "Steuerkompass, Peilkompass, Lot, Log, Uhr"
    },
    {
      "q": "Was gehört zur navigatorischen Mindestausrüstung einer Yacht in Küstengewässern? Nennen Sie mindestens sechs Beispiele.",
      "a": "1. Steuerkompass\n2. Peileinrichtung\n3. terrestrisches- oder satellitengestütztes Funknavigationsgerät\n4. Log"
    },
    {
      "q": "Welchen Vorteil hat ein Kugelkompass gegenüber einem Flachglaskompass?",
      "a": "1. Der Kugelkompass kann auch bei größerer Krängung noch als Messinstrument benutzt werden\n2. Die Kugelform verbessert die Ablesbarkeit der Kompassrose (Vergrößerungseffekt)"
    },
    {
      "q": "Was beeinflusst die Ablenkung eines Kompasses dauerhaft?",
      "a": "Veränderung des magnetischen Zustandes an Bord, z.B. Einbauten und Lageänderung von Ausrüstungsgegenständen."
    },
    {
      "q": "Was beeinflusst die Ablenkung eines Kompasses vorübergehend?",
      "a": "Elektronische Geräte (z.B. Radio, Handy), magnetisierte Gegenstände (z.B. Werkzeug, Peilkompass) und Gleichstromleitungen in der Nähe des Kompasses."
    },
    {
      "q": "Welchen Abstand muss magnetisierbares Material vom Magnetkompass haben?",
      "a": "Mindestens 1 Meter."
    }
  ],
  "recht": [
    {
      "q": "Was sind „Sicherheitszonen\" im Sinne der Verordnung zu den KVR?",
      "a": "Sicherheitszonen sind Wasserflächen im Umkreis von 500 m von Plattformen, Bohrinseln, Forschungsanlagen u.a., die nicht befahren werden dürfen."
    },
    {
      "q": "Die Verordnung zu den KVR verbietet die Führung eines Fahrzeugs, wenn man infolge des Genusses alkoholischer Getränke in der sicheren Führung des Fahrzeugs behindert ist. Welchen örtlichen Geltungsbereich hat die vorgenannte Verordnung?",
      "a": "Die Verordnung gilt auf Seeschifffahrtsstraßen und für Schiffe, die die Bundesflagge führen, seewärts der Begrenzung des Küstenmeeres der Bundesrepublik Deutschland (also weltweit), soweit nicht in den Hoheitsgewässern anderer Staaten abweichende Regelungen gelten."
    },
    {
      "q": "Wer darf laut Verordnung zu den KVR ein Fahrzeug nicht führen oder als Mitglied der Crew eine andere Tätigkeit des Brücken- oder Decksdienstes nicht ausüben (allgemein ohne Zahlen zu beantworten)?",
      "a": "Wer infolge körperlicher oder geistiger Mängel oder des Genusses alkoholischer Getränke oder anderer berauschender Mittel in der sicheren Führung eines Fahrzeugs oder in der sicheren Ausübung einer anderen Tätigkeit des Brücken- oder Decksdienstes behindert ist."
    },
    {
      "q": "Welche Atem- oder Blutalkoholkonzentration darf laut Verordnung zu den KVR nicht erreicht werden, damit kein Verbot für ein Führen eines Fahrzeugs oder als Mitglied der Crew für ein Ausüben des Brückendienstes besteht?",
      "a": "0,25 mg/l oder mehr Alkohol in der Atemluft oder 0,5 Promille oder mehr Alkohol im Blut oder eine Alkoholmenge, die zu einer solchen Atem- oder Blutalkoholkonzentration führt."
    },
    {
      "q": "Die KVR regeln u.a. das Verhalten der Schiffsführungen bei Kollisionsgefahr.",
      "a": "Bei der Auslegung und Befolgung der KVR sind stets alle Gefahren der Schifffahrt und des Zusammenstoßes sowie alle besonderen Umstände einschließlich Behinderungen der betroffenen Fahrzeuge gebührend zu berücksichtigen, die zur Abwendung unmittelbarer Gefahr ggf. auch ein Abweichen von diesen Regeln erfordern können (z.B. Abweichen von der Kurshaltepflicht, wenn der Ausweichpflichtige nicht angemessen handelt)."
    },
    {
      "q": "Welche Grundregeln für das Verhalten im Verkehr verlangen die KVR, die ein Schiffsführer zu berücksichtigen hat, auch wenn keine konkrete Regel anwendbar ist?",
      "a": "Die KVR befreien nicht von den Folgen, die durch unzureichende Einhaltung der KVR oder unzureichende Vorsichtsmaßnahmen entstehen, d.h. allgemeine seemännische Praxis oder besondere Umstände des Falles können über die Mindestanforderungen der KVR hinausgehende Maßnahmen erfordern."
    },
    {
      "q": "Was sind Verkehrstrennungsgebiete? Wie sind sie zu befahren?",
      "a": "1. Verkehrstrennungsgebiete sind Schifffahrtswege, die durch Trennlinien oder Trennzonen in Einbahnwege geteilt sind.\n2. Diese dürfen nur in Fahrtrichtung rechts der Trennlinie/Trennzone befahren werden, aber unter Nutzung der vollen Breite des Einbahnweges."
    },
    {
      "q": "Was ist ein „manövrierunfähiges Fahrzeug\"?",
      "a": "Manövrierunfähig ist ein Fahrzeug, das wegen außergewöhnlicher Umstände (z.B. Ruderbruch) nicht regelgerecht manövrieren und daher einem anderen Fahrzeug nicht ausweichen kann."
    },
    {
      "q": "Nennen Sie mindestens drei Beispiele für „manövrierbehinderte Fahrzeuge\".",
      "a": "1. Tonnenleger, Kabelleger, Rohrleger im Einsatz\n2. Bagger, Vermessungsfahrzeuge im Einsatz\n3. Versorger im Einsatz\n4. Flugzeugträger im Einsatz\n5. Minenräumfahrzeuge im Einsatz\n6. Fahrzeuge während eines Schleppvorganges, bei dem das schleppende Fahrzeug und sein Anhang erheblich behindert sind, vom Kurs abzuweichen"
    },
    {
      "q": "Was ist unter „sicherer Geschwindigkeit\" zu verstehen?",
      "a": "Das Fahrzeug muss jederzeit innerhalb einer solchen Entfernung zum Stehen gebracht werden können, dass ein Zusammenstoß vermieden wird."
    },
    {
      "q": "Ab welcher Länge müssen Sportfahrzeuge mit den Lichtern/Signalkörpern ausgerüstet sein, die bei Manövrierunfähigkeit zu setzen sind?",
      "a": "Fahrzeuge ab 12 m Länge."
    },
    {
      "q": "Sie sehen in der Dämmerung in der Nordsee in der Zufahrt zur Jade einen großen Tanker mit der üblichen Lichtführung, auf dem kurze Zeit später die Lichter rot-weiß-rot senkrecht übereinander zusätzlich zu den Fahrtlichtern gesetzt werden. Welche rechtliche Bedeutung hat die geänderte Signalgebung für Sie?",
      "a": "Beim Erreichen des Geltungsbereiches der SeeSchStrO kennzeichnet sich der Tanker als Wegerechtschiff, das als manövrierbehindertes Fahrzeug gilt. Diesem so gekennzeichneten Fahrzeug muss im Falle einer Kollisionsgefahr ausgewichen werden."
    },
    {
      "q": "Welche Lichter müssen manövrierbehinderte Fahrzeuge (außer Minenräumfahrzeugen) führen: 1. ohne Fahrt durchs Wasser (FdW)? 2. mit FdW? 3. vor Anker?",
      "a": "1. Ohne FdW: rot-weiß-rot senkrecht übereinander\n2. Mit FdW: rot-weiß-rot senkrecht übereinander und Lichter eines Maschinenfahrzeugs (Topplicht(er), Seitenlichter, Hecklicht)\n3. Vor Anker: rot-weiß-rot senkrecht übereinander und Ankerlicht(er)"
    },
    {
      "q": "Wie sind manövrierbehinderte und manövrierunfähige Fahrzeuge am Tage bezeichnet?",
      "a": "1. Manövrierbehindert: Ball - Rhombus - Ball senkrecht übereinander\n2. Manövrierunfähig: zwei Bälle senkrecht übereinander"
    },
    {
      "q": "Wie müssen Sie Ihr Fahrzeug unter Segel bei Tage und bei Nacht kennzeichnen, wenn Sie gleichzeitig mit Maschinenkraft fahren?",
      "a": "1. Bei Nacht: Lichterführung eines Maschinenfahrzeugs entsprechender Größe\n2. Bei Tage: einen Kegel - Spitze unten - gut sichtbar über dem Vorschiff"
    },
    {
      "q": "Was müssen Sie hinsichtlich der Zeiten der Lichterführung beachten?",
      "a": "Die Lichter müssen geführt werden:\n1. zwischen Sonnenuntergang und Sonnenaufgang\n2. bei verminderter Sicht auch zwischen Sonnenaufgang und Sonnenuntergang"
    },
    {
      "q": "1. Worum handelt es sich? 2. Wie sind die Fahrzeuge bei Nacht gekennzeichnet?",
      "a": "1. Es handelt sich um einen Schleppverband länger als 200 m (Heck des Schleppers - Heck des Anhangs).\n2. Der Schlepper führt nachts drei weiße Topplichter senkrecht übereinander, Seitenlichter, Hecklicht und das gelbe Schlepplicht über dem Hecklicht. Der Anhang führt Seitenlichter und Hecklicht."
    },
    {
      "q": "Man hört bei Nebel folgendes Schallsignal mit der Pfeife ■●● (lang-kurz-kurz) unmittelbar gefolgt von ■●●● (lang-kurz-kurz-kurz) etwa jede Minute. Worum handelt es sich dabei?",
      "a": "Es ist das Schallsignal eines Schleppverbandes in Fahrt (schleppendes Fahrzeug: lang, kurz, kurz ■●●; Anhang: lang, kurz, kurz, kurz ■●●●)."
    },
    {
      "q": "Bei Nebel im Küstenbereich fahrend, hört man etwa jede Minute folgendes Signal: drei Glockenschläge, dann ca. fünf Sekunden lang rasches Läuten einer Glocke, dann drei Glockenschläge. Wer gibt dieses Signal?",
      "a": "Dieses Signal gibt ein Fahrzeug auf Grund unter 100 m Länge."
    },
    {
      "q": "Sie sehen ein Fahrzeug mit folgender Lichterführung: [oben weiß, unten weiß, darunter rot]. 1. Worum handelt es sich? 2. Welches Schallsignal müsste dieses Fahrzeug bei unsichtigem Wetter geben?",
      "a": "1. Treibnetzfischer (Fahrzeug, das nicht trawlt) in Fahrt oder vor Anker mit ausgebrachtem Fanggerät, das waagerecht mehr als 150 m ins Wasser reicht.\n2. Schallsignal ■●● (lang-kurz-kurz) mindestens alle 2 Minuten."
    },
    {
      "q": "Sie sehen nachts auf See zwei rote Lichter senkrecht übereinander. Worum handelt es sich?",
      "a": "Um ein manövrierunfähiges Fahrzeug in Fahrt ohne Fahrt durchs Wasser."
    },
    {
      "q": "Die Lichteranordnung eines Fahrzeugs ändert sich plötzlich von [zwei rote Lichter übereinander] in [zwei rote Lichter übereinander plus Backbordlicht]. Was schließen Sie daraus?",
      "a": "Ein manövrierunfähiges Fahrzeug in Fahrt ohne Fahrt durchs Wasser (FdW) hat FdW aufgenommen, da man jetzt auch das Bb-Seitenlicht sieht."
    },
    {
      "q": "Was bestimmen die KVR über das Ausguckhalten?",
      "a": "Es muss jederzeit durch Sehen und Hören sowie durch jedes andere verfügbare Mittel gehöriger Ausguck gehalten werden, der einen vollständigen Überblick über die Lage und die Möglichkeit der Gefahr eines Zusammenstoßes gibt."
    },
    {
      "q": "Was bestimmen die KVR über das Verhalten von Fahrzeugen von weniger als 20 m Länge oder von Segelfahrzeugen im Fahrwasser einer Seeschifffahrtsstraße?",
      "a": "Fahrzeuge von weniger als 20 m Länge oder Segelfahrzeuge dürfen nicht die Durchfahrt eines Fahrzeuges behindern, das nur innerhalb eines engen Fahrwassers oder einer Fahrrinne sicher fahren kann. Sie müssen, wenn es die Umstände erfordern, frühzeitig Maßnahmen ergreifen, um genügend Raum für die sichere Durchfahrt des anderen Fahrzeugs zu lassen."
    },
    {
      "q": "Was ist eine Küstenverkehrszone?",
      "a": "Das Gebiet zwischen der Küste und der landwärtigen Begrenzung eines Verkehrstrennungsgebietes."
    },
    {
      "q": "Welche Fahrzeuge dürfen die Küstenverkehrszone benutzen, ohne einen Hafen innerhalb der Küstenverkehrszone anzusteuern?",
      "a": "Fahrzeuge von weniger als 20 m Länge und Segelfahrzeuge."
    },
    {
      "q": "Wie müssen Maschinenfahrzeuge ohne Radar bei verminderter Sicht ihre Fahrweise einrichten?",
      "a": "Maschinenfahrzeuge müssen mit sicherer Geschwindigkeit fahren, die den gegebenen Umständen und Bedingungen der verminderten Sicht angepasst ist."
    },
    {
      "q": "Wie müssen sich Segelfahrzeuge ohne Radar bei verminderter Sicht verhalten? Was gehört dabei zu den Regeln guter Seemannschaft?",
      "a": "1. Segelfahrzeuge müssen mit sicherer Geschwindigkeit fahren, die den gegebenen Umständen und Bedingungen der verminderten Sicht angepasst ist.\n2. Bei Segelfahrzeugen, die eine Maschine an Bord haben, gehört das Bereithalten der Maschine zu den Regeln guter Seemannschaft."
    },
    {
      "q": "Wie müssen sich Fahrzeuge ohne Radar bei verminderter Sicht verhalten, wenn sie voraus das Schallsignal eines anderen Fahrzeuges hören?",
      "a": "Jedes Fahrzeug, das anscheinend vorlicher als querab das Schallsignal eines anderen Fahrzeuges hört, muss seine Fahrt auf das für die Erhaltung der Steuerfähigkeit geringstmögliche Maß verringern. Erforderlichenfalls muss es jegliche Fahrt wegnehmen und in jedem Fall mit äußerster Vorsicht manövrieren, bis die Gefahr eines Zusammenstoßes vorüber ist."
    },
    {
      "q": "Sie segeln in der Nordsee bei guter Sicht. Ihnen kommt in stehender Peilung ein Maschinenfahrzeug entgegen, das keine Anstalten macht, seiner Ausweichpflicht nachzukommen. Geben Sie in einer sinnvollen Reihenfolge an, was von Ihnen zu unternehmen ist. Welche dieser Maßnahmen sind zwingend vorgeschrieben?",
      "a": "1. Über Funk versuchen, das andere Fahrzeug auf seine Ausweichpflicht aufmerksam zu machen.\n2. Schallsignal: mindestens 5 kurze, rasch aufeinanderfolgende Pfeifentöne geben (•••••).\n3. Ggf. Ergänzung zu 2.: Lichtsignal von mindestens 5 kurzen, rasch aufeinander folgenden Blitzen.\n4. Manöver des „vorletzten Augenblicks\" fahren."
    },
    {
      "q": "Auf einem Segelfahrzeug unter Motor sieht man nachts fast recht voraus ein näherkommendes Fahrzeug mit folgender Lichterführung: oben ein weißes Licht, seitlich darunter ein grünes Licht, zeitweise rechts von dem grünen Licht auf gleicher Höhe auch ein rotes Licht. Um was für ein Fahrzeug handelt es sich, was ist von Ihnen zu unternehmen?",
      "a": "Es handelt sich um ein Maschinenfahrzeug von weniger als 50 m Länge, das im Seegang oder durch schlechtes Steuern giert. Es muss angenommen werden, dass sich zwei Maschinenfahrzeuge auf entgegengesetzten oder fast entgegengesetzten Kursen nähern und die Möglichkeit der Gefahr eines Zusammenstoßes besteht. Beide Fahrzeuge müssen den Kurs nach Steuerbord ändern und dieses einen kurzen Ton (•) anzeigen."
    },
    {
      "q": "Wie muss man sich verhalten, wenn man gezwungen ist, ein Verkehrstrennungsgebiet zu queren?",
      "a": "Die Kielrichtung (rwK) muss möglichst rechtwinklig zur allgemeinen Verkehrsrichtung zeigen."
    },
    {
      "q": "Wie muss man sich verhalten, wenn man einen betonnen Schifffahrtsweg (z.B. in der Ostsee) queren will?",
      "a": "Die Ausweichregeln der KVR beachten."
    },
    {
      "q": "Wie ist die Gefahr eines Zusammenstoßes sicher erkennbar?",
      "a": "Wenn die Kompasspeilung zu einem anderen Fahrzeug steht und sie sich einander nähern."
    },
    {
      "q": "Wie müssen Sie sich verhalten, nachdem Sie ein vorgeschriebenes Ausweichmanöver eingeleitet haben?",
      "a": "Der Erfolg des Manövers ist laufend zu überprüfen, bis das andere Fahrzeug klar passiert ist."
    },
    {
      "q": "Sie segeln mit Wind von Steuerbord und sehen nachts in Luv ein einzelnes rotes Licht, das in stehender Peilung näherkommt. 1. Was ist das für ein Licht? 2. Wer muss ausweichen? (Begründung)",
      "a": "1. Das Licht ist das Backbordlicht eines Segelfahrzeugs in Fahrt.\n2. Das Segelfahrzeug in Luv muss ausweichen, entweder weil es den Wind von Backbord hat oder weil es (wenn Wind von Stb. segelnd) luvwärts steht."
    },
    {
      "q": "Sie segeln mit Wind von Backbord und sehen nachts in Luv ein einzelnes grünes Licht, das in stehender Peilung näherkommt. 1. Was ist das für ein Licht? 2. Wer muss ausweichen? (Begründung)",
      "a": "1. Das Licht ist das Steuerbordlicht eines Segelfahrzeugs in Fahrt.\n2. Ihr Fahrzeug muss als leewärtiges Fahrzeug ausweichen, weil Sie (mit Wind von Backbord segelnd) nicht erkennen können, von welcher Seite das andere Fahrzeug den Wind hat."
    },
    {
      "q": "Sie segeln nachts mit raumem Wind und sehen acteraus die Lichterführung rot-weiß-rot senkrecht übereinander, das näher kommt. Zusätzlich sehen Sie neben zwei Topplichtern links ein grünes und rechts ein rotes Licht auf gleicher Höhe. 1. Was bedeuten diese Lichter? 2. Wer muss ausweichen? (Begründung)",
      "a": "1. Man sieht ein manövrierbehindertes Fahrzeug mit FdW (Topp-, Seitenlichter).\n2. Dieses Fahrzeug nähert sich im Hecklichtsektor und muss deshalb als Überholer ausweichen."
    },
    {
      "q": "Welcher Zeitpunkt ist im freien Seeraum entscheidend für die Verantwortlichkeit (hier = Ausweichpflicht) der Fahrzeuge untereinander?",
      "a": "Der Augenblick des ersten Insichtkommens. Eine spätere Änderung der Lage der Fahrzeuge zueinander verändert nicht die Verantwortlichkeit."
    },
    {
      "q": "Ein anderes Fahrzeug muss Ihnen ausweichen. Welche Verpflichtung nach KVR haben Sie? Was unternehmen Sie, wenn das andere Fahrzeug nicht ausweicht?",
      "a": "1. Mein Fahrzeug ist „Kurshalter\", d.h. es muss Kurs und Geschwindigkeit beibehalten.\n2. Mein Fahrzeug darf zur Abwendung eines Zusammenstoßes manövrieren, sobald erkennbar wird, dass das andere Fahrzeug nicht angemessen (= regelgerecht) manövriert („Manöver des vorletzten Augenblicks\").\n3. Mein Fahrzeug muss zweckdienlich manövrieren, wenn ein Manöver des Ausweichpflichtigen allein einen Zusammenstoß nicht mehr vermeiden kann („Manöver des letzten Augenblicks\")."
    },
    {
      "q": "Welchen Fahrzeugen muss ein Segelfahrzeug ausweichen?",
      "a": "1. Einem manövrierunfähigen Fahrzeug\n2. einem manövrierbehinderten Fahrzeug\n3. einem fischenden Fahrzeug\n4. ggf. einem anderen Segelfahrzeug, abhängig von der Segelstellung in Bezug auf den Wind"
    },
    {
      "q": "1. Wie muss sich ein Sportfahrzeug gegenüber einem tiefgangbehinderten Fahrzeug verhalten? 2. Schlagen Sie entsprechende Maßnahmen/Manöver vor.",
      "a": "1. Das Sportfahrzeug muss vermeiden, die sichere Durchfahrt eines tiefgangbehinderten Fahrzeugs zu behindern.\n2. Dies kann durch eine frühzeitige Kursänderung, Geschwindigkeitsänderung oder beides geschehen."
    },
    {
      "q": "Wo unterliegt Ihr Segelfahrzeug bzw. Ihre Motoryacht unter 20 m Länge einem Behinderungsverbot?",
      "a": "1. In engen Fahrwassern\n2. Auf dem Einbahnweg eines Verkehrstrennungsgebietes (VTG) gegenüber Maschinenfahrzeugen im VTG"
    },
    {
      "q": "Welchen Abstand muss man von Minenräumfahrzeugen halten?",
      "a": "Mindestens 1000 m."
    },
    {
      "q": "Auf einer Motoryacht A erkennt man nachts etwa zwei Strich an Bb. folgende Lichter des Fahrzeugs B, die rasch näherkommen: [oben weiß, darunter grün]. Die Kompasspeilung zum Fahrzeug B ändert sich dabei nur geringfügig. 1. Worum handelt es sich bei Fahrzeug B? 2. Wer muss ausweichen? 3. Was muss Fahrzeug A tun?",
      "a": "1. B ist ein Maschinenfahrzeug von weniger als 50 m Länge in Fahrt, dessen Stb-Seite man sieht.\n2. B muss ausweichen, weil es die Motoryacht A an seiner Stb-Seite hat.\n3. Die Motoryacht A muss Kurs und Geschwindigkeit beibehalten."
    },
    {
      "q": "Welchen Fahrzeugen muss eine Motoryacht ausweichen?",
      "a": "1. Manövrierunfähigen Fahrzeugen\n2. manövrierbehinderten Fahrzeugen\n3. fischenden Fahrzeugen\n4. Segelfahrzeugen\n5. ggf. einem anderen Maschinenfahrzeug"
    },
    {
      "q": "Auf einer Motoryacht A sieht man nachts etwa querab an Stb. ein einzelnes weißes Licht in (nahezu) stehender Kompasspeilung. Näherkommend erkennt man unterhalb des weißen Lichtes und etwas rechts davon ein rotes Licht (Fahrzeug B). 1. Worum handelt es sich? 2. Was müssen jeweils beide Fahrzeuge tun? (Begründung)",
      "a": "1. Topplicht und später Bb-Seitenlicht eines Maschinenfahrzeuges B von weniger als 50 m Länge in Fahrt.\n2. A muss ausweichen, weil es B an seiner Stb-Seite hat. A muss das Signal „ein kurzer Ton (•)\" geben. B muss Kurs und Geschwindigkeit beibehalten."
    },
    {
      "q": "Eine Motoryacht, Länge 8 m, treibt nachts manövrierunfähig in der Nordsee und sieht ein großes Fahrzeug direkt auf sich zukommen. Welche Maßnahmen hat die Motoryacht zu ergreifen?",
      "a": "Ein Fahrzeug von weniger als 12 m Länge, das die zwei roten Rundumlichter übereinander nicht führt, muss folgende Maßnahmen ergreifen:\n1. Durch jedes andere verfügbare Mittel anzeigen, dass es manövrierunfähig ist, z.B. über UKW-Sprechfunk oder durch ein Schallsignal lang, kurz, kurz (••).\n2. Bei weiterer Annäherung das andere Fahrzeug mit einer starken Handlampe anleuchten.\n3. Führen eines weißen Rundumlichtes, das mit keinem anderen Licht verwechselt werden kann.\n4. Abfeuern eines Signals „weißer Stern\" oder „Blitz-Knall\".\n5. Sofort bei Eintritt der Manövrierunfähigkeit Verkehrszentrale informieren (wenn vorhanden)."
    },
    {
      "q": "Wie sind Fahrwasser der SeeSchStrO im Sinne der KVR eingestuft?",
      "a": "Fahrwasser der Seeschifffahrtsstraße gelten als enge Fahrwasser im Sinne der KVR."
    },
    {
      "q": "Erläutern Sie den Begriff „durchgehende Schifffahrt\" auf einem Fahrwasser einer Seeschifffahrtsstraße.",
      "a": "Die durchgehende Schifffahrt umfasst alle Fahrzeuge, die deutlich dem Fahrwasserverlauf einer Seeschifffahrtsstraße folgen. Dies erlaubt nach allgemeiner Verkehrsauffassung ein Abweichen von höchstens ±10° von der Richtung des Fahrwassers. Dabei ist es gleichgültig, zu welchem Zweck das Fahrzeug betrieben wird."
    },
    {
      "q": "Was fordern die Grundregeln für das Verhalten im Verkehr?",
      "a": "Jeder Verkehrsteilnehmer:\n1. muss die Sicherheit und Leichtigkeit des Verkehrs gewährleisten\n2. darf andere (nicht nur Verkehrsteilnehmer!) nicht schädigen, gefährden oder mehr als unvermeidbar behindern oder belästigen"
    },
    {
      "q": "Welche verkehrsrechtliche Verantwortung hat der Schiffsführer?",
      "a": "1. Befolgung der Vorschriften im Verkehr, u.a. KVR, SeeSchStro\n2. Ausrüstung/Einrichtung seines Fahrzeugs zum Führen und Zeigen von Lichtern und Signalkörpern und Geben von Schallsignalen"
    },
    {
      "q": "Was sind Seeschifffahrtsstraßen im Sinne der SeeSchStrO?",
      "a": "Seeschifffahrtsstraßen im Sinne der SeeSchStrO sind:\n1. Wasserflächen zwischen der Küstenlinie bei mittlerem Hochwasser oder der seewärtigen Begrenzung der Binnenwasserstraßen und einer Linie von drei Seemeilen Abstand seewärts der Basislinie\n2. den durchgehend durch laterale Zeichen (Tonnen) begrenzten wasserseitigen Teile der Fahrwasser im Küstenmeer\n3. Wasserflächen zwischen den Ufern bestimmter Binnenwasserstraßen"
    },
    {
      "q": "Was sind Fahrwasser im Sinne der SeeSchStrO?",
      "a": "Fahrwasser sind die Teile der Wasserflächen, die durch Tonnen (laterale Zeichen) begrenzt oder gekennzeichnet sind oder die, wo das nicht der Fall ist, auf den Binnenwasserstraßen für die durchgehende Schifffahrt bestimmt sind."
    },
    {
      "q": "Welche verkehrsrechtlichen Bestimmungen gelten auf deutschen Seeschifffahrtsstraßen?",
      "a": "Auf deutschen Seeschifffahrtsstraßen gelten:\n1. die KVR\n2. die SeeSchStro, ggf. die Bekanntmachungen der Wasser- und Schifffahrtsdirektionen (WSD) Nord und Nordwest\n3. ggf. die Hafenordnungen"
    },
    {
      "q": "Wo und unter welcher Bedingung gelten im Geltungsbereich der SeeSchStrO die KVR?",
      "a": "Die KVR gelten im gesamten Geltungsbereich der SeeSchStrO innerhalb und außerhalb der Fahrwasser, soweit die SeeSchStrO nicht ausdrücklich etwas anderes bestimmt (z.B. Vorfahrt, Grundsatz des Vorranges der spezielleren Rechtsvorschrift vor der allgemeineren)."
    },
    {
      "q": "Wie haben Segelfahrzeuge in einem Fahrwasser der SeeSchStrO untereinander auszuweichen, wenn sie nicht deutlich der Richtung eines Fahrwassers folgen?",
      "a": "Sie haben untereinander nach den Regeln der KVR auszuweichen, wenn sie dadurch vorfahrtberechtigte Fahrzeuge nicht gefährden oder behindern."
    },
    {
      "q": "Auf der Elbe hören Sie nachts vor sich von einem Fahrzeug, das zusätzlich zu seinen Fahrtlichtern ein rotes Rundumlicht führt, fortwährend das Schallsignal kurz-lang. Um welches Schallsignal handelt es sich, wann ist es zu geben und wie verhalten Sie sich?",
      "a": "Es handelt sich um das Bleibweg-Signal, das von einem Fahrzeug gegeben wird, bei dem bestimmte gefährliche Güter oder radioaktive Stoffe frei werden oder drohen frei zu werden oder Explosionsgefahr besteht. Man hat sich mit seinem Fahrzeug möglichst weit von dem anderen Fahrzeug zu entfernen (sicherer Abstand) und darf keine elektrischen Schalter bedienen; kein offenes Feuer."
    },
    {
      "q": "Wann ist von einem Fahrzeug auf einer Seeschifffahrtsstraße das allgemeine Gefahr- und Warnsignal zu geben und wie lautet es?",
      "a": "Gefährdet ein Fahrzeug ein anderes Fahrzeug oder wird es durch dieses selbst gefährdet, hat es soweit möglich rechtzeitig dieses Schallsignal zu geben: ■ ●●●● (ein langer Ton, vier kurze Töne; ein langer Ton, vier kurze Töne)."
    },
    {
      "q": "Welche speziellen Fahrregeln haben Sportfahrzeuge im Nord-Ostsee-Kanal (NOK) einzuhalten?",
      "a": "1. Das Segeln ist auf dem NOK verboten.\n2. Sportfahrzeuge mit Maschinenantrieb dürfen zusätzlich die Segel setzen.\n3. Ein motorbetriebenes Sportfahrzeug darf nur ein Sportfahrzeug schleppen."
    },
    {
      "q": "Während der Durchfahrt durch den Nord-Ostsee-Kanal (NOK) wird man auf einem Sportboot von Nebel überrascht. Was ist zu unternehmen?",
      "a": "Schnellstmöglich in einem Weichengebiet hinter den Dalben oder an einem geeigneten Liegestellen festmachen."
    },
    {
      "q": "Sie sehen vor dem Einlaufen in den NOK in Brunsbüttel folgende Lichtsignale: 1. ein unterbrochenes rotes Licht; 2. ein unterbrochenes weißes Licht über einem unterbrochenen roten Licht; 3. ein unterbrochenes weißes Licht. Geben Sie die Bedeutung dieser Signale an.",
      "a": "1. Unterbrochenes rotes Licht: Einfahren verboten\n2. Unterbrochenes weißes Licht über unterbrochenen roten Licht: Freigabe wird vorbereitet\n3. Unterbrochenes weißes Licht: Sportfahrzeuge können einfahren"
    },
    {
      "q": "Erläutern Sie den Begriff „Vorfahrt beachten\".",
      "a": "„Vorfahrt beachten\" begründet eine Wartepflicht. Wer die Vorfahrt zu beachten hat, muss rechtzeitig durch sein Fahrverhalten erkennen lassen, dass er warten wird. Er darf nur"
    },
    {
      "q": "Erläutern Sie den Begriff „Vorfahrt haben\".",
      "a": "„Vorfahrt haben\" gilt nur für ein im Fahrwasser fahrendes oder dem Fahrwasserverlauf folgendes Fahrzeug. Das bedeutet, dass andere Fahrzeuge, die in das Fahrwasser einlaufen wollen, dort drehen oder an- und ablegen wollen, mit diesem Vorhaben warten müssen, bis das vorfahrtberechtigte Fahrzeug vorbei ist. „Vorfahrt haben\" bedeutet aber nicht: Vorfahrt erzwingen! Ggf. muss ein vorfahrtberechtigtes Fahrzeug Maßnahmen zur Verhinderung einer drohenden Kollision ergreifen."
    },
    {
      "q": "Wie hat sich ein in das Fahrwasser einlaufendes Fahrzeug gegenüber im Fahrwasser fahrenden Fahrzeugen zu verhalten?",
      "a": "Es muss die Vorfahrt der Fahrzeuge im Fahrwasser beachten, d.h. es muss warten, bis das Fahrwasser frei ist. Es muss rechtzeitig durch sein Fahrverhalten erkennen lassen, dass es warten wird."
    },
    {
      "q": "Wie hat sich ein den Ankerplatz oder Liegeplatz verlassendes Fahrzeug gegenüber im Fahrwasser fahrenden Fahrzeugen zu verhalten?",
      "a": "Es muss die Vorfahrt der Fahrzeuge im Fahrwasser beachten, d.h. es muss warten, bis das Fahrwasser frei ist. Es muss rechtzeitig durch sein Fahrverhalten erkennen lassen, dass es warten wird."
    },
    {
      "q": "Welche Fahrregeln muss ein Sportfahrzeug beachten, wenn es der Richtung des Fahrwassers folgt?",
      "a": "Beim Fahren im Fahrwasser muss das Sportfahrzeug sich so nahe am äußeren Rand des Fahrwassers an seiner Steuerbordseite halten, wie dies ohne Gefahr möglich ist."
    },
    {
      "q": "Was muss ein Sportfahrzeug in Bezug auf das Fahrwasser beachten, wenn es außerhalb des Fahrwassers fährt?",
      "a": "Außerhalb des Fahrwassers ist so zu fahren, dass klar erkennbar ist, dass das Fahrwasser nicht benutzt wird."
    },
    {
      "q": "Wie müssen sich Segelfahrzeuge verhalten, die dem Fahrwasserverlauf auf (nahezu) entgegengesetzten Kursen begegnen?",
      "a": "Jedes Fahrzeug muss nach Steuerbord ausweichen."
    },
    {
      "q": "Was bedeutet „Queren eines Fahrwassers\" im Sinne der SeeSchStrO?",
      "a": "Queren bedeutet deutliches Abweichen vom Fahrwasserverlauf, nach allgemeiner Verkehrsmeinung mehr als 10° (z.B. Kreuzen eines Segelfahrzeuges über die gesamte oder auch nur teilweise Fahrwasserbreite)."
    },
    {
      "q": "Wie müssen Sie die Geschwindigkeit Ihres Sportbootes einrichten, wenn Sie außerhalb eines Fahrwassers an Stellen mit erkennbarem Badebetrieb vorbeifahren?",
      "a": "Höchstgeschwindigkeit 8 km/h im Abstand von weniger als 500 m vom Ufer."
    },
    {
      "q": "Sie sehen auf der Elbe bei Nacht ein Fahrzeug mit der nachfolgenden Lichterführung: [oben zwei grüne Rundumlichter übereinander, darunter ein weißes Licht, darunter zwei rote Rundumlichter übereinander]. Um was für ein Fahrzeug handelt es sich? Was bedeuten die beiden roten und grünen Lichter senkrecht übereinander?",
      "a": "Manövrierbehindertes Fahrzeug, Länge wahrscheinlich 50 m oder mehr, mit Fahrt durchs Wasser, das Unterwasserarbeiten ausführt (z. B. baggert). Passierseite an Stb. (zwei grüne Rundumlichter übereinander), Passierbehinderung an Bb-Seite (zwei rote Rundumlichter übereinander)."
    },
    {
      "q": "Sie sehen auf der Elbe bei Tage ein Fahrzeug mit den nachfolgenden schwarzen Signalkörpern, dessen Bugwelle man klar erkennen kann: [zwei schwarze Bälle übereinander, daneben zwei schwarze Rhomben übereinander]. Um was für ein Fahrzeug handelt es sich? Was bedeuten die beiden schwarzen Bälle und die beiden schwarzen Rhomben senkrecht übereinander?",
      "a": "Entgegenkommendes manövrierbehindertes Fahrzeug von vorn, mit Fahrt durchs Wasser, das Unterwasserarbeiten ausführt (z.B. baggert). Passierseite an Bb. des Baggers (zwei schwarze Rhomben übereinander), Passierbehinderung an Stb-Seite des Baggers (zwei schwarze Bälle übereinander)."
    },
    {
      "q": "Beim Passieren von Cuxhaven sichten Sie elbabwärts segelnd an Ihrer Stb-Seite die Tonne 32a. Um was für eine Tonne handelt es sich, welche Bezeichnung hat die nächste Tonne?",
      "a": "Es handelt sich um eine Backbordfahrwassertonne; die nächste Tonne hat die Aufschrift 32."
    },
    {
      "q": "Welche besondere Lichterführung/Kennzeichnung ist vorgeschrieben, wenn ein Motorsportfahrzeug ein anderes Sportfahrzeug schleppt?",
      "a": "Motorsportfahrzeuge, die andere Sportfahrzeuge schleppen, gelten nicht als schleppende Maschinenfahrzeuge im Sinne der KVR. Daher keine besondere Lichterführung/Kennzeichnung."
    },
    {
      "q": "Welche besonderen Bestimmungen gelten auf dem Nord-Ostsee-Kanal (NOK) für Sportfahrzeuge beim Schleppen?",
      "a": "1. Ein motorbetriebenes Sportfahrzeug darf nur ein Sportfahrzeug schleppen.\n2. Das geschleppte Sportfahrzeug darf nur eine Höchstlänge von weniger als 15 m haben.\n3. Die Mindestgeschwindigkeit beim Schleppen muss 9 km/h betragen."
    },
    {
      "q": "[oben Kugel, darunter Kugel, darunter Dreieck/Pfeil]. 1. Was bedeutet dieses Signal? 2. Welches Signal wird stattdessen nachts gezeigt?",
      "a": "1. Außergewöhnliche Schifffahrtsbehinderung\n2. Nachts: Rundumlichter rot-rot-grün senkrecht übereinander"
    },
    {
      "q": "Wer darf laut SeeSchStrO ein Fahrzeug nicht führen oder als Mitglied der Crew eine andere Tätigkeit des Brücken- oder Decksdienstes nicht ausüben (allgemein ohne Zahlen zu beantworten)?",
      "a": "Wer infolge körperlicher oder geistiger Mängel oder des Genusses alkoholischer Getränke oder anderer berauschender Mittel in der sicheren Führung eines Fahrzeugs oder in der sicheren Ausübung einer anderen Tätigkeit des Brücken- oder Decksdienstes behindert ist."
    },
    {
      "q": "Welche Atem- oder Blutalkoholkonzentration darf laut SeeSchStrO nicht erreicht werden, damit kein Verbot für ein Führen eines Fahrzeugs oder als Mitglied der Crew für ein Ausüben des Brückendienstes besteht?",
      "a": "0,25 mg/1 oder mehr Alkohol in der Atemluft oder 0,5 Promille oder mehr Alkohol im Blut oder eine Alkoholmenge, die zu einer solchen Atem- oder Blutalkoholkonzentration führt."
    },
    {
      "q": "Was müssen Sie beim ersten Anlaufen eines ausländischen Hafens beachten?",
      "a": "Die Einreise-, Gesundheits- und Zollformalitäten sind zu erledigen."
    },
    {
      "q": "1. Was ist ein Flaggenzertifikat? 2. Für welche Fahrzeuge kann es ausgestellt werden?",
      "a": "1. Vom BSH ausgestellter Ausweis, mit dem das Recht und die Pflicht zum Führen der Bundesflagge nachgewiesen wird.\n2. Für Fahrzeuge unter 15 m Lüa („nicht registerpflichtige Fahrzeuge“)."
    },
    {
      "q": "Was ist das Schiffszertifikat, wer stellt es aus, ab welcher Schiffslänge ist es vorgeschrieben?",
      "a": "Das Schiffszertifikat ist der Nachweis, dass ein Schiff im Seeschiffsregister eingetragen ist. Ausgestellt wird es vom Registergericht. Vorgeschrieben ist es ab 15 m Rumpflänge."
    },
    {
      "q": "Was versteht man unter dem Begriff „Küstenmeer\"?",
      "a": "Die seewärts der Küstenlinie bei mittlerem Hochwasser oder der Basislinie gelegenen Meeresgewässer bis zu einer Breite von 12 sm."
    },
    {
      "q": "Was versteht man unter dem Begriff „innere Gewässer\"?",
      "a": "Als „innere Gewässer\" bezeichnet man die Gewässer landwärts der Basislinien."
    },
    {
      "q": "Was versteht man unter dem Begriff „Basislinie\" und wo finden Sie diese?",
      "a": "Als Basislinie bezeichnet man die Grenze zwischen den inneren Gewässern (eines Staates) und dem Küstenmeer. Basislinien sind in Seekarten eingezeichnet."
    },
    {
      "q": "Welche Aufgaben hat die Bundesstelle für Seeunfalluntersuchung?",
      "a": "1. Amtliche Untersuchung eines Schaden oder Gefahr verursachenden Vorkommnisses (Seeunfall) im Zusammenhang mit dem Betrieb eines Schiffes (z.B. Kollision zwischen zwei Fahrzeugen) und Ermittlung der Umstände, durch die es zu dem Seeunfall gekommen ist.\n2. Herausgabe von Untersuchungsberichten und insbesondere Sicherheitsempfehlungen zur Verhütung von Seeunfällen."
    },
    {
      "q": "Wann liegt ein Schaden oder Gefahr verursachendes Vorkommnis (Seeunfall) im Sinne des Seesicherheitsuntersuchungsgesetzes (SUG) vor? Nennen Sie mindestens drei Merkmale!",
      "a": "1. Schiffsverlust, Auf-Grund-Laufen, Kollision eines Schiffes"
    },
    {
      "q": "Was müssen Sie nach einem Seeunfall veranlassen? Wie kann es umgesetzt werden?",
      "a": "Den Seeunfall unverzüglich der Bundesstelle für Seeunfalluntersuchung (BSU) melden. Das kann in einem deutschen Einlaufhafen auch über die Wasserschutzpolizei bzw. im Ausland über die zuständigen Hafenbehörden veranlasst werden."
    },
    {
      "q": "Welche Angaben müssen der Bundesstelle für Seeunfalluntersuchung gemeldet werden? Nennen Sie mindestens fünf dieser Angaben!",
      "a": "Es sind folgende Angaben zu melden:\n1. Name und derzeitiger Aufenthaltsort des Meldenden\n2. Ort (geografische Position) und Zeit des Unfalls\n3. Name, Rufzeichen und Flagge des Schiffes sowie Rufnummer des zu diesem Schiff gehörenden mobilen Seefunkdienstes (MMSI)\n4. Typ, Verwendungszweck\n5. Name des Betreibers des Schiffes\n6. Name des verantwortlichen Schiffsführers\n7. Herkunfts- und Zielhafen des Schiffes\n8. Anzahl der Besatzungsmitglieder und weiterer Personen an Bord\n9. Umfang des Personen- und Sachschadens\n10. Darstellung des Verlaufs des Vorkommnisses\n11. Angaben über andere Schiffe, die am Unfall beteiligt sind\n12. Wetterbedingungen\n13. Darstellung der Gefahr einer Meeresverschmutzung"
    },
    {
      "q": "Seeunfalluntersuchung bei einem Schaden oder Gefahr verursachenden Vorkommnis (Seeunfall) gemeldet werden müssen? Wer ist verantwortlich für die Meldung?",
      "a": "Geregelt in der Verordnung zur Sicherung der Seefahrt. Verantwortlich für die Meldung sind der Schiffsführer, bei dessen Verhinderung ein anderes Besatzungsmitglied bzw. ggf. auch der Betreiber des Schiffes, falls keiner der vorgenannten Personen dazu in der Lage ist."
    },
    {
      "q": "Was sind Seeämter und was sind Ihre Aufgaben?",
      "a": "Seeämter sind bei den Wasser- und Schifffahrtsdirektionen Nord und Nordwest gebildete Untersuchungsausschüsse zur Untersuchung der Frage, ob gegenüber einem Fahrzeugbeteiligten ein Fahrverbot ausgesprochen oder ein Befähigungszeugnis bzw. ein amtlicher Führerschein der Sportschifffahrt entzogen werden muss."
    },
    {
      "q": "Welche behördlichen Veröffentlichungen für Wassersportler geben Ihnen rechtliche Informationen und Hinweise über das Verhalten auf Seeschifffahrtsstraßen?",
      "a": "„Sicherheit auf dem Wasser, Leitfaden für Wassersportler\" und „Sicherheit im See- und Küstenbereich, Sorgfaltsregeln für Wassersportler\"."
    },
    {
      "q": "Sie sehen von Ihrem Sportfahrzeug aus in der Nordsee nördlich von Helgoland eine noch unbekannte Gefahr, z.B. einen treibenden Container. Was haben Sie zu unternehmen?",
      "a": "Man muss dies auf dem schnellsten Weg direkt oder über eine Verkehrszentrale bzw. Küstenfunkstelle dem Maritimen Lagezentrum (MLZ) Cuxhaven als Meldestelle für Unfälle auf See mitteilen."
    },
    {
      "q": "Wann und wo wird eine Flagge des Gastlandes gesetzt?",
      "a": "Beim Einlaufen in die Küstengewässer des Gastlandes unter der Steuerbordsaling."
    },
    {
      "q": "Welche Befahrensregelungen gelten für die Schutzzonen I in den Nationalparken im deutschen Wattenmeer außerhalb der speziellen Schutzgebiete?",
      "a": "Das Verlassen der Fahrwasser zwischen 3 h nach Hochwasser und 3 h vor dem folgenden Hochwasser ist untersagt. In der übrigen Zeit beträgt für Sportfahrzeuge die Höchstgeschwindigkeit außerhalb des Fahrwassers 8 kn und generell im Fahrwasser 12 kn."
    },
    {
      "q": "Wo sind die Grenzen der Schutzzonen I und der speziellen Schutzgebiete in den Nationalparken aufgeführt?",
      "a": "In den Seekarten."
    },
    {
      "q": "Welchen Zweck soll das MARPOL-Übereinkommen erfüllen?",
      "a": "Das MARPOL-Übereinkommen soll die Verschmutzung der Meere verhindern."
    },
    {
      "q": "Was sind Sondergebiete im Sinne des MARPOL-Übereinkommens in Europa?",
      "a": "Ostsee, Nordsee und Mittelmeer."
    },
    {
      "q": "Was ist nach dem MARPOL-Übereinkommen für die Sportschifffahrt in Sondergebieten grundsätzlich verboten?",
      "a": "Das Einleiten von Öl, Schiffsabwässern, Schiffsmüll und anderen Schadstoffen."
    },
    {
      "q": "Gilt das MARPOL-Übereinkommen grundsätzlich auch für Sportfahrzeuge?",
      "a": "Das MARPOL-Übereinkommen gilt grundsätzlich für alle Schiffe, somit auch für Sportfahrzeuge."
    },
    {
      "q": "Woraus können Sie Informationen über Entsorgungsmöglichkeiten in deutschen Sportboothäfen entnehmen?",
      "a": "Aus der Broschüre „Entsorgungsmöglichkeiten für Öl, Schiffsmüll und Schiffsabwässer - eine Übersicht für die Sport- und Kleinschifffahrt\" des BSH."
    },
    {
      "q": "Wie ist auf Sportfahrzeugen mit ölhaltigem Bilgenwasser zu verfahren, wenn die Bedingungen, unter denen nach MARPOL das Lenzen zulässig ist, nicht eingehalten werden können?",
      "a": "Es muss im Hafen entsorgt werden."
    },
    {
      "q": "Was ist hinsichtlich der Entsorgung von Müll in Nord- und Ostsee und im Mittelmeer zu beachten (Begründung)?",
      "a": "Da Nord- und Ostsee sowie Mittelmeer Sondergebiete nach MARPOL sind, darf dort kein Müll in die See entsorgt werden."
    },
    {
      "q": "Welche Müllanteile dürfen in Sondergebieten nicht auf See entsorgt werden?",
      "a": "Synthetische Seile, Netze, Segel, Kunststofftüten u.Ä., Papiererzeugnisse, Lumpen, Glas, Metall, Steingut, Schalungs- oder Verpackungsmaterial."
    }
  ],
  "wetter": [
    {
      "q": "Was ist Wind und wie entsteht er?",
      "a": "Wind ist bewegte Luft. Die Bewegung entsteht durch die Druckunterschiede zwischen Hoch- und Tiefdruckgebieten."
    },
    {
      "q": "Was ist der Taupunkt?",
      "a": "Der Taupunkt ist die Temperatur, auf die Luft abgekühlt werden muss, damit sie mit Feuchtigkeit gesättigt ist. Es setzt Kondensation (Taubildung) ein."
    },
    {
      "q": "In welcher Größe wird in der Schifffahrt die Luftfeuchtigkeit allgemein angegeben?",
      "a": "Relative Feuchtigkeit in Prozent."
    },
    {
      "q": "Nennen Sie mindestens sechs Parameter, aus denen sich eine Wetterbeobachtung an Bord zusammensetzt.",
      "a": "Windrichtung, Windstärke, Luftdruck, aktuelles Wetter, Bedeckungsgrad, Wolken, Seegang, Strom, Temperatur und ggf. Luftfeuchte."
    },
    {
      "q": "1. In welcher Maßeinheit wird die Windstärke angegeben? 2. In welchen Maßeinheiten wird die Windgeschwindigkeit angegeben?",
      "a": "1. Nach der Beaufortskala (Bft)\n2. In kn, m/s und km/h"
    },
    {
      "q": "1. Wie heißen die Linien gleichen Luftdrucks? 2. In welcher Maßeinheit wird der Luftdruck angegeben?",
      "a": "1. Isobaren\n2. Hektopascal (hPa) oder vereinzelt auch noch in Millibar (mb, auch mbar)"
    },
    {
      "q": "Welche Gefahren kann ein Gewitter mit sich bringen?",
      "a": "1. Böen bis Orkanstärke\n2. plötzliche Winddrehungen\n3. Regen-oder Hagelschauer mit zum Teil starker Sichtminderung\n4. Blitzschlag"
    },
    {
      "q": "Wann entstehen besonders starke Gewitter?",
      "a": "Besonders zum Ende einer hochsommerlichen Schönwetterperiode im Zusammenhang mit Kaltfronten."
    },
    {
      "q": "Welche Skala wird für die Angabe der Windrichtung in Seewetterberichten bei: 1. den Vorhersagen und Aussichten, 2. den Stationsmeldungen verwendet?",
      "a": "1. Die 8-teilige mit Auflösung in 45°-Stufen\n2. Die 16-teilige mit Auflösung in 22,5°-Stufen"
    },
    {
      "q": "Ab welcher Windstärke werden Orkanwarnungen herausgegeben?",
      "a": "Ab Windstärke 10 Bft, erfahrungsgemäß mit Böen 12 Bft."
    },
    {
      "q": "1. Welche Skala wird für die Schätzung der Windstärke verwendet? 2. Was verstehen Sie unter mäßigem Wind, was unter Starkwind?",
      "a": "1. Die 12-teilige Beaufortskala\n2. Mäßiger Wind bedeutet Stärke 4 der Beaufortskala, Starkwind 6 und 7 Bft"
    },
    {
      "q": "Welche amtlichen Veröffentlichungen enthalten Sendezeiten und Frequenzen für Seewetterberichte: 1. für Europa, 2. Europa und weltweit?",
      "a": "1. Das Handbuch „Nautischer Funkdienst\" und der „Jachtfunkdienst\"\n2. Die „Admiralty List of Radio Signals\""
    },
    {
      "q": "Nennen Sie sechs Möglichkeiten, um Wetterinformationen an Bord zu erhalten.",
      "a": "Hörfunksender (UKW, KW, MW, LW), Küstenfunkstellen, Verkehrszentralen, NAVTEX, SafetyNet (Satcom), Online-Dienste (z.B. SEEWIS-Online des Deutschen Wetterdienstes, T-Online), RTTY (Funkfernschreiben), Faksimile (Wetterfax), Faxpolling (z.B. SEEWIS-Fax des Deutschen Wetterdienstes), Telefonabruf, Törnberatung."
    },
    {
      "q": "Welche Bedeutung für die Wetterentwicklung hat ein Wolkenaufzug, meist Cirrostratus, ggf. Niederschlag und Wetterverschlechterung sowie ein Halo um die Sonne und ein Hof um den Mond?",
      "a": "Wolkenaufzug, meist Cirrostratus. Ggf. Niederschlag und Wetterverschlechterung."
    },
    {
      "q": "Bei welchen Wolkenformen müssen Sie mit erhöhter Böigkeit rechnen?",
      "a": "Bei Haufenwolken, besonders beim Cumulonimbus (Schauer- und Gewitterwolke)."
    },
    {
      "q": "1. Welche Formen von Wolken gibt es? 2. Nennen Sie sechs der zehn Haupttypen!",
      "a": "1. Es gibt Haufenwolken und Schichtwolken\n2. Cirrus, Cirrostratus, Cirrocumulus, Altostratus, Altocumulus, Nimbostratus, Stratocumulus, Stratus, Cumulus, Cumulonimbus"
    },
    {
      "q": "1. Welche Höhen unterscheidet man bei Wolken? 2. Welche Höhen haben sie etwa in den gemäßigten Breiten?",
      "a": "1. Tiefe, mittelhohe und hohe Wolken\n2. Tiefe Wolken zwischen 0 und 2 km, mittelhohe Wolken zwischen 2 und 7 km und hohe Wolken zwischen 7 und 13 km"
    },
    {
      "q": "Woraus bestehen hohe Wolken?",
      "a": "Aus kleinen Eiskristallen."
    },
    {
      "q": "Woran erkennt man bei Wolkenbildung eine kräftige Gewitterentwicklung?",
      "a": "Am Cumulonimbus, wenn er in großer Höhe einen ambossförmigen Schirm hat."
    },
    {
      "q": "Welche Wolken kündigen oft schon vormittags kräftige Wärmegewitter an?",
      "a": "Altocumulus castellanus (mittelhohe, türmchenartige Haufenwolken)."
    },
    {
      "q": "1. Was ist eine Front? 2. Welche Fronten unterscheidet man im Allgemeinen?",
      "a": "1. Front ist die vordere Grenze einer Luftmasse in Bewegungsrichtung\n2. Warm-, Kalt- und Okklusionsfronten"
    },
    {
      "q": "Wie verhält sich typischerweise der Luftdruck 1. vor, 2. während und 3. nach dem Durchzug einer Kaltfront?",
      "a": "1. Der Luftdruck ist gleichbleibend oder fällt nur wenig\n2. Während des Durchgangs der Front erreicht der Luftdruck seinen tiefsten Wert\n3. Der Luftdruck steigt wieder deutlich an"
    },
    {
      "q": "Was lässt sich aus der Darstellung der Isobaren in einer Wetterkarte erkennen?",
      "a": "Windrichtung und Druckgefälle; je enger sie liegen, desto größer ist das Druckgefälle und desto stärker ist der Wind."
    },
    {
      "q": "Warum weht der Wind nicht parallel zu den Isobaren (Begründung)?",
      "a": "Durch die Bodenreibung ist der Wind rückgedreht (gegen den Uhrzeigersinn)."
    },
    {
      "q": "1. Wie weht der Wind über See in Bodennähe um ein Tiefdruckgebiet? 2. Mit wie viel Grad Änderung in der Windrichtung müssen Sie etwa rechnen?",
      "a": "1. Der Wind weht nicht parallel zu den Isobaren, er ist rückgedreht und weht in das Tief hinein\n2. Ein bis zwei Strich bzw. ca. 10° bis 20°"
    },
    {
      "q": "1. Wie weht der Wind über See in Bodennähe um ein Hochdruckgebiet? 2. Mit wie viel Grad Änderung in der Windrichtung müssen Sie etwa rechnen?",
      "a": "1. Der Wind weht nicht parallel zu den Isobaren, er ist rückgedreht und weht aus dem Hoch hinaus\n2. Ein bis zwei Strich bzw. ca. 10° bis 20°"
    },
    {
      "q": "Welche Verlagerungsgeschwindigkeiten haben Tiefdruckgebiete: 1. schnelle? 2. mittlere? 3. langsame?",
      "a": "1. schnelle: 30 bis 50 kn\n2. mittlere: 15 bis 30 kn\n3. langsame: bis 15 kn"
    },
    {
      "q": "Wie entstehen Tiefdruckgebiete?",
      "a": "Durch das Aufeinandertreffen von kalten Luftmassen aus hohen Breiten und subtropischen warmen Luftmassen."
    },
    {
      "q": "Welche Windverhältnisse herrschen in der Nähe des Zentrums eines Hochdruckgebiets?",
      "a": "Meist schwache umlaufende Winde."
    },
    {
      "q": "In welchem Abstand werden Isobaren international dargestellt oder gezeichnet?",
      "a": "Im Abstand von 5 hPa oder im Abstand von 4 mbar."
    },
    {
      "q": "Welche Sicht- und Wetterverhältnisse erwarte ich typischerweise 1. vor oder nahe der Warmfront, 2. im Warmsektor, 3. hinter der Kaltfront?",
      "a": "1. Sichtverschlechterung durch Niederschlag, bedeckt, länger andauernder Regen\n2. Diesig oder mäßige Sicht, Wolkenauflockerung, zeitweise Regen\n3. Sichtbesserung, meist gute Sicht. Schauer mit zum Teil kräftigen Böen"
    },
    {
      "q": "Welche Windrichtungen erwarten Sie an den Punkten 1, 2, 3, 4, 5 eines Tiefdruckgebiets auf der Nordhalbkugel?",
      "a": "1. Nordost (NE)\n2. Süd (S)\n3. Südwest (SW)\n4. Nordwest (NW)\n5. Umlaufenden Wind"
    },
    {
      "q": "Um welche Arten von Fronten handelt es sich in der Abbildung, die mit 1, 2 und 3 bezeichnet sind?",
      "a": "1. Okklusionsfront (Tiefausläufer)\n2. Warmfront\n3. Kaltfront"
    },
    {
      "q": "1. Was sind Luftmassengrenzen? 2. Welche Luftmassengrenzen kennen Sie? Nennen Sie mindestens zwei Beispiele!",
      "a": "1. Luftmassengrenzen sind Fronten. Sie trennen Luftmassen unterschiedlicher Temperatur und Luftfeuchtigkeit\n2. Kaltfront, Warmfront, Okklusion"
    },
    {
      "q": "Nennen Sie mindestens drei regionale Windsysteme im Mittelmeer, die beim küstennahen Segeln im Mittelmeer besonders beachtet werden müssen!",
      "a": "Mistral, Scirocco, Bora und Etesien/Meltemi"
    },
    {
      "q": "Mit welchem regionalen Windsystem muss in der Adria gerechnet werden?",
      "a": "Mit Bora."
    },
    {
      "q": "Mit welchem regionalen Windsystem muss in der Ägäis gerechnet werden?",
      "a": "Mit den Etesien / dem Meltemi."
    },
    {
      "q": "Wo bilden sich Tröge um ein Tiefdruckgebiet?",
      "a": "Auf der Rückseite von Tiefdruckgebieten in hochreichender Kaltluft. Ein Trog folgt typischerweise einer Kaltfront."
    },
    {
      "q": "Welche Front wird auch als Ausläufer bezeichnet?",
      "a": "Die Okklusion."
    },
    {
      "q": "Wodurch und wie entsteht am Tage Seewind?",
      "a": "Das Land erwärmt sich bei Sonneneinstrahlung tagsüber stärker als das Wasser. Über Land steigt die erwärmte Luft auf. Das dabei entstehende Bodentief wird durch Seewind (Wind von See) aufgefüllt."
    },
    {
      "q": "Welche Wolkenform zeigt sich am späten Vormittag über Land am Himmel und kündigt Seewind an?",
      "a": "Haufenwolke (Cumulus)."
    },
    {
      "q": "Welche Windgeschwindigkeiten in Knoten oder Beaufort erreicht der Seewind etwa 1. im Mittelmeer, 2. in Nord- und Ostsee?",
      "a": "1. Bis zu 25 kn oder Bft 6\n2. Bis 15 kn, in Einzelfällen bis 20 kn oder Bft 4/5, in Einzelfällen Bft 5/6"
    },
    {
      "q": "Zu welcher Tageszeit müssen Sie mit Seewind rechnen?",
      "a": "Von Mittag bis zum frühen Abend."
    },
    {
      "q": "Welche Windänderung kann der einsetzende Seewind bewirken?",
      "a": "Er verändert den vorher wehenden Wind zum Teil erheblich in Richtung und Stärke."
    },
    {
      "q": "Wodurch und wie entsteht nachts Landwind?",
      "a": "Das Land kühlt sich bei geringer Bewölkung stark ab. Das Wasser ändert seine Temperatur an der Oberfläche dagegen nur geringfügig. Über dem Wasser steigt daher erwärmte Luft auf. Das dabei entstehende Bodentief wird durch Landwind (Wind von Land) aufgefüllt."
    },
    {
      "q": "Welche Windgeschwindigkeiten erreicht nachts der Landwind?",
      "a": "Er weht allgemein schwächer als der Seewind, etwa 1 bis 2 Beaufort."
    },
    {
      "q": "Wann müssen Sie im Laufe eines Tages mit Landwind rechnen?",
      "a": "Von Mitternacht bis zum frühen Morgen."
    },
    {
      "q": "Im Internet finden Sie auf einer Wetterseite eine Vorhersagekarte mit Windpfeilen. In welcher Höhe über dem Erdboden/der Wasseroberfläche gelten die vorhergesagten Windgeschwindigkeiten?",
      "a": "Meistens etwa 10 Meter über dem Erdboden/der Wasseroberfläche."
    },
    {
      "q": "Sie segeln mit Ihrer Yacht raumschots. Nach der nächsten Tonne müssen Sie anluven. Wie wird sich die wahre Windgeschwindigkeit auf Ihrem Windmesser/Anemometer entwickeln?",
      "a": "Sie bleibt unverändert."
    },
    {
      "q": "Welche Windsituation ist mit der Formulierung „Nordwest 6\" bezüglich 1. der Schwankungsbreite in Windrichtung und 2. der Schwankungsbreite in der Windstärke (Böen) verbunden?",
      "a": "1. Die Schwankung in der Windrichtung kann bis zu 45 Grad um die Hauptwindrichtung betragen, also von Westnordwest (WNW) bis Nordnordwest (NNW)\n2. Es können Böen auftreten, die etwa 1 bis 2 Beaufort über dem Mittelwind liegen"
    },
    {
      "q": "Was ist mit dem Zusatz „Schauerböen\" bei der Windvorhersage verbunden?",
      "a": "Besonders während der Passage und auf der Rückseite von Kaltfronten treten in der näheren Umgebung von Schauern Böen auf, die den Mittelwind um 2 Beaufort überschreiten können."
    },
    {
      "q": "Warum werden Gewitterböen in der Windvorhersage zusätzlich angegeben?",
      "a": "Besonders im Sommer können bei Schwachwindlagen Gewitter mit Böen auftreten, die Sturm- oder Orkanstärke erreichen können."
    },
    {
      "q": "Wie ist der Aufbau von Seewetterberichten?",
      "a": "Hinweise auf Starkwind oder Sturm, Wetterlage, Vorhersagen, Aussichten und Stationsmeldungen."
    },
    {
      "q": "Welche lokalen Effekte, die das vorherrschende Windfeld stark verändern, können in Seewetterberichten nur eingeschränkt berücksichtigt werden?",
      "a": "U.a. Land-Seewind-Zirkulation, Düsen- und Kapeffekte."
    },
    {
      "q": "1. Wann werden Starkwindwarnungen verbreitet? 2. Welche Bezeichnung hat die Starkwindwarnung im internationalen Sprachgebrauch?",
      "a": "1. Bei erwarteten oder noch andauernden Windstärken zwischen 6 und 7 Beaufort\n2. Near-gale warning"
    },
    {
      "q": "1. Wann werden Sturmwarnungen verbreitet? 2. Welche Bezeichnung hat die Sturmwarnung im internationalen Sprachgebrauch?",
      "a": "1. Bei erwarteten oder noch andauernden Windstärken mindestens 8 Beaufort\n2. Gale warning"
    },
    {
      "q": "1. Wie ist die kennzeichnende (charakteristische) Wellenhöhe definiert? 2. Womit müssen Sie rechnen?",
      "a": "1. Mittlere Höhe der gut ausgeprägten (Mittel des oberen Drittels) - nicht extremen - Wellen\n2. Einzelne Wellen können das 1,5-fache der kennzeichnenden Wellenhöhe erreichen"
    },
    {
      "q": "Was bedeutet rechtdrehender bzw. rückdrehender Wind?",
      "a": "Rechtdrehend bedeutet Änderung der Windrichtung im Uhrzeigersinn. Rückdrehend bedeutet Änderung der Windrichtung gegen den Uhrzeigersinn um mindestens 45°."
    },
    {
      "q": "Sie hören am Ende des Seewetterberichts die Stationsmeldungen. Was sagen Windrichtung und Windgeschwindigkeit gegenüber den Verhältnissen auf See aus?",
      "a": "Durch die Umgebung der Wetterstation kann die Windrichtung verfälscht werden. Die Windgeschwindigkeit ist meist reduziert, in Einzelfällen auch erhöht."
    },
    {
      "q": "Welche Sichtweiten umfasst der Begriff „diesig\"?",
      "a": "Sichtweiten über 1 km bis 10 km (ca. 0,5 sm bis 6 sm)."
    },
    {
      "q": "Seegebiete sind international festgelegt. In welchen amtlichen Veröffentlichungen können Sie nachlesen, wo sich das Seegebiet „Fischer\" befindet?",
      "a": "Im Handbuch „Nautischer Funkdienst\", im „Jachtfunkdienst für die Nord- und Ostsee\" oder in der „Admiralty List of Radio Signals\"."
    },
    {
      "q": "Sie wollen einen Törn in einem für Sie fremden Küstenrevier fahren. Wo können Sie sich über mittlere Windverhältnisse für bestimmte Jahreszeiten oder Monate informieren?",
      "a": "In den entsprechenden Hafen- und Revierführern. Außerdem z.B. in Monatskarten."
    },
    {
      "q": "1. Was für Wetter muss meistens erwartet werden, wenn der Luftdruck über einen Zeitraum von 3 Stunden um 10 hPa fällt? 2. Was muss bei einem an Bord beobachteten starken Luftdruckfall beachtet werden?",
      "a": "1. Schwerer Sturm\n2. Der Kurs und die Fahrt des Schiffes in Bezug auf das Tiefdruckgebiet"
    },
    {
      "q": "Wie verändert sich der an Bord beobachtete Luftdruckfall, wenn sich ein Fahrzeug mit Westkurs dem Zentrum eines ostwärts ziehenden Tiefdruckgebiets nähert?",
      "a": "Der Luftdruckfall wird verstärkt."
    },
    {
      "q": "Mit welchen Windverhältnissen müssen Sie rechnen, wenn Sie in einem relativ ungeschützten Hafen liegen und der Wind ablandig weht?",
      "a": "Die im Hafen vorherrschenden Windgeschwindigkeiten entsprechen nicht den Verhältnissen auf der freien See."
    },
    {
      "q": "Mit welchen Windverhältnissen müssen Sie rechnen, wenn Sie in einem relativ ungeschützten Hafen liegen und der Wind auflandig weht?",
      "a": "Die im Hafen vorherrschenden Windgeschwindigkeiten entsprechen etwa den Verhältnissen auf der freien See."
    },
    {
      "q": "Warum verstärkt sich der Wind in engen Durchfahrten?",
      "a": "Durch den Düseneffekt (Trichtereffekt) in Durchfahrten. Dabei wird die Luftströmung zusammengepresst und beschleunigt."
    },
    {
      "q": "Mit welcher Windentwicklung ist zu rechnen in 1. Luv und 2. in Lee von Kaps oder Inseln?",
      "a": "1. Die Windrichtung ändert sich in Luv des Kaps zum Teil stark und verläuft oft parallel zum Kap. Die Windgeschwindigkeit nimmt zu.\n2. Die Windrichtung kann bei besonders hohen Gebirgen auch umlaufend werden. Die Windgeschwindigkeit ist meist schwach, kann örtlich aber sehr böig sein (Fallwinde)."
    },
    {
      "q": "Welche Windverhältnisse erwarten Sie in der Nähe von Steilküsten 1. bei auflandigem und 2. bei ablandigem Wind?",
      "a": "1. Der Wind wird durch Küstenführung zum Teil beschleunigt, wenn er nahezu auflandig oder parallel zur Küste weht.\n2. Weht der Wind ablandig, muss örtlich mit umlaufenden Winden und erhöhter Böigkeit (Fallwinden) gerechnet werden."
    },
    {
      "q": "Wie wird sich das Wetter wahrscheinlich entwickeln, wenn der Wind am Abend 1. abflaut oder 2. zunimmt?",
      "a": "1. Langsames Abflauen des Windes ist oft ein Zeichen für gutes Wetter\n2. Windzunahme am Abend kündigt häufig Starkwind, Sturm und Regen an"
    },
    {
      "q": "1. Womit müssen Sie auf der Nordhalbkugel rechnen, wenn nach Durchzug einer Kaltfront der Wind rückdreht und der Luftdruck wieder fällt? 2. Wie nennt man die Wetterlagen?",
      "a": "1. Meist deutliche Wetterverschlechterung mit auffrischendem Wind bis Sturmstärke\n2. Troglage"
    },
    {
      "q": "Welche Windverhältnisse erwarten Sie auf der Nordhalbkugel während der unmittelbaren Passage eines markanten Troges?",
      "a": "Der Wind dreht recht, meist über 60° bis 90°. Winde bis Orkanstärke besonders auf der Rückseite eines Troges."
    },
    {
      "q": "Wie entsteht Nebel?",
      "a": "Zufuhr von Feuchte, Mischung von Luftmassen mit hoher Feuchtigkeit und verschiedener Temperatur, Abkühlung der Luftmasse."
    },
    {
      "q": "Wie ist Nebel definiert?",
      "a": "Sichtweite unter 1000 Meter."
    },
    {
      "q": "1. Wie entsteht Kaltwassernebel? 2. Zu welcher Jahreszeit tritt diese Nebelart in europäischen Gewässern bevorzugt auf?",
      "a": "1. Warme und feuchte Luftmassen werden durch den kalten Untergrund (Meer) unter den Taupunkt abgekühlt.\n2. Überwiegend im Frühjahr"
    },
    {
      "q": "1. Wie entsteht Warmwassernebel? 2. Zu welcher Jahreszeit tritt diese Nebelart in europäischen Gewässern bevorzugt auf?",
      "a": "1. Kalte Luft strömt über warmes Wasser. Durch Verdunstung an der Wasseroberfläche kommt es bei hoher Differenz zwischen der Luft- und Wassertemperatur zur Feuchtesättigung.\n2. Überwiegend im Herbst"
    },
    {
      "q": "1. Wie entsteht Strahlungsnebel? 2. Wo ist diese Nebelart anzutreffen?",
      "a": "1. Nach Sonnenuntergang kann sich bei klarem Himmel die bodennahe Luftschicht über Land unter den Taupunkt abkühlen.\n2. Besonders auf Flüssen und engen Durchfahrten, außerdem durch seewärtige Windverdriftung in Küstennähe"
    },
    {
      "q": "Wodurch kann es im Mittelmeerraum in besonderen Fällen zur Sichtreduktion kommen?",
      "a": "Bei bestimmten Wetterlagen kann mit der Luftmasse transportierter Saharastaub die Sicht stark vermindern."
    },
    {
      "q": "Woraus besteht Seegang?",
      "a": "Aus Windsee und Dünung."
    },
    {
      "q": "Was verstehen Sie unter Windsee?",
      "a": "Seegang, der durch den Wind am Ort oder in der näheren Umgebung angefacht wird."
    },
    {
      "q": "Wovon hängt die Höhe der Windsee ab?",
      "a": "Windgeschwindigkeit, Fetch (Windwirklänge) und Wirkdauer des Windes."
    },
    {
      "q": "1. Was verstehen Sie unter Dünung? 2. Was kann einsetzende hohe Dünung andeuten?",
      "a": "1. Seegang, der dem erzeugenden Windfeld vorausläuft sowie abklingender (alter) Seegang"
    },
    {
      "q": "Was verstehen Sie unter der Wellenhöhe?",
      "a": "Der senkrechte Abstand zwischen Wellenberg und Wellental."
    },
    {
      "q": "Was verstehen Sie unter der Wellenlänge?",
      "a": "Der horizontale Abstand zwischen zwei Wellenbergen."
    },
    {
      "q": "Welchen Seegang müssen Sie erwarten, wenn Sie küstennah bei ablandigem Wind fahren?",
      "a": "Der Seegang wird nicht so hoch sein wie auf der freien See, da der Fetch (Windwirklänge) nur sehr kurz ist."
    },
    {
      "q": "1. Welchen Seegang müssen Sie erwarten, wenn Sie küstennah bei auflandigem Wind fahren? 2. Welche Gefahr besteht bezüglich der Entwicklung des Seegangs außerdem?",
      "a": "1. Der Seegang wird ähnlich ausgeprägt sein wie auf der freien See, da genügend Fetch (Windwirklänge) vorhanden ist.\n2. Dort wo das Wasser flacher wird oder im Bereich von Untiefen mit Brechern und Grundseen gerechnet werden muss."
    },
    {
      "q": "1. Was verstehen Sie unter einer Grundsee? 2. Welche Höhen kann sie erreichen?",
      "a": "1. Meereswellen mit besonders hohen Brechern, die durch Untiefen oder Küstennähe bzw. durch ansteigenden Meeresgrund entstehen\n2. Etwa das 2,5-fache der charakteristischen Wellenhöhe"
    },
    {
      "q": "Wie verändert sich Seegang, wenn Wind und Meeresströmungen (z.B. Gezeitenstrom) entgegengesetzte Richtungen haben?",
      "a": "Die Wellen werden kürzer und steiler."
    },
    {
      "q": "Wie verändert sich Seegang, wenn Wind und Meeresströmungen (z.B. Gezeitenstrom) die gleiche Richtung haben?",
      "a": "Die Wellen werden länger und flacher."
    },
    {
      "q": "1. Was verstehen Sie unter einer Kreuzsee? 2. Geben Sie drei Beispiele an, wo mit Kreuzsee zu rechnen ist!",
      "a": "1. Windsee und Dünung laufen aus unterschiedlichen Richtungen heran\n2. Kurz vor und beim Durchzug einer Kaltfront oder in der Nähe des Tiefkerns"
    },
    {
      "q": "Welcher Seegang ist in Lee kleiner Inseln zu erwarten?",
      "a": "Kreuzlaufende See, die meist kurz und kabbelig ist."
    },
    {
      "q": "Welche Faktoren können die Länge und Höhe des Seegangs erheblich verändern?",
      "a": "Wassertiefe sowie Meeres- und Gezeitenströmungen."
    },
    {
      "q": "Im Internet finden Sie auf einer Wetterseite eine Vorhersage für die Höhe der Dünung. Können Sie daraus den vorherrschenden Wind ableiten?",
      "a": "Nein. Dünung kann vorhanden sein, auch wenn kein Windfeld unmittelbar vorhanden ist."
    },
    {
      "q": "Mit welchem Messinstrument wird an Bord die Windgeschwindigkeit gemessen?",
      "a": "Mit einem Anemometer."
    },
    {
      "q": "Welche Windgeschwindigkeit zeigt das Anemometer an, wenn das Fahrzeug Fahrt durchs Wasser macht?",
      "a": "Die scheinbare Windgeschwindigkeit."
    },
    {
      "q": "1. Warum sollten Luftdrucktendenzen an Bord beobachtet und aufgezeichnet werden? 2. In welchem zeitlichem Abstand sollte man den Luftdruck aufzeichnen?",
      "a": "1. Eventuelle Wetterveränderungen (z.B. Trog, Annäherung eines Tiefdruckgebiets) können registriert werden\n2. Mindestens alle 4 Stunden"
    },
    {
      "q": "Mit welchem Messinstrument wird an Bord der Luftdruck gemessen?",
      "a": "Mit dem Barometer oder Barografen."
    },
    {
      "q": "1. Wie bestimmen Sie an Bord die Windstärke, wenn keine Windmessanlage vorhanden ist?\n2. Wie bestimmen Sie an Bord die Windrichtung, wenn keine Windmessanlage vorhanden ist?",
      "a": "1. Die Windstärke wird geschätzt mithilfe der Beaufortskala in Anlehnung an das Seegangsbild\n2. Die Windrichtung wird anhand der Verlagerung der Wellenkämme geschätzt"
    }
  ]
};
export const SKS_TOPIC_LABELS: Record<SksTopic, string> = {
  navigation: "Navigation",
  recht: "Schifffahrtsrecht",
  wetter: "Wetterkunde",
};
