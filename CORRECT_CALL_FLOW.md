# 🎯 FLUSSO CHIAMATA CORRETTO - Come WhatsApp

## ✅ **NUOVO FLUSSO IMPLEMENTATO**

### **User A (chi chiama):**
```
1. Dashboard → Click "Videochiamata" su contatto
2. CallingScreen (schermata attesa)
   - Avatar target con animazione pulse
   - "Chiamata in corso..."
   - "In attesa di risposta"
   - Bottone "Annulla"
   - ❌ NO camera attiva
   - ❌ NO stream avviato
3. [Attesa risposta User B]
   ↓
   A. User B accetta → VideoCall (camera si accende) ✅
   B. User B rifiuta → Torna a Dashboard ❌
   C. Timeout 60s → "Non risponde" → Dashboard ⏱️
```

### **User B (chi riceve):**
```
1. Dashboard → Riceve segnale chiamata
2. IncomingCallModal (squillo)
   - Avatar User A
   - "Videochiamata in arrivo"
   - Ringtone (se configurato)
   - Bottoni [Accetta] [Rifiuta]
   - ❌ NO camera attiva
3. [User B decide]
   ↓
   A. Click [Accetta] → VideoCall (camera si accende) ✅
   B. Click [Rifiuta] → Torna a Dashboard ❌
   C. Non risponde 60s → Auto-rifiuta ⏱️
```

---

## 🔄 **CONFRONTO PRIMA/DOPO**

### **❌ PRIMA (SBAGLIATO):**
```
User A click
  ↓
CallPreparation (2.5s - inutile)
  ↓
VideoCall parte SUBITO
  ↓
Camera si accende SUBITO ❌
  ↓
User B ancora non ha accettato! ❌
  ↓
Spreco risorse (camera attiva per niente) ❌
```

### **✅ DOPO (CORRETTO):**
```
User A click
  ↓
CallingScreen (schermata attesa)
  ↓
Camera SPENTA ✅
  ↓
User B vede IncomingCallModal
  ↓
User B accetta
  ↓
ORA camera si accende per entrambi ✅
  ↓
VideoCall attivo ✅
```

---

## 🎨 **NUOVO COMPONENTE: CallingScreen**

### **Design:**
```
┌──────────────────────────────┐
│                              │
│     [Avatar con pulse]       │
│                              │
│     Marco_Gaming             │
│                              │
│  Chiamata in corso...        │
│  In attesa di risposta       │
│                              │
│   [🎥 icona animata]         │
│                              │
│     [  ❌ Annulla  ]         │
│                              │
│  Premi Esc per annullare     │
│                              │
└──────────────────────────────┘
```

### **Caratteristiche:**
- ✅ Avatar con doppia animazione (ping + pulse)
- ✅ Puntini animati "Chiamata in corso..."
- ✅ Icona videochiamata con pulse
- ✅ Bottone annulla grande e visibile
- ✅ Hint tastiera (Esc)
- ✅ Gradienti moderni
- ✅ NO camera attiva
- ✅ NO consumo risorse

---

## 📝 **FILE MODIFICATI**

### **1. `src/components/call/CallingScreen.tsx`** (NUOVO)
```typescript
interface CallingScreenProps {
  targetUsername: string;
  targetAvatar?: string;
  onCancel: () => void;
}

export function CallingScreen({ targetUsername, targetAvatar, onCancel }: CallingScreenProps)
```

**Caratteristiche:**
- Animazione puntini "Chiamata in corso..."
- Avatar con double-pulse animation
- Bottone annulla con hover effects
- Keyboard shortcut (Esc)
- NO webcam access
- NO MediaStream

### **2. `src/components/dashboard/Dashboard.tsx`**

**Modifiche:**
```typescript
// Prima:
const [isPreparing, setIsPreparing] = useState(false);

// Dopo:
const [isCalling, setIsCalling] = useState(false); // Stato "attesa risposta"
```

**Nuovo flusso handleCall:**
```typescript
const handleCall = (contactId: string) => {
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) return;

  setTargetContact(contact);
  setIsCalling(true); // ← Mostra CallingScreen
  startCall(contact, 'video'); // ← Invia segnale (NO stream)
};
```

**Nuovo handler annulla:**
```typescript
const handleCancelCall = () => {
  setIsCalling(false);
  setTargetContact(null);
  endCall();
};
```

**Nuovi useEffect:**
```typescript
// Chiamata accettata in arrivo
useEffect(() => {
  if (isInCall && !isCalling && incomingCallData) {
    setTargetContact(incomingCallData.from);
  }
}, [isInCall, isCalling, incomingCallData]);

// Mia chiamata accettata
useEffect(() => {
  if (isInCall && isCalling) {
    setIsCalling(false); // Esci da CallingScreen → Entra in VideoCall
  }
}, [isInCall, isCalling]);
```

**Nuovo rendering:**
```typescript
// Schermata "Chiamata in corso..."
if (isCalling && targetContact) {
  return <CallingScreen ... />;
}

// Chiamata ACCETTATA
if (isInCall && targetContact && user) {
  return <VideoCall ... />;
}
```

### **3. `src/components/call/VideoCall.tsx`** (NESSUNA MODIFICA)
- Stream parte solo quando componente si monta
- Componente si monta SOLO quando `isInCall === true`
- `isInCall` diventa `true` SOLO quando qualcuno accetta
- ✅ Tutto funziona automaticamente!

---

## 🧪 **COME TESTARE**

### **Test 1: Chiamata Uscente con Accettazione**
```bash
Finestra 1 (User1):
1. npm run tauri dev
2. Login come "User1"
3. Click su "Marco_Gaming"
4. ✅ Dovresti vedere CallingScreen
5. ✅ Avatar Marco con animazione
6. ✅ "Chiamata in corso..."
7. ✅ NO luce verde webcam
8. ✅ Camera SPENTA

Finestra 2 (Marco_Gaming):
9. npm run tauri dev (seconda istanza)
10. Login come "Marco_Gaming"
11. ✅ Vedi IncomingCallModal
12. ✅ Avatar User1
13. ✅ Bottoni [Accetta] [Rifiuta]
14. Click [Accetta]

Entrambe finestre:
15. ✅ CallingScreen sparisce (Finestra 1)
16. ✅ IncomingCallModal sparisce (Finestra 2)
17. ✅ VideoCall appare per entrambi
18. ✅ ORA webcam si accende
19. ✅ Video di entrambi visibile
```

### **Test 2: Chiamata Uscente con Rifiuto**
```bash
1. User1 chiama Marco
2. ✅ User1 vede CallingScreen (NO webcam)
3. ✅ Marco vede IncomingCallModal
4. Marco click [Rifiuta]
5. ✅ User1 torna a Dashboard
6. ✅ Marco torna a Dashboard
7. ✅ Nessuna webcam attiva
```

### **Test 3: Chiamata Uscente con Timeout**
```bash
1. User1 chiama Marco
2. ✅ User1 vede CallingScreen
3. Marco NON risponde (non fa niente)
4. Attendi 60 secondi
5. ✅ User1 vede "non risponde"
6. ✅ Dopo 5s torna a Dashboard
7. ✅ Webcam mai attivata
```

### **Test 4: Annulla Durante Attesa**
```bash
1. User1 chiama Marco
2. ✅ User1 vede CallingScreen
3. User1 click [Annulla] (o Esc)
4. ✅ Torna a Dashboard immediatamente
5. ✅ Marco vede "Chiamata persa" (o IncomingCallModal sparisce)
6. ✅ Nessuna webcam attiva
```

### **Test 5: Chiamata Entrante con Accettazione**
```bash
1. Marco chiama User1
2. ✅ Marco vede CallingScreen (NO webcam)
3. ✅ User1 vede IncomingCallModal
4. User1 click [Accetta]
5. ✅ Entrambi entrano in VideoCall
6. ✅ ORA webcam si accende
7. ✅ Chiamata attiva
```

---

## 🎯 **STATI COMPONENTI**

### **Dashboard:**
```typescript
isCalling = false, isInCall = false → Dashboard normale
isCalling = true,  isInCall = false → CallingScreen (attesa)
isCalling = false, isInCall = true  → VideoCall (attivo)
isCalling = true,  isInCall = true  → VideoCall (transizione)
```

### **CallingScreen:**
```typescript
Visibile quando: isCalling === true && targetContact !== null
Camera: ❌ SPENTA
Stream: ❌ NON AVVIATO
Durata: Fino a accettazione/rifiuto/timeout
```

### **VideoCall:**
```typescript
Visibile quando: isInCall === true && targetContact !== null
Camera: ✅ ACCESA
Stream: ✅ ATTIVO
Durata: Fino a fine chiamata
```

---

## 📊 **VANTAGGI**

### **UX:**
- ✅ Feedback chiaro ("Chiamata in corso...")
- ✅ Utente sa che sta aspettando risposta
- ✅ Può annullare durante attesa
- ✅ Non vede sé stesso finché l'altro non accetta

### **Performance:**
- ✅ Camera si accende SOLO quando necessario
- ✅ NO spreco batteria durante attesa
- ✅ NO consumo banda durante attesa
- ✅ MediaStream creato solo quando utile

### **Privacy:**
- ✅ Camera SPENTA durante attesa
- ✅ Indicatore sistema (luce verde) SPENTO
- ✅ Nessun frame video durante attesa

---

## 🔮 **PROSSIMI STEP**

- [ ] Aggiungere suono "squillo" anche per chi chiama
- [ ] Mostrare "Sta rispondendo..." quando accetta
- [ ] Aggiungere lista "Chiamate perse"
- [ ] Notifiche desktop per chiamate in arrivo
- [ ] Multi-party call (più di 2 persone)

---

**Implementato il:** 30 ottobre 2025
**Versione:** GameCall v0.3.0
**Status:** ✅ Pronto per test
**Flusso:** ✅ CORRETTO come WhatsApp/Discord
