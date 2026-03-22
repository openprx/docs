---
title: Vertrauenspunkte
description: "Das Vertrauenspunktsystem von OpenPR verfolgt die Reputation pro Benutzer basierend auf Beteiligung, Entscheidungsqualität und Team-Feedback. Vertrauenspunkte beeinflussen das Abstimmungsgewicht."
---

# Vertrauenspunkte

Vertrauenspunkte sind eine Reputationsmetrik pro Benutzer in OpenPR, die Beteiligungsqualität und Entscheidungsfindungsgeschichte verfolgt. Wenn gewichtete Abstimmung aktiviert ist, beeinflussen Vertrauenspunkte direkt die Abstimmungsmacht.

## Wie Vertrauenspunkte funktionieren

Jedes Arbeitsbereichsmitglied hat Vertrauenspunkte, die seine Governance-Beteiligung widerspiegeln:

| Faktor | Auswirkung | Beschreibung |
|--------|-----------|-------------|
| Vorschlagsqualität | Positiv | Genehmigte Vorschläge erhöhen den Punktestand |
| Abstimmungsbeteiligung | Positiv | Regelmäßige Abstimmung erhöht den Punktestand |
| Übereinstimmende Entscheidungen | Positiv | Mit der endgültigen Mehrheit abstimmen |
| Abgelehnte Vorschläge | Negativ | Abgelehnte Vorschläge verringern den Punktestand |
| Vetierte Entscheidungen | Negativ | Vorschläge, die vetiert werden |
| Einsprüche | Variabel | Erfolgreiche Einsprüche stellen den Punktestand wieder her |

## Punktebereich

Vertrauenspunkte werden auf einen numerischen Bereich normiert. Höhere Punkte weisen auf zuverlässigere Governance-Beteiligung hin:

| Bereich | Stufe | Abstimmungsgewicht |
|---------|-------|-------------------|
| 80-100 | Hohes Vertrauen | 1,5-faches Gewicht |
| 50-79 | Normal | 1,0-faches Gewicht |
| 20-49 | Geringes Vertrauen | 0,75-faches Gewicht |
| 0-19 | Minimal | 0,5-faches Gewicht |

::: tip Gewichtete Abstimmung
Die Gewichtung durch Vertrauenspunkte gilt nur, wenn **gewichtete Abstimmung** in der Arbeitsbereichs-Governance-Konfiguration aktiviert ist. Andernfalls haben alle Stimmen gleiches Gewicht.
:::

## Vertrauenspunkte ansehen

### Über die Web-UI

Zu **Arbeitsbereich-Einstellungen** > **Governance** > **Vertrauenspunkte** navigieren, um alle Mitgliederscores und den Verlauf zu sehen.

### Über die API

```bash
# Vertrauenspunkte für den Arbeitsbereich abrufen
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/trust-scores

# Vertrauenspunkteverlauf eines bestimmten Benutzers abrufen
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/trust-scores/<user_id>/history
```

## Vertrauenspunkteverlauf

Jede Änderung an Vertrauenspunkten wird in der Tabelle `trust_score_logs` aufgezeichnet mit:

- Dem betroffenen Benutzer
- Vorherigem und neuem Punktestandswert
- Dem Grund für die Änderung
- Zeitstempel
- Zugehörigem Vorschlag oder Entscheidung (falls zutreffend)

Dieser Verlauf bietet Transparenz darüber, wie sich Punktestände im Laufe der Zeit entwickeln.

## Einsprüche

Wenn ein Mitglied glaubt, dass seine Vertrauenspunkte unfair beeinflusst wurden, kann es Einspruch einlegen:

1. Zum eigenen Vertrauenspunkteverlauf navigieren.
2. Auf **Einspruch** bei einer bestimmten Punktestandsänderung klicken.
3. Einen Grund für den Einspruch angeben.
4. Arbeitsbereichsadministratoren überprüfen und entscheiden über den Einspruch.

Erfolgreiche Einsprüche stellen die Punktestandsänderung wieder her. Einspruchsdatensätze werden im Prüfprotokoll aufbewahrt.

```bash
# Einspruch einlegen
curl -X POST http://localhost:8080/api/trust-scores/<user_id>/appeals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"reason": "Score decreased due to a test proposal that was not meant for production."}'
```

## Auswirkungsbewertungen

Vertrauenspunkte sind ein Eingangsfaktor in **Auswirkungsbewertungen** -- Bewertungen, wie ein Vorschlag oder eine Entscheidung das Projekt beeinflusst. Auswirkungsbewertungen umfassen:

- Quantitative Metriken (geschätzter Aufwand, Risikoniveau, Umfang)
- Qualitative Einschätzungen von Bewertungsteilnehmern
- Historische Daten aus ähnlichen Entscheidungen

## Nächste Schritte

- [Abstimmung & Entscheidungen](./voting) -- Wie Vertrauenspunkte Abstimmungsergebnisse beeinflussen
- [Vorschläge](./proposals) -- Vorschläge erstellen, die Vertrauenspunkte beeinflussen
- [Governance-Übersicht](./index) -- Vollständige Governance-Modulreferenz
