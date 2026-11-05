// Reference content from OttoFuchs_RM-Demo_v1.html. Demo clock is intentional.
export const DEMO_DATE = "2027-06-15";
export const S = [
 {n:1,name:'gering',desc:'Störung in einem Bereich, in Stunden behoben, kein Kunde betroffen.',ex:'Kassensystem der Kantine fällt aus.'},
 {n:2,name:'mäßig',desc:'Störung bis zu einem Tag, interner Mehraufwand, keine Außenwirkung.',ex:'Fileserver eines Bereichs ist einen Tag nicht erreichbar.'},
 {n:3,name:'hoch',desc:'Produktionsausfall über Tage oder Verlust interner Daten, Kunden betroffen.',ex:'Produktionssteuerung einer Linie ist drei Tage gestört.'},
 {n:4,name:'sehr hoch',desc:'Stillstand über eine Woche, Verlust vertraulicher Daten, Meldepflicht.',ex:'Ransomware legt die Büro-IT eine Woche lahm.'},
 {n:5,name:'existenziell',desc:'Gefahr für Menschen, Verlust der Luftfahrtzulassung oder von Kernwissen.',ex:'Manipulierte Fertigungsdaten erreichen ein Luftfahrtteil.'}] as const;
export const W = [
 {n:1,name:'sehr selten',desc:'Seltener als alle 10 Jahre.',ex:'Nie eingetreten, in der Branche kaum bekannt.'},
 {n:2,name:'selten',desc:'Etwa alle 5 bis 10 Jahre.',ex:'In der Branche bekannt, bei uns noch nicht.'},
 {n:3,name:'möglich',desc:'Etwa alle 1 bis 5 Jahre.',ex:'Bei uns schon einmal vorgekommen oder beinahe.'},
 {n:4,name:'wahrscheinlich',desc:'Etwa einmal im Jahr.',ex:'Kommt regelmäßig vor, meist ohne großen Schaden.'},
 {n:5,name:'häufig',desc:'Mehrmals im Jahr oder laufend.',ex:'Passiert ständig, z. B. Phishing-Versuche.'}] as const;
export const SHELP = [{t:'Menschen könnten zu Schaden kommen.',v:5},{t:'Die Luftfahrtzulassung oder unser Kernwissen wäre in Gefahr.',v:5},{t:'Wir müssten Behörden oder Kunden informieren, oder vertrauliche Daten wären weg.',v:4},{t:'Die Produktion stünde länger als eine Woche.',v:4},{t:'Die Produktion stünde einige Tage, Kunden würden es merken.',v:3},{t:'Nur intern spürbar, höchstens einen Tag Mehraufwand.',v:2},{t:'In wenigen Stunden behoben, niemand außerhalb merkt etwas.',v:1}] as const;
export const WHELP = [{t:'Noch nie passiert, auch in der Branche kaum zu hören.',v:1},{t:'Bei uns noch nie, aber aus der Branche bekannt.',v:2},{t:'Bei uns schon einmal passiert oder beinahe passiert.',v:3},{t:'Kommt etwa einmal im Jahr vor.',v:4},{t:'Passiert mehrmals im Jahr oder laufend.',v:5}] as const;
export const OBJ = [['Produktionsanlage','Steuerung, Presse, Linie','Produktion'],['Büro-IT','Rechner, E-Mail, Office','Büro-IT'],['Server / Netzwerk','Rechenzentrum, Verbindungen','Büro-IT'],['Konstruktions- oder Kundendaten','Zeichnungen, Verträge','Konstruktion'],['Personal- oder Finanzdaten','Gehälter, Buchhaltung','Verwaltung'],['Lieferant / Dienstleister','Externe Systeme, Wartung','Verwaltung'],['Zugang / Gebäude','Zutritt, Schlüssel, Werk','Verwaltung'],['Sonstiges','','Verwaltung']] as const;
export const EV = [['Ausfall','fällt aus oder steht still'],['Manipulation','wird verfälscht'],['Verlust','geht verloren oder wird gelöscht'],['Abfluss nach außen','gelangt an Unbefugte'],['Missbrauch','wird unbefugt benutzt']] as const;
export const CAUSE = ['Schadsoftware oder Angriff','Versehen eines Mitarbeiters','Absicht eines Insiders','Technischer Defekt','Veraltetes System','Ausfall eines Lieferanten','Unbekannt'] as const;
export const MEAS = ['Zugriff einschränken','Netz trennen oder absichern','Backup prüfen','System aktualisieren oder ersetzen','Mitarbeiter schulen','Überwachung und Alarmierung','Ablauf anpassen'] as const;
export const REASONS = ['Maßnahmen wirken, Restrisiko ist tragbar','Aufwand steht in keinem Verhältnis zum Risiko','Übergangsweise, bis der Ersatz in Betrieb ist'] as const;
export const R0 = [
['ISR-1','Ransomware Büro-IT','Büro-IT',4,4,3,'2027-09-30',null],['ISR-2','Veraltetes Windows-System','Produktion',5,4,4,'2027-06-30','2027-06-30'],
['ISR-3','Manipulation Fertigungsdaten','Produktion',5,2,3,'2027-09-30',null],['ISR-4','Ausfall Backup-Rechenzentrum','Büro-IT',5,1,4,'2027-06-01','2027-12-31'],
['ISR-5','Angriffe zu spät erkannt','Büro-IT',4,3,4,'2027-09-30','2027-09-30'],['ISR-6','Fremdwartung an Anlagen','Produktion',3,4,2,'2027-10-31',null],
['ISR-7','Abfluss Konstruktionsdaten','Konstruktion',5,3,4,'2027-12-31','2027-12-31'],['ISR-8','Ausfall Produktionsnetz','Produktion',4,3,2,'2027-11-30',null],
['ISR-9','Ausfall Produktionssteuerung','Produktion',3,3,2,'2027-07-15',null],['ISR-10','Nicht genehmigte Systeme','Produktion',3,2,0,'2027-12-15',null],
['ISR-11','Phishing auf Büro-Arbeitsplätzen','Büro-IT',2,4,2,'2027-10-15',null],['ISR-12','Unberechtigter Zugriff auf Konstruktionsdaten','Konstruktion',4,2,2,'2027-11-15',null],
['ISR-13','Fehlerhafte Prüfdaten','Produktion',2,3,1,'2028-01-31',null],['ISR-14','Verlust von Lieferantendaten','Verwaltung',3,2,1,'2028-02-29',null],
['ISR-15','Fehlkonfiguration Firewall','Büro-IT',4,2,2,'2027-05-20',null],['ISR-16','Ausfall E-Mail-Dienst','Büro-IT',2,3,1,'2028-01-15',null],
['ISR-17','Verlust eines verschlüsselten Laptops','Verwaltung',2,2,2,'2028-03-31',null],['ISR-18','Fehlkonfiguration Kassensystem','Verwaltung',1,3,0,'2028-04-30',null],
['ISR-19','Ausfall Besprechungstechnik','Verwaltung',1,2,0,'2028-04-30',null],['ISR-20','Ausfall Etikettendrucker','Verwaltung',2,1,1,'2028-05-31',null],
['ISR-21','Testumgebung ohne Updates','Büro-IT',1,1,2,'2028-05-31',null],['ISR-22','Verlust von Testdaten','Konstruktion',2,2,2,'2028-03-15',null]] as const;
export const M0 = [
['Netztrennung Presse 3','ISR-2','2027-06-01'],['Fernzugang absichern','ISR-6','2027-06-08'],['Produktionsnetz segmentieren','ISR-8','2027-06-05'],['Phishing-Schulung durchführen','ISR-11','2027-06-10'],['Zugriffsrechte prüfen','ISR-12','2027-06-02'],
['Wiederanlauf testen','ISR-4','2027-07-10'],['Protokollauswertung einrichten','ISR-5','2027-07-01'],['Rechte auf Zeichnungen einschränken','ISR-7','2027-07-05'],['Backup der Steuerung prüfen','ISR-9','2027-07-12'],['Regelwerk überprüfen','ISR-15','2027-06-30'],['Verschlüsselung prüfen','ISR-17','2027-07-14'],['Updates einspielen','ISR-21','2027-07-08'],
['Migration auf aktuelle Version','ISR-2','2027-08-31'],['Wartungsvertrag anpassen','ISR-6','2027-08-15'],['Notfallkonzept erstellen','ISR-8','2027-08-31'],['Wiederanlauf der Steuerung üben','ISR-9','2027-09-01'],['Zugriffe protokollieren','ISR-12','2027-09-10'],['Alte Testdaten löschen','ISR-22','2027-08-01'],['Geräteliste aktualisieren','ISR-17','2027-08-20'],['Überwachung einrichten','ISR-21','2027-07-30'],['Wartungspartner schulen','ISR-6','2027-09-05'],
['Alarmierung einrichten','ISR-5','2027-10-15'],['Datenabfluss überwachen','ISR-7','2027-11-30'],['Meldeknopf einführen','ISR-11','2027-10-01'],['Änderungsprozess festlegen','ISR-15','2027-12-15'],['Aufbewahrungsregel festlegen','ISR-22','2027-11-15'],['Redundanz aufbauen','ISR-8','2027-12-01']] as const;
