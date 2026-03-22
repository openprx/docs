---
title: Abstimmung & Entscheidungen
description: "Das Abstimmungssystem von OpenPR unterstützt gewichtete Abstimmung, konfigurierbares Quorum, Genehmigungsschwellenwerte und unveränderliche Entscheidungsaufzeichnungen."
---

# Abstimmung & Entscheidungen

Das Abstimmungssystem in OpenPR bestimmt das Ergebnis von Governance-Vorschlägen. Es unterstützt gewichtete Abstimmung, konfigurierbare Quorum-Anforderungen und Genehmigungsschwellenwerte. Jede Abstimmung und jede Entscheidung wird mit einem unveränderlichen Prüfpfad aufgezeichnet.

## Abstimmungsprozess

1. Ein Vorschlag tritt in den **Abstimmungs**-Zustand ein.
2. Berechtigte Arbeitsbereichsmitglieder geben ihre Stimmen ab (zustimmen, ablehnen oder enthalten).
3. Wenn der Abstimmungszeitraum endet oder das Quorum erreicht ist, werden die Stimmen ausgezählt.
4. Das Ergebnis wird durch den konfigurierten Genehmigungsschwellenwert bestimmt.
5. Eine **Entscheidungsaufzeichnung** mit dem Ergebnis wird erstellt.

## Abstimmungskonfiguration

Governance-Einstellungen werden pro Arbeitsbereich konfiguriert:

| Einstellung | Beschreibung | Beispiel |
|-------------|-------------|---------|
| Quorum | Mindestprozentsatz berechtigter Wähler, die teilnehmen müssen | 50% |
| Genehmigungsschwellenwert | Prozentsatz der Ja-Stimmen, der für die Genehmigung erforderlich ist | 66% |
| Abstimmungszeitraum | Dauer, wie lange das Abstimmungsfenster offen bleibt | 7 Tage |
| Gewichtete Abstimmung | Ob Vertrauenspunkte das Abstimmungsgewicht beeinflussen | An/Aus |

Diese in **Arbeitsbereich-Einstellungen** > **Governance** > **Konfiguration** konfigurieren oder über die API:

```bash
curl -X PUT http://localhost:8080/api/governance/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "quorum_percentage": 50,
    "approval_threshold": 66,
    "voting_period_days": 7,
    "weighted_voting": true
  }'
```

## Gewichtete Abstimmung

Wenn gewichtete Abstimmung aktiviert ist, wird die Stimme jedes Mitglieds mit seinen Vertrauenspunkten multipliziert. Mitglieder mit höheren Vertrauenspunkten haben mehr Einfluss auf das Ergebnis. Siehe [Vertrauenspunkte](./trust-scores) für Details.

## Entscheidungsaufzeichnungen

Jede abgeschlossene Abstimmung erstellt eine **Entscheidungsaufzeichnung** -- einen unveränderlichen Protokolleintrag, der enthält:

- Den Vorschlag, über den abgestimmt wurde
- Stimmauszählungen (zustimmen, ablehnen, enthalten)
- Das endgültige Ergebnis (genehmigt oder abgelehnt)
- Zeitstempel und teilnehmende Wähler
- Entscheidungsdomäne (falls kategorisiert)

Entscheidungsaufzeichnungen können nicht geändert oder gelöscht werden. Sie dienen als maßgebliche Geschichte der Teamentscheidungen.

### Entscheidungen ansehen

```bash
# Entscheidungen auflisten
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/decisions

# Eine bestimmte Entscheidung abrufen
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/decisions/<decision_id>
```

## Veto-Mechanismus

Designierte Vetoer (pro Arbeitsbereich konfiguriert) können genehmigte Vorschläge vetieren:

1. **Veto** -- Ein Vetoer blockiert einen genehmigten Vorschlag mit einem angegebenen Grund.
2. **Eskalation** -- Der Antragsteller kann das Veto zu einer breiteren Abstimmung eskalieren.
3. **Einspruch** -- Jedes Mitglied kann Einspruch gegen ein Veto einlegen.

Vetomacht ist als Sicherheitsmechanismus für Entscheidungen mit hoher Auswirkung konzipiert. Vetoer in **Arbeitsbereich-Einstellungen** > **Governance** > **Vetoer** konfigurieren.

## Prüfprotokolle

Alle Governance-Aktionen werden im Prüfprotokoll aufgezeichnet:

- Vorschlags-Erstellung, Einreichung und Archivierung
- Abgegebene Stimmen (wer, wann, was)
- Entscheidungsaufzeichnungen
- Veto-Ereignisse und Eskalationen
- Konfigurationsänderungen

```bash
# Governance-Prüfprotokolle ansehen
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/governance/audit-logs
```

## Entscheidungsdomänen

Entscheidungen können in Domänen kategorisiert werden (z.B. "Architektur", "Prozess", "Tooling") für bessere Organisation und Filterung. Domänen werden pro Arbeitsbereich konfiguriert.

## Nächste Schritte

- [Vertrauenspunkte](./trust-scores) -- Wie Vertrauenspunkte das Abstimmungsgewicht beeinflussen
- [Vorschläge](./proposals) -- Vorschläge erstellen, die zur Abstimmung kommen
- [Governance-Übersicht](./index) -- Vollständige Governance-Modulreferenz
