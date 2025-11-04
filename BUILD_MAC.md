# Istruzioni per Build firmata su macOS

## Prerequisiti
- Account Apple Developer attivo
- Certificato "Developer ID Application" installato su Mac

## Passo 1: Verifica il certificato

Sul Mac, esegui:
```bash
security find-identity -v -p codesigning
```

Dovresti vedere una riga tipo:
```
1) ABC123DEF456... "Developer ID Application: Il Tuo Nome (TEAM_ID)"
```

## Passo 2: Configura la firma

Apri `src-tauri/tauri.conf.json` e modifica la sezione `macOS`:

```json
"macOS": {
  "signingIdentity": "Developer ID Application: Il Tuo Nome (TEAM_ID)",
  "entitlements": null,
  "minimumSystemVersion": "10.13"
}
```

**IMPORTANTE**: Sostituisci `"Developer ID Application: Il Tuo Nome (TEAM_ID)"` con l'identità esatta trovata al passo 1.

## Passo 3: Build dell'app

```bash
npm run tauri build
```

L'app verrà automaticamente firmata durante la build.

## Passo 4: Verifica la firma

Dopo la build, verifica che sia firmata:
```bash
codesign -dv --verbose=4 src-tauri/target/release/bundle/macos/gamecall.app
```

Dovresti vedere:
```
Authority=Developer ID Application: Il Tuo Nome (TEAM_ID)
```

## Passo 5 (Opzionale): Notarizzazione

Per la massima compatibilità, notarizza l'app con Apple:

```bash
# 1. Crea un file ZIP dell'app
ditto -c -k --keepParent src-tauri/target/release/bundle/macos/gamecall.app gamecall.zip

# 2. Invia per notarizzazione
xcrun notarytool submit gamecall.zip \
  --apple-id "tua@email.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait

# 3. Dopo l'approvazione, staple il ticket
xcrun stapler staple src-tauri/target/release/bundle/macos/gamecall.app

# 4. Crea il DMG finale
npm run tauri build
```

### Come ottenere app-specific password:
1. Vai su https://appleid.apple.com
2. Sezione "Sicurezza"
3. "Password specifiche per le app"
4. Genera una nuova password

## Note

- **signingIdentity**: Usa `null` per firma automatica con qualsiasi certificato disponibile, oppure specifica l'identità esatta
- **Senza notarizzazione**: L'app funzionerà ma macOS mostrerà un avviso al primo avvio
- **Con notarizzazione**: L'app si aprirà senza avvisi, come le app ufficiali

## Troubleshooting

### Errore "no identity found"
- Verifica che il certificato sia installato: `security find-identity -v -p codesigning`
- Scarica il certificato da developer.apple.com se manca

### DMG richiede ancora xattr -cr
- La firma non è stata applicata correttamente
- Verifica con `codesign -dv` che l'app sia firmata
- Considera la notarizzazione per evitare completamente il problema
