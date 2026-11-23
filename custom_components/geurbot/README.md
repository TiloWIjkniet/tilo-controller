# GeurBot voor Home Assistant

Deze map bevat de eerste HA-native migratie van de GeurBot-controller. De ESP32-API-contracten blijven ongewijzigd; de integratie gebruikt de bestaande endpointpaden en JSON-payloads uit de Python-backend.

## Installatie

1. Kopieer `custom_components/geurbot` naar `<config>/custom_components/geurbot` op Home Assistant Green.
2. Kopieer de volledige map `custom_components/geurbot` naar Home Assistant; daarin staan zowel de integratie als de frontendbestanden.
3. Herstart Home Assistant.
4. Ga naar **Instellingen → Apparaten & diensten → Integratie toevoegen → GeurBot**.
5. Vul eventueel een Home Assistant-meldingsservice in (bijvoorbeeld `notify.mobile_app_...`) om meldingen ook naar de Companion-app te sturen.
6. Maak een standaard Home Assistant-dashboard van het type **Webpagina** (of voeg een Webpagina-kaart toe).
7. Gebruik als URL: `/geurbot_static/index.html`. Open dit dashboard terwijl je bent ingelogd op hetzelfde Home Assistant-adres.

De frontend wordt als browser-native ES-module geladen; er is voor de normale HA-installatie geen Node/Vite-build nodig.

De frontend gebruikt de actieve Home Assistant-sessie uit de browseropslag. De pagina moet daarom via hetzelfde Home Assistant-adres worden geopend; gebruik geen los IP-adres of externe hostnaam voor de iframe-URL. De oude Python-server hoeft niet te draaien.

## Services

- `geurbot.api_command`: voert GET/POST/PUT/PATCH/DELETE uit op een gekoppeld GeurBot-apparaat. De `endpoint` is altijd een relatief pad op het geregistreerde apparaat; externe URL's zijn niet toegestaan.
- `geurbot.set_schedules`: slaat schedule-data lokaal op bij de geselecteerde geurmodule.
- `geurbot.scan_devices`: voert mDNS/Zeroconf-discovery uit.

Voorbeeld:

```yaml
action: geurbot.api_command
response_variable: result
data:
  device_id: "4CE..."
  endpoint: "/api/device/fragrances/get-all"
  method: GET
```

## Belangrijke migratiepunten

- Apparaatregistraties die alleen in het RAM van de oude server stonden, kunnen niet uit de ZIP worden hersteld. De apparaten moeten opnieuw ontdekt/gekoppeld worden of uit een export van de draaiende oude server worden geïmporteerd.
- De notificatie-instellingen uit `backend/data/notification_settings.json` worden eenmalig naar HA Store gekopieerd.
- Schedules en lokale fragrancegegevens worden als onderdeel van de device-records in HA Store bewaard.
- De oude pairing-code bevatte een hardcoded placeholder (`JOUW_OKEN`). De nieuwe integratie gebruikt die niet. De pairing-handshake wordt bewust niet als succesvol gemeld totdat de callback-authenticatie veilig is ingericht.
- De bestaande frontend wordt rechtstreeks als ES-module geladen via `/geurbot_static/`. Er wordt geen custom sidebar panel of `panel_custom`-dependency meer geregistreerd.
- De Webpage-dashboard-configuratie maak je eenmalig via de Home Assistant-interface; de integratie maakt geen dashboard automatisch aan.
- De frontend leest het Home Assistant access-token uit de same-origin `hassTokens`-sessie. Het token wordt niet in de URL, frontendbestanden of eigen opslag gekopieerd.

## Status

De code is statisch op Python-syntax gecontroleerd. Een echte Home Assistant runtime-test, ESP32-test en frontend build zijn nog nodig voordat dit als productieklare migratie kan worden beschouwd.
