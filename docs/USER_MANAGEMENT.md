# Benutzerverwaltung & Rechtesystem

## Übersicht

Das LVS Returns WMS System verfügt über ein vollständiges Benutzerverwaltungs- und Rechtesystem, das auf Benutzernamen basiert.

---

## Features

### ✅ Benutzerverwaltung
- **Benutzer anlegen, bearbeiten und löschen**
- **Benutzername als eindeutiger Identifikator**
- **Automatische Benutzer-Erkennung beim Login**
- **Persistente Speicherung im LocalStorage**

### ✅ Rollen-System
Das System unterstützt 3 vordefinierte Rollen:

#### 1. 👑 **Administrator**
- **Volle Systemrechte**
- Benutzerverwaltung
- Systemeinstellungen
- Alle CRUD-Operationen
- Daten löschen

#### 2. 📊 **Manager**
- **Erweiterte Rechte**
- Daten anzeigen
- Daten bearbeiten
- Export/Import
- Keine Systemeinstellungen

#### 3. 👤 **Operator**
- **Basis-Rechte**
- Daten anzeigen
- Wareneingang erfassen
- Keine Bearbeitungsrechte
- Keine Löschrechte

---

## Verwendung

### Benutzer-Login

Beim ersten Besuch der Website wird der Benutzer nach seinem Benutzernamen gefragt:

```javascript
// Automatisch beim Laden der Seite
// Prompt: "Bitte geben Sie Ihren Benutzernamen ein:"
```

**Verhalten:**
1. Wenn Benutzer existiert → Daten werden geladen
2. Wenn Benutzer nicht existiert → Neuer Benutzer wird als "Operator" angelegt
3. Benutzername wird im LocalStorage gespeichert
4. Bei erneutem Besuch automatischer Login

### Benutzerverwaltung in Einstellungen

**Zugriff:** Einstellungen → Tab "👥 Benutzerverwaltung"

#### Neuen Benutzer anlegen:
1. Klicken Sie auf "➕ Neuer Benutzer"
2. Geben Sie die Daten ein:
   - **Benutzername** (erforderlich, eindeutig)
   - Vollständiger Name (optional)
   - E-Mail (optional)
   - **Rolle** (Administrator, Manager, Operator)
3. Klicken Sie auf "Hinzufügen"

#### Benutzer bearbeiten:
1. Klicken Sie in der Tabelle auf "Bearbeiten"
2. Ändern Sie die gewünschten Felder:
   - Vollständiger Name
   - E-Mail
   - **Rolle** (ändert Berechtigungen)
   - Status (Aktiv/Inaktiv)
3. Klicken Sie auf "Speichern"

#### Benutzer löschen:
1. Klicken Sie in der Tabelle auf "Löschen"
2. Bestätigen Sie die Löschung
3. **Hinweis:** Administratoren können nicht gelöscht werden

---

## Berechtigungen

### Berechtigungs-Matrix

| Funktion | Admin | Manager | Operator |
|----------|-------|---------|----------|
| **Daten anzeigen** | ✓ | ✓ | ✓ |
| **Wareneingang erfassen** | ✓ | ✓ | ✓ |
| **Daten bearbeiten** | ✓ | ✓ | ✗ |
| **Daten löschen** | ✓ | ✗ | ✗ |
| **Export/Import** | ✓ | ✓ | ✗ |
| **Benutzerverwaltung** | ✓ | ✗ | ✗ |
| **Systemeinstellungen** | ✓ | ✗ | ✗ |
| **Carrier-Konfiguration** | ✓ | ✗ | ✗ |
| **Dropdown-Optionen** | ✓ | ✗ | ✗ |
| **Backup/Restore** | ✓ | ✗ | ✗ |

### Berechtigungen prüfen (JavaScript)

```javascript
// Aktuellen Benutzer abrufen
const user = getCurrentUser();
console.log(user.username); // z.B. "max.mustermann"
console.log(user.role); // z.B. "manager"

// Berechtigung prüfen
if (hasPermission('inventory', 'edit')) {
  // Benutzer darf Lagerbestand bearbeiten
}

// Rolle prüfen
if (isAdmin()) {
  // Benutzer ist Administrator
}

if (isManager()) {
  // Benutzer ist Manager oder Admin
}
```

---

## API Endpunkte

### GET /api/users
Alle Benutzer abrufen

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "Administrator",
    "role": "admin",
    "role_display_name": "Administrator",
    "is_active": 1,
    "last_login": "2026-01-09T12:00:00.000Z",
    "created_at": "2026-01-01T10:00:00.000Z"
  }
]
```

### GET /api/users/:id
Einzelnen Benutzer nach ID abrufen

### GET /api/users/by-username/:username
Benutzer nach Benutzernamen abrufen

**Beispiel:**
```javascript
const response = await fetch('/api/users/by-username/max.mustermann');
const user = await response.json();
```

### POST /api/users
Neuen Benutzer erstellen

**Request Body:**
```json
{
  "username": "max.mustermann",
  "email": "max@example.com",
  "full_name": "Max Mustermann",
  "role": "operator"
}
```

### PUT /api/users/:id
Benutzer aktualisieren

**Request Body:**
```json
{
  "email": "new-email@example.com",
  "full_name": "Neuer Name",
  "role": "manager",
  "is_active": true
}
```

### DELETE /api/users/:id
Benutzer löschen

**Hinweis:** Administratoren können nicht gelöscht werden.

---

## Datenbank-Schema

### Tabelle: `users`

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator',
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (role) REFERENCES roles(name)
);
```

### Tabelle: `roles`

```sql
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions TEXT, -- JSON
  created_at TEXT NOT NULL
);
```

---

## Benutzer wechseln

### Über UI:
1. Klicken Sie auf Ihr Benutzerprofil in der Topbar
2. Wählen Sie "Benutzer wechseln"
3. Geben Sie den neuen Benutzernamen ein

### Programmatisch:
```javascript
// Benutzer wechseln
currentUserManager.switchUser();

// Abmelden
currentUserManager.logout();
```

---

## LocalStorage

### Gespeicherte Daten:
```javascript
// Aktueller Benutzername
localStorage.getItem('wms_current_user'); // z.B. "max.mustermann"
```

### Manuell zurücksetzen:
```javascript
localStorage.removeItem('wms_current_user');
window.location.reload();
```

---

## Sicherheit

### ⚠️ Wichtige Hinweise:

1. **Keine Passwörter:** Das aktuelle System verwendet keine Passwörter. Benutzer werden nur über Benutzernamen identifiziert.

2. **Client-Side Validierung:** Berechtigungen werden client-seitig geprüft. Für produktive Systeme sollte eine server-seitige Authentifizierung implementiert werden.

3. **LocalStorage:** Benutzerdaten werden im LocalStorage gespeichert und können von jedem Benutzer gelöscht werden.

### Empfohlene Erweiterungen für Produktivsysteme:

1. **Passwort-Authentifizierung**
   - Passwort-Hashing (bcrypt)
   - Session-Management
   - JWT-Tokens

2. **Server-Side Authorization**
   - Middleware für Berechtigungsprüfung
   - API-Endpunkt-Schutz
   - Role-based Access Control (RBAC)

3. **Audit-Trail**
   - Logging aller Benutzeraktionen
   - Login/Logout-Historie
   - Änderungsprotokoll

---

## Best Practices

### ✅ DO:
- Verwenden Sie eindeutige Benutzernamen
- Weisen Sie Benutzern die passende Rolle zu
- Prüfen Sie Berechtigungen vor kritischen Aktionen
- Dokumentieren Sie Rollenänderungen

### ❌ DON'T:
- Verwenden Sie keine generischen Benutzernamen wie "user1"
- Geben Sie nicht allen Benutzern Admin-Rechte
- Löschen Sie keine aktiven Benutzer
- Ändern Sie nicht die Rolle von Administratoren

---

## Fehlerbehebung

### Problem: "Benutzer nicht gefunden"
**Lösung:** 
- Prüfen Sie den Benutzernamen auf Tippfehler
- Erstellen Sie den Benutzer neu in den Einstellungen

### Problem: "Keine Berechtigung"
**Lösung:**
- Prüfen Sie die Rolle des Benutzers
- Kontaktieren Sie einen Administrator
- Ändern Sie die Rolle in den Einstellungen (nur Admin)

### Problem: "Benutzer kann sich nicht anmelden"
**Lösung:**
- Prüfen Sie ob Benutzer aktiv ist (is_active = 1)
- Löschen Sie LocalStorage und versuchen Sie es erneut
- Prüfen Sie die Browser-Konsole auf Fehler

---

## Beispiel-Workflow

### Neuen Mitarbeiter hinzufügen:

1. **Administrator meldet sich an**
   ```
   Benutzername: admin
   ```

2. **Öffnet Einstellungen → Benutzerverwaltung**

3. **Klickt auf "➕ Neuer Benutzer"**

4. **Gibt Daten ein:**
   ```
   Benutzername: max.mustermann
   Name: Max Mustermann
   E-Mail: max@example.com
   Rolle: Operator
   ```

5. **Klickt auf "Hinzufügen"**

6. **Mitarbeiter kann sich jetzt anmelden:**
   ```
   Benutzername: max.mustermann
   ```

---

**Version:** 1.0  
**Letzte Aktualisierung:** Januar 2026  
**Status:** Produktionsbereit (mit Einschränkungen - siehe Sicherheit)
