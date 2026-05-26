# Systemarkitektur

## Arkitektur

Prosjektet følger en klient-server-arkitektur.

Frontend kommuniserer med backend gjennom REST API.

```text
Frontend (HTML/CSS/JS)
        ↓
Express API (Node.js)
        ↓
MariaDB Database
```

### Frontend

Frontend håndterer:

- brukergrensesnitt
- rendering
- DOM-manipulering
- API-kall

### Backend

Backend håndterer:

- API-ruter
- databasekommunikasjon
- CRUD-operasjoner
- validering

### Database

MariaDB lagrer:
- prosjekter
- oppgaver
- brukerdata