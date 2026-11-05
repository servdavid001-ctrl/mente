# Build del APK (Capacitor)

El APK es un wrapper WebView de Capacitor que carga https://mente-ten-iota.vercel.app.

## Requisitos
- JDK 21
- Android SDK 35 (platform + build-tools)
- Node 22+

## Pasos
```bash
cd mobile
npm install
npx cap add android
[ -f android/local.properties ] || echo "sdk.dir=$ANDROID_HOME" > android/local.properties
cd android && ./gradlew assembleDebug --no-daemon
```
Salida: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

## Publicar
```bash
gh release create apk-<n> app-debug.apk --title "Mente APK <n>" --latest
```

## CI (pendiente de scope)
`docs/ci/android-apk.yml` es el workflow listo. Para activarlo:
1. El token de GitHub necesita scope `workflow`.
2. Copiar el archivo a `.github/workflows/android-apk.yml` y push.

Sin ese scope, el push es rechazado. Mientras tanto, el APK se publica manualmente (release `apk-1`).
