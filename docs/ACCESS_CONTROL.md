# Access Control & Admin Features - Dokumentation

## Übersicht

Das GXO Returns WMS System verfügt jetzt über ein vollständiges Zugriffskontroll-System mit Anfrageverwaltung und Admin-Tools.

---

## 🔐 Zugriffskontrolle

### Funktionsweise

**Ohne Registrierung:**
- Benutzer werden automatisch zur **Access Request Seite** weitergeleitet
- Moderne, englischsprachige Benutzeroberfläche
- Einfache Formular-Eingabe

**Mit Registrierung:**
- Automatischer Login über LocalStorage
- Direkter Zugriff auf das WMS System
- Berechtigungen basierend auf zugewiesener Rolle

### Access Request Seite

**URL:** `http://localhost:3000/access-request`

**Features:**
- ✅ Modernes, animiertes Design
- ✅ Englischsprachige Oberfläche
- ✅ Responsive Layout
- ✅ Echtzeit-Validierung
- ✅ Rollen-Beschreibungen
- ✅ Success-Screen nach Einreichung

**Felder:**
- **Username*** - Eindeutiger Benutzername
- **Full Name*** - Vollständiger Name
- **Email** - E-Mail-Adresse (optional)
- **Requested Role** - Gewünschte Rolle (Dropdown)
- **Reason** - Begründung (optional)

---

## 👥 Zugriffs-Anfragen Verwaltung

### Zugriff

**Einstellungen → Benutzerverwaltung → Zugriffs-Anfragen**

Nur sichtbar für:
- ✅ **Administrator** - Voller Zugriff
- ✅ **Manager** - Kann genehmigen/ablehnen

### Anfragen-Status

**⏳ Ausstehend (Pending)**
- Werden prominent oben angezeigt
- Orange hervorgehoben
- Anzahl wird angezeigt

**✓ Genehmigt (Approved)**
- Grüne Kennzeichnung
- Benutzer wurde erstellt
- In "Bearbeitete Anfragen" (collapsed)

**✗ Abgelehnt (Rejected)**
- Rote Kennzeichnung
- Mit Ablehnungsgrund (optional)
- In "Bearbeitete Anfragen" (collapsed)

### Aktionen

**Genehmigen:**
1. Klick auf "✓ Genehmigen"
2. Rolle bestätigen/ändern
3. Optionale Notiz eingeben
4. Benutzer wird automatisch erstellt
5. Anfrage wird als "Genehmigt" markiert

**Ablehnen:**
1. Klick auf "✗ Ablehnen"
2. Grund eingeben (optional)
3. Bestätigung
4. Anfrage wird als "Abgelehnt" markiert

**Löschen:**
- Nur für bearbeitete Anfragen
- Entfernt Anfrage aus der Liste

---

## 👁️ Admin View Switcher

### Funktion

Ermöglicht Administratoren, die Ansicht anderer Rollen zu simulieren, um:
- Berechtigungen zu testen
- UI für verschiedene Rollen zu prüfen
- Rechte-Einstellungen zu validieren

### Verwendung

**Aktivierung:**
- Nur für Benutzer mit Rolle "Administrator"
- Floating Button unten rechts (👁️)

**Bedienung:**
1. Klick auf den View Switcher Button (👁️)
2. Panel öffnet sich
3. Gewünschte Rolle auswählen
4. Seite lädt automatisch neu mit simulierter Rolle
5. Orange Badge zeigt simulierte Rolle an

**Rollen-Optionen:**
- 👑 **Administrator** - Ihre eigene Rolle (Standard)
- 📊 **Manager** - Extended rights + approvals
- 👔 **Team Lead** - Team management
- 🛠️ **Process Assistant** - Process support
- 🎓 **Trainer** - Training & read access
- 👤 **Operator** - Basic operations

**Zurücksetzen:**
- Button "🔄 Reset to Admin View" im Panel
- Oder Seite neu laden

**Visuelle Indikatoren:**
- **Orange Badge** oben rechts: "⚠️ Simulating: [Rolle]"
- **Panel**: Aktive Rolle ist grün markiert
- **Current View**: Zeigt aktuelle Ansicht

### Technische Details

**Implementierung:**
- Temporäre Änderung der Benutzer-Rolle
- Berechtigungen werden aus der Datenbank geladen
- Original-Benutzer bleibt gespeichert
- Automatischer Reset bei erneutem Login

**Persistenz:**
- Simulation überlebt keine Seiten-Reloads (außer durch Panel)
- Original-Rolle wird bei Logout wiederhergestellt
- Keine Änderung an der Datenbank

---

## 🎯 6 Rollen-System

### Rollen-Übersicht

| Rolle | Icon | Beschreibung | Berechtigungen |
|-------|------|--------------|----------------|
| **Administrator** | 👑 | Vollzugriff | Alle Funktionen inkl. System |
| **Manager** | 📊 | Erweiterte Rechte | Genehmigungen, Export, Bearbeiten |
| **Team Lead** | 👔 | Team-Management | Team-Überwachung, Reports |
| **Process Assistant** | 🛠️ | Prozess-Support | Datenerfassung, Bearbeiten |
| **Trainer** | 🎓 | Schulung | Lesezugriff auf alle Module |
| **Operator** | 👤 | Basis-Rechte | Wareneingang, Anzeigen |

### Berechtigungs-Matrix

| Modul | Admin | Manager | Teamlead | Process Asst. | Trainer | Operator |
|-------|-------|---------|----------|---------------|---------|----------|
| **Dashboard** | ✓✓✓ | ✓✓- | ✓✓- | ✓-- | ✓-- | ✓-- |
| **Inbound** | ✓✓✓ | ✓✓✓ | ✓✓- | ✓✓- | ✓✓- | ✓✓- |
| **Inventory** | ✓✓✓ | ✓✓✓ | ✓✓- | ✓✓- | ✓-- | ✓-- |
| **Movement** | ✓✓✓ | ✓✓✓ | ✓✓- | ✓✓- | ✓✓- | ✓✓- |
| **Archive** | ✓✓✓ | ✓-- | ✓-- | ✓-- | ✓-- | ✓-- |
| **Settings** | ✓✓✓ | ✓-- | ✓-- | --- | ✓-- | --- |
| **Users** | ✓✓✓ | ✓-- | ✓-- | --- | ✓-- | --- |
| **Reports** | ✓✓✓ | ✓✓- | ✓✓- | ✓-- | ✓-- | ✓-- |
| **Export** | ✓✓✓ | ✓✓✓ | ✓✓✓ | ✓✓✓ | ✓✓✓ | --- |
| **Backup** | ✓✓✓ | ✓-- | --- | --- | --- | --- |
| **Approve Requests** | ✓ | ✓ | - | - | - | - |

**Legende:**
- ✓✓✓ = Read, Write, Delete
- ✓✓- = Read, Write
- ✓-- = Read only
- --- = Kein Zugriff

---

## 🚀 Workflow

### Neuer Mitarbeiter

**1. Mitarbeiter stellt Anfrage:**
```
Website öffnen → http://localhost:3000
↓
Automatische Weiterleitung → /access-request
↓
Formular ausfüllen (Username, Name, etc.)
↓
Submit Request → Anfrage wird gespeichert
```

**2. Admin/Manager genehmigt:**
```
Login als Admin/Manager
↓
Einstellungen → Benutzerverwaltung
↓
Zugriffs-Anfragen → Ausstehende Anfragen
↓
✓ Genehmigen → Rolle bestätigen → Benutzer erstellt
```

**3. Mitarbeiter kann sich anmelden:**
```
Website öffnen
↓
System erkennt registrierten Benutzer
↓
Automatischer Login → Zugriff auf WMS
```

### Admin testet Berechtigungen

**1. Admin aktiviert View Switcher:**
```
Login als Admin
↓
Klick auf 👁️ Button (unten rechts)
↓
Panel öffnet sich
```

**2. Rolle simulieren:**
```
Gewünschte Rolle auswählen (z.B. Operator)
↓
Seite lädt neu
↓
Orange Badge: "⚠️ Simulating: Operator"
↓
UI zeigt Ansicht eines Operators
```

**3. Testen & Zurücksetzen:**
```
Navigation testen
↓
Berechtigungen prüfen
↓
Klick auf "🔄 Reset to Admin View"
↓
Zurück zur Admin-Ansicht
```

---

## 🔧 Technische Details

### API-Endpunkte

**Zugriffs-Anfragen:**
```
GET    /api/access-requests           - Alle Anfragen
POST   /api/access-requests           - Neue Anfrage
PUT    /api/access-requests/:id/approve - Genehmigen
PUT    /api/access-requests/:id/reject  - Ablehnen
DELETE /api/access-requests/:id       - Löschen
```

**Benutzer:**
```
GET    /api/users                     - Alle Benutzer
GET    /api/users/:id                 - Einzelner Benutzer
GET    /api/users/by-username/:username - Benutzer nach Name
POST   /api/users                     - Neuer Benutzer
PUT    /api/users/:id                 - Benutzer aktualisieren
DELETE /api/users/:id                 - Benutzer löschen
```

**Rollen:**
```
GET    /api/users/roles/list          - Alle Rollen mit Berechtigungen
```

### Datenbank-Schema

**access_requests:**
```sql
CREATE TABLE access_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT,
  full_name TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  requested_role TEXT DEFAULT 'operator',
  reviewed_by INTEGER,
  reviewed_at TEXT,
  review_notes TEXT,
  created_at TEXT,
  FOREIGN KEY(reviewed_by) REFERENCES users(id)
);
```

**users:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  password_hash TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'operator',
  custom_permissions TEXT,
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT,
  created_by TEXT
);
```

### JavaScript-Module

**Admin View Switcher:**
- `public/js/core/admin-view-switcher.js`
- Auto-initialisiert für Admins
- Floating Button + Panel

**Current User:**
- `public/js/core/current-user.js`
- Zugriffskontrolle
- Auto-Redirect zu /access-request

**User Management:**
- `public/js/features/user-management.js`
- Anfragen-Verwaltung
- Genehmigen/Ablehnen

---

## 🎨 Design-Features

### Access Request Seite

**Visual Elements:**
- Gradient Background mit Animation
- Floating Logo mit Animation
- Smooth Transitions
- Responsive Layout
- Loading States
- Success Screen

**Colors:**
- Primary: `#667eea` → `#764ba2`
- Success: `#10b981`
- Error: `#ef4444`
- Warning: `#f59e0b`

### Admin View Switcher

**UI Components:**
- Floating Action Button (56x56px)
- Slide-up Panel Animation
- Role Cards mit Hover-Effekten
- Active State Indicators
- Simulated Badge mit Pulse-Animation

---

## 📋 Best Practices

### Für Administratoren

✅ **DO:**
- Anfragen zeitnah bearbeiten
- Passende Rolle zuweisen
- Notizen bei Ablehnung hinterlassen
- View Switcher zum Testen nutzen
- Regelmäßig bearbeitete Anfragen löschen

❌ **DON'T:**
- Anfragen ohne Prüfung genehmigen
- Falsche Rollen zuweisen
- Anfragen ohne Grund ablehnen
- Aktive Benutzer deaktivieren ohne Grund

### Für Benutzer

✅ **DO:**
- Eindeutigen Benutzernamen wählen
- Echten Namen angeben
- Passende Rolle anfordern
- Begründung hinzufügen

❌ **DON'T:**
- Mehrere Anfragen gleichzeitig stellen
- Falsche Informationen angeben
- Höhere Rollen ohne Grund anfordern

---

## 🔒 Sicherheit

**Implementiert:**
- ✅ Zugriffskontrolle auf Seitenebene
- ✅ Nur registrierte Benutzer haben Zugriff
- ✅ Rollen-basierte Berechtigungen
- ✅ Aktive/Inaktive Status
- ✅ Last Login Tracking

**Empfehlungen für Produktion:**
- 🔐 Passwort-Authentifizierung
- 🔐 JWT-Tokens
- 🔐 Session-Management
- 🔐 Rate Limiting
- 🔐 HTTPS
- 🔐 Server-side Authorization

---

**Version:** 2.0  
**Letzte Aktualisierung:** Januar 2026  
**Status:** Feature-Complete
