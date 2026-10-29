# ZUMO mobil ilovasi

Frontend shu loyiha ichida Expo va React Native’ga ko‘chirilmoqda. Android/iOS uchun native komponentlar ishlatiladi; `react-native-web` orqali brauzer ko‘rinishi ham saqlanadi. Backend `../midnight-premium-backend` ichidagi mavjud Express API bo‘lib qoladi.

## Ishga tushirish

1. Frontend papkasida `npm install` bajaring.
2. Backendni alohida terminalda `../midnight-premium-backend` papkasidan ishga tushiring.
3. `npm start` buyrug‘ini bajaring va Expo Go yoki Android emulyator bilan oching.
4. Eski web ilovasini ochish uchun `npm run web` ishlating. React Native ko‘rinishini brauzerda ko‘rish uchun `npm run native:web` buyrug‘idan foydalaning.
5. APK chiqarish uchun Expo hisobiga kirib `npx eas build --profile preview --platform android` bajaring; Play Store AAB uchun `--profile production` ishlating.

`app.config.js` mavjud `.env` faylidagi `VITE_API_URL`, `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` qiymatlarini Expo ilovasiga o‘qiydi. Haqiqiy telefonda kompyuterdagi backend manzilini `.env` ichida `EXPO_PUBLIC_API_URL=http://KOMPYUTER_LAN_IP:5000/api` ko‘rinishida belgilang. Android emulyatorda `localhost` avtomatik `10.0.2.2` ga almashtiriladi.

SMS orqali kirish Supabase Phone provayderi va backend’dagi mavjud telefon-profil bog‘lash oqimidan foydalanadi. SMS provayderi yoqilmagan bo‘lsa, ilova kod yuborish xatosini ko‘rsatadi.

## Migratsiya holati

Native entry `index.js`, Expo Metro sozlamasi `metro.config.js`, native UI va API yordamchilari `src/native/` ichida. Native oqimlarda bosh sahifa va katalog, qidiruv/filters, e’lon tafsiloti, savat/buyurtma, OTP kirish, chat va e’lon kartasi ulashish, ZUMO AI, xizmat topish/so‘rov/taklif, joy/tovar e’lonlari, video, profil/buyurtmalar/bildirishnomalar, bank xizmatlari/arizalari, admin statistikasi va biznes paneli mavjud. Biznes panelida tovar, ombor, qoldiq, naqd savdo, xarajat, ta’minotchi va xaridni omborga qabul qilish oqimlari backend API’lariga ulangan. Biznes omborlari uchun yetishmagan backend endpointlari ham qo‘shildi.

Bu migratsiya native ilovaning asosiy foydalanuvchi oqimlarini qamrab oladi, ammo web’dagi barcha eski ekranlar, rollar va kengaytirilgan moliya/amaliyot vositalari native’da birma-bir tenglashtirilmagan. Backend hozir Web Push bilan ishlaydi; Android/iOS push uchun Expo Notifications paketi, EAS loyiha IDsi va Android FCM/iOS APNs credentials kerak. Ish muhiti internetga chiqmagani sabab native push SDK o‘rnatilmadi. Eski JSX/CSS shu frontend ichida saqlanadi. `npm run build` web ilovasini, `npm run build:native:web` React Native web eksportini yig‘adi. Android bundle local eksport bilan tekshirilgan, lekin Expo hisobi/credentials orqali APK yoki AAB hali chiqarilmagan.
