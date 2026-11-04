# 24H Stream – KevOne2107 × Sgt_Buddie

Statische J.A.R.V.I.S.-Website (HTML/CSS/JS, keine Abhängigkeiten) für GitHub Pages.

## Deployment
1. Neues GitHub-Repo anlegen, Inhalt dieses Ordners nach `main` pushen.
2. **Settings → Pages → Source: GitHub Actions**.
3. (Empfohlen) Twitch-App auf https://dev.twitch.tv/console anlegen und unter **Settings → Secrets → Actions** `TWITCH_CLIENT_ID` und `TWITCH_CLIENT_SECRET` hinterlegen. Der Workflow läuft alle 15 Min., schreibt `data/*.json` (Status, Zuschauer, Follower, Verlauf, Clips) und deployt.
   Ohne Secrets nutzt die Seite im Browser einen Live-Fallback über decapi.me (Status, Titel, Spiel, Zuschauer, Follower; kein Verlauf/keine Clips).
4. **Konfiguration (alles einstellbar):** Texte, Farben, Effekte, sichtbare Bereiche, Player-Standards, Aktualisierungsintervall, Meilensteine, Streamer (inkl. Profilbild-URL und Zusatzlinks), Plan, Spiele, Challenges, manuelle Clips, Links. `config.html` öffnen (Startzeit, Streamer, Plan, Spiele, Challenges, Links). „Speichern“ gilt sofort nur im eigenen Browser; „Herunterladen“ und als `data/config.json` committen, damit es für alle gilt. Alternativ `data/config.json` direkt pflegen: `eventStart` (ISO, z. B. `"2026-12-05T18:00:00+01:00"`), `schedule` (`{"hour":0,"title":"…"}`), `games`, `challenges`, `socials`.

## Layout
In `config.html` → „Layout“: Reihenfolge der Bereiche (↑/↓), „halbe Breite“ pro Bereich (zwei halbe Bereiche stehen nebeneinander, auf kleinen Bildschirmen immer untereinander), maximale Seitenbreite und Chat-Position (unter oder neben den Streams). Das Menü folgt der Reihenfolge.

## Konfiguration für alle speichern
In `config.html` unten Repo (`benutzer/repo`), Branch und einen **Fine-grained Personal Access Token** (nur dieses Repo, Berechtigung *Contents: Read and write*) eintragen und „Auf GitHub speichern“ klicken. Das schreibt `data/config.json` ins Repo, der Workflow veröffentlicht neu (1–2 Min.). Der Token bleibt nur in deinem Browser (optional „merken“), niemals im Repo. „Speichern“ allein wirkt nur lokal und überschreibt im eigenen Browser die Repo-Konfiguration; mit „Lokale Änderungen verwerfen“ oder `?nocfg=1` an der Seiten-URL siehst du wieder die Repo-Version.

## URL-Parameter (OBS-Browserquelle)
`?obs=1` transparent, ohne Header · `&widget=hero|streamers|streams|stats|plan|clips` einzelne Sektion · `&view=dual|a|b` · `&start=2026-12-05T18:00` Countdown testen.

## TwitchTracker
Die Action ruft `twitchtracker.com/api/channels/summary/<login>` ab (undokumentiert, kann mit HTTP 403 blockiert werden). Gelingt der Abruf, erscheinen Ø/Peak-Zuschauer (30 Tage) und Rang im Vergleich; sonst bleibt N/A. Aus dem Browser ist der Abruf wegen CORS/Blockierung nicht möglich.

## Daten & Grenzen
Nicht verfügbare Werte erscheinen als **N/A**, es werden keine Zahlen erfunden. TwitchTracker/TwitchMetrics bieten keine freie API und sind nicht eingebunden; Verlauf wird selbst aus den Snapshots aufgebaut. Der Follower-Gesamtwert über die Helix-API kann je nach Twitch-Berechtigung fehlen, dann greift decapi.me.
