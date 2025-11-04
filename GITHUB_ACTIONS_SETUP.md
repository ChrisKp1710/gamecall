# Configurazione GitHub Actions per Code Signing macOS

## Passo 1: Esporta il certificato dal Mac

Sul tuo Mac, esegui questi comandi:

```bash
# 1. Verifica che il certificato sia installato
security find-identity -v -p codesigning

# Dovresti vedere:
# 3) B53423... "Developer ID Application: Christian Koscielniak Pinto (32252Z5NQN)"
```

```bash
# 2. Esporta il certificato in formato p12
# IMPORTANTE: Ti chiederà una password - ricordala!
security export -t identities -f pkcs12 -o ~/Desktop/developer_id_certificate.p12
```

```bash
# 3. Converti in base64 per GitHub
base64 -i ~/Desktop/developer_id_certificate.p12 | pbcopy
```

Il certificato in base64 è ora nella clipboard. Salvalo in un file di testo temporaneo.

```bash
# 4. Cleanup - elimina il file p12 dal desktop per sicurezza
rm ~/Desktop/developer_id_certificate.p12
```

## Passo 2: Configura GitHub Secrets

Vai su:
```
https://github.com/TUO_USERNAME/gamecall/settings/secrets/actions
```

Clicca su **"New repository secret"** e aggiungi questi secrets:

### Secrets Obbligatori (per la firma):

1. **APPLE_CERTIFICATE**
   - Incolla il base64 del certificato (quello copiato al passo 1.3)

2. **APPLE_CERTIFICATE_PASSWORD**
   - La password che hai usato quando hai esportato il p12

3. **APPLE_SIGNING_IDENTITY**
   - Valore: `Developer ID Application: Christian Koscielniak Pinto (32252Z5NQN)`

4. **APPLE_TEAM_ID**
   - Valore: `32252Z5NQN`

### Secrets Opzionali (per la notarizzazione):

5. **APPLE_ID**
   - La tua email Apple Developer

6. **APPLE_PASSWORD**
   - App-specific password (vedi sotto come ottenerla)

## Come ottenere App-Specific Password (per notarizzazione)

1. Vai su https://appleid.apple.com
2. Accedi con il tuo Apple ID
3. Vai su **"Accesso e sicurezza"** → **"Password specifiche per app"**
4. Clicca **"+"** per creare una nuova password
5. Dai un nome (es. "GitHub Actions")
6. Copia la password generata e usala come `APPLE_PASSWORD`

## Passo 3: Test della configurazione

Dopo aver configurato i secrets:

1. Fai un commit e push al repository
2. Vai su **Actions** nel repository GitHub
3. Verifica che il workflow **"Build Desktop App"** venga eseguito
4. Controlla che il job macOS completi con successo
5. Scarica l'artifact e verifica che il DMG sia firmato

## Verifica locale della firma

Dopo aver scaricato il DMG da GitHub Actions:

```bash
# Verifica la firma dell'app
codesign -dv --verbose=4 gamecall.app

# Dovresti vedere:
# Authority=Developer ID Application: Christian Koscielniak Pinto (32252Z5NQN)
```

## Troubleshooting

### Errore "no identity found"
- Verifica che `APPLE_CERTIFICATE` contenga il base64 completo
- Verifica che `APPLE_CERTIFICATE_PASSWORD` sia corretta

### Errore durante notarizzazione
- Verifica che `APPLE_ID` e `APPLE_PASSWORD` siano corretti
- Verifica che l'app-specific password sia valida
- La notarizzazione può richiedere alcuni minuti

### DMG richiede ancora xattr -cr
- La firma potrebbe non essere stata applicata
- Controlla i log di GitHub Actions per errori
- Verifica che tutti i secrets siano configurati correttamente

## Note sulla sicurezza

- ⚠️ Non committare MAI il certificato .p12 nel repository
- ⚠️ Non condividere i secrets con nessuno
- ⚠️ Revoca e rigenera i certificati se compromessi
- ✅ I secrets di GitHub sono criptati e sicuri
- ✅ Il keychain temporaneo viene eliminato dopo la build
