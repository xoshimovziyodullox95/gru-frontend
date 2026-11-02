// Foydalanish shartlari va Maxfiylik siyosati (uz / ru / en).
// Kompaniya rekvizitlari bitta joyda — yuridik shaxs ochilgach shu yerda yangilang.
export const LEGAL_INFO = {
  company: 'ZUMO',
  email: 'support@gru.uz',
  updated: '2026-11-02',
};

const { company, email } = LEGAL_INFO;

export const LEGAL = {
  terms: {
    uz: {
      title: 'Foydalanish shartlari',
      sections: [
        ['1. Umumiy qoidalar', [
          `Ushbu shartlar ${company} ilovasi va sayti (keyingi o‘rinlarda — “Platforma”) dan foydalanish tartibini belgilaydi. Ro‘yxatdan o‘tish yoki Platformadan foydalanish orqali siz ushbu shartlarga rozilik bildirasiz.`,
          'Platforma tovar, xizmat va joy e’lonlarini joylash, usta chaqirish hamda foydalanuvchilar o‘rtasida muloqot qilish uchun mo‘ljallangan.',
        ]],
        ['2. Akkaunt', [
          'Ro‘yxatdan o‘tishda to‘g‘ri ma’lumot kiritishingiz kerak. Akkauntingiz xavfsizligi (parol, kirish kodi) uchun o‘zingiz javobgarsiz.',
          'Platformadan 16 yoshdan kichik shaxslar foydalanmasligi kerak.',
        ]],
        ['3. E’lonlar qoidalari', [
          'E’londagi ma’lumot (nom, narx, rasm, holat) haqqoniy bo‘lishi kerak. Boshqalarning rasmi yoki matnidan ruxsatsiz foydalanmang.',
          'Taqiqlanadi: qonun bilan taqiqlangan tovar va xizmatlar, qurol, giyohvand moddalar, soxta yoki o‘g‘irlangan buyumlar, kattalar uchun kontent, firibgarlik, spam va boshqa shaxslarning shaxsiy ma’lumotlari.',
          'Qoidalarga zid e’lonlar ogohlantirishsiz o‘chirilishi, akkaunt esa bloklanishi mumkin.',
        ]],
        ['4. Ustalar, sotuvchilar va xaridorlar', [
          `${company} — e’lon joylashtiruvchilar va mijozlarni bog‘lovchi vositachi platforma. Bitim, narx, to‘lov, yetkazib berish va ish sifati to‘g‘risida tomonlar o‘zaro kelishadi.`,
          `${company} tomonlar o‘rtasidagi kelishuvning bajarilishini, tovar yoki xizmat sifatini kafolatlamaydi, ammo shikoyatlarni ko‘rib chiqadi va qoidabuzarlarni bloklaydi.`,
        ]],
        ['5. Sharhlar va xabarlar', [
          'Baho va sharhlar haqiqiy tajribaga asoslangan bo‘lishi kerak. Haqorat, tahdid va aldovchi xabarlar taqiqlanadi.',
        ]],
        ['6. Pullik xizmatlar', [
          'Premium va reklama xizmatlarining narxi va muddati xarid oldidan ko‘rsatiladi. To‘lov qaytarilishi amaldagi qonunchilik va xizmat shartlariga muvofiq amalga oshiriladi.',
        ]],
        ['7. Javobgarlikni cheklash', [
          `Platforma “boricha” taqdim etiladi. ${company} foydalanuvchilar joylagan kontent va ular o‘rtasidagi bitimlardan kelib chiqqan zarar uchun qonunda belgilangan doirada javobgar emas.`,
        ]],
        ['8. Shartlarning o‘zgarishi', [
          'Shartlar yangilanishi mumkin. Muhim o‘zgarishlar haqida ilovada xabar beramiz. O‘zgarishdan keyin foydalanishni davom ettirish yangi shartlarga rozilikni bildiradi.',
        ]],
        ['9. Qo‘llaniladigan qonun va aloqa', [
          `Ushbu shartlar O‘zbekiston Respublikasi qonunchiligiga muvofiq tartibga solinadi. Savollar uchun: ${email}`,
        ]],
      ],
    },
    ru: {
      title: 'Условия использования',
      sections: [
        ['1. Общие положения', [
          `Настоящие условия определяют порядок использования приложения и сайта ${company} (далее — «Платформа»). Регистрируясь или пользуясь Платформой, вы соглашаетесь с этими условиями.`,
          'Платформа предназначена для размещения объявлений о товарах, услугах и помещениях, вызова мастеров и общения между пользователями.',
        ]],
        ['2. Аккаунт', [
          'При регистрации указывайте достоверные данные. Вы отвечаете за безопасность своего аккаунта (пароль, код входа).',
          'Платформой не должны пользоваться лица младше 16 лет.',
        ]],
        ['3. Правила объявлений', [
          'Информация в объявлении (название, цена, фото, состояние) должна быть достоверной. Не используйте чужие фото и тексты без разрешения.',
          'Запрещены: запрещённые законом товары и услуги, оружие, наркотики, поддельные или краденые вещи, контент для взрослых, мошенничество, спам и персональные данные других лиц.',
          'Объявления, нарушающие правила, могут быть удалены без предупреждения, а аккаунт — заблокирован.',
        ]],
        ['4. Мастера, продавцы и покупатели', [
          `${company} — платформа-посредник, соединяющая авторов объявлений и клиентов. Сделку, цену, оплату, доставку и качество работы стороны согласуют между собой.`,
          `${company} не гарантирует исполнение договорённостей и качество товаров или услуг, но рассматривает жалобы и блокирует нарушителей.`,
        ]],
        ['5. Отзывы и сообщения', [
          'Оценки и отзывы должны основываться на реальном опыте. Оскорбления, угрозы и вводящие в заблуждение сообщения запрещены.',
        ]],
        ['6. Платные услуги', [
          'Стоимость и срок Premium и рекламных услуг указываются до покупки. Возврат средств осуществляется в соответствии с законодательством и условиями услуги.',
        ]],
        ['7. Ограничение ответственности', [
          `Платформа предоставляется «как есть». ${company} в пределах, установленных законом, не несёт ответственности за контент пользователей и ущерб от сделок между ними.`,
        ]],
        ['8. Изменение условий', [
          'Условия могут обновляться. О существенных изменениях мы сообщим в приложении. Продолжая пользоваться Платформой, вы принимаете новые условия.',
        ]],
        ['9. Применимое право и контакты', [
          `Условия регулируются законодательством Республики Узбекистан. Вопросы: ${email}`,
        ]],
      ],
    },
    en: {
      title: 'Terms of Use',
      sections: [
        ['1. General', [
          `These terms govern the use of the ${company} app and website (the “Platform”). By registering or using the Platform you agree to these terms.`,
          'The Platform lets users post listings for products, services and places, hire service providers and communicate with each other.',
        ]],
        ['2. Account', [
          'Provide accurate information when registering. You are responsible for keeping your account (password, login code) secure.',
          'The Platform must not be used by anyone under 16.',
        ]],
        ['3. Listing rules', [
          'Listing information (title, price, photos, condition) must be truthful. Do not use other people’s photos or text without permission.',
          'Prohibited: goods and services banned by law, weapons, drugs, counterfeit or stolen items, adult content, fraud, spam and other people’s personal data.',
          'Listings that break the rules may be removed without notice and the account may be blocked.',
        ]],
        ['4. Providers, sellers and buyers', [
          `${company} is an intermediary platform connecting advertisers and customers. Deal terms, price, payment, delivery and work quality are agreed between the parties.`,
          `${company} does not guarantee performance of agreements or the quality of goods or services, but reviews complaints and blocks violators.`,
        ]],
        ['5. Reviews and messages', [
          'Ratings and reviews must reflect real experience. Insults, threats and misleading messages are prohibited.',
        ]],
        ['6. Paid services', [
          'Prices and durations of Premium and advertising services are shown before purchase. Refunds follow applicable law and the service terms.',
        ]],
        ['7. Limitation of liability', [
          `The Platform is provided “as is”. To the extent permitted by law, ${company} is not liable for user content or damages arising from transactions between users.`,
        ]],
        ['8. Changes', [
          'These terms may be updated. We will notify you in the app about material changes. Continuing to use the Platform means you accept the updated terms.',
        ]],
        ['9. Governing law and contact', [
          `These terms are governed by the laws of the Republic of Uzbekistan. Questions: ${email}`,
        ]],
      ],
    },
  },

  privacy: {
    uz: {
      title: 'Maxfiylik siyosati',
      sections: [
        ['1. Qanday ma’lumot yig‘amiz', [
          'Akkaunt: ism, email yoki telefon raqami, profil rasmi.',
          'Siz joylagan kontent: e’lonlar, rasm va videolar, izohlar, baholar, chat xabarlari, xizmat so‘rovlari.',
          'Joylashuv: faqat siz ruxsat berganingizda — yaqin atrofdagi e’lon va ustalarni ko‘rsatish hamda usta chaqirishda manzil uchun.',
          'Qurilma: bildirishnoma yuborish uchun push-token, ilova versiyasi va xatoliklar haqidagi texnik ma’lumot.',
        ]],
        ['2. Nima uchun foydalanamiz', [
          'Platformani ishlatish: e’lonlarni ko‘rsatish, buyurtma va xabarlarni yetkazish, bildirishnoma yuborish.',
          'Xavfsizlik: firibgarlik va qoidabuzarliklarning oldini olish.',
          'Yaxshilash: ilovani tezroq va qulayroq qilish. Ma’lumotlaringizni sotmaymiz.',
        ]],
        ['3. Kim ko‘radi', [
          'Boshqa foydalanuvchilar — siz joylagan e’lon, profil nomi va rasmi, sharhlar. Telefon raqamingiz faqat siz ko‘rsatgan joyda yoki buyurtma qabul qilinganda ko‘rinadi.',
          'Xizmat ko‘rsatuvchi hamkorlar (faqat Platforma ishlashi uchun): Supabase (kirish), MongoDB Atlas (ma’lumotlar bazasi), Render (server), Google Firebase (bildirishnomalar), Cloudflare (rasm va videolar), Groq (AI yordamchiga yozilgan matnga javob).',
          'Davlat organlari — faqat qonunda belgilangan hollarda.',
        ]],
        ['4. Saqlash va o‘chirish', [
          'Ma’lumotlar akkauntingiz faol bo‘lgan davrda saqlanadi. Akkauntni istalgan vaqtda o‘chirishingiz mumkin: Sozlamalar → “Akkauntni o‘chirish”. O‘chirilgach, shaxsiy ma’lumotlaringiz va e’lonlaringiz o‘chiriladi (qonun talab qilgan yozuvlardan tashqari).',
        ]],
        ['5. Huquqlaringiz', [
          'Ma’lumotlaringizni ko‘rish, tuzatish, o‘chirish va bildirishnomalarni o‘chirib qo‘yish huquqiga egasiz (Sozlamalar → Bildirishnomalar). Joylashuv va kamera ruxsatini telefon sozlamalaridan istalgan vaqtda bekor qilishingiz mumkin.',
        ]],
        ['6. Xavfsizlik', [
          'Ma’lumotlar shifrlangan ulanish (HTTPS) orqali uzatiladi, parollar ochiq holda saqlanmaydi.',
        ]],
        ['7. Bolalar', [
          'Platforma 16 yoshdan kichiklar uchun mo‘ljallanmagan va biz ularning ma’lumotlarini ataylab yig‘maymiz.',
        ]],
        ['8. O‘zgarishlar va aloqa', [
          `Siyosat yangilanishi mumkin; muhim o‘zgarishlar haqida ilovada xabar beramiz. Savollar va so‘rovlar uchun: ${email}`,
        ]],
      ],
    },
    ru: {
      title: 'Политика конфиденциальности',
      sections: [
        ['1. Какие данные мы собираем', [
          'Аккаунт: имя, email или номер телефона, фото профиля.',
          'Ваш контент: объявления, фото и видео, комментарии, оценки, сообщения в чате, заявки на услуги.',
          'Местоположение: только с вашего разрешения — чтобы показывать объявления и мастеров рядом и для адреса при вызове мастера.',
          'Устройство: push-токен для уведомлений, версия приложения и технические данные об ошибках.',
        ]],
        ['2. Зачем мы их используем', [
          'Работа Платформы: показ объявлений, доставка заказов и сообщений, отправка уведомлений.',
          'Безопасность: предотвращение мошенничества и нарушений.',
          'Улучшение: чтобы приложение было быстрее и удобнее. Мы не продаём ваши данные.',
        ]],
        ['3. Кто их видит', [
          'Другие пользователи — ваши объявления, имя и фото профиля, отзывы. Номер телефона виден только там, где вы его указали, или после принятия заказа.',
          'Сервисы-партнёры (только для работы Платформы): Supabase (вход), MongoDB Atlas (база данных), Render (сервер), Google Firebase (уведомления), Cloudflare (фото и видео), Groq (ответы AI-помощника на ваш текст).',
          'Государственные органы — только в случаях, предусмотренных законом.',
        ]],
        ['4. Хранение и удаление', [
          'Данные хранятся, пока ваш аккаунт активен. Удалить аккаунт можно в любой момент: Настройки → «Удалить аккаунт». После удаления ваши персональные данные и объявления удаляются (кроме записей, хранение которых требует закон).',
        ]],
        ['5. Ваши права', [
          'Вы можете просматривать, исправлять и удалять свои данные, а также отключать уведомления (Настройки → Уведомления). Доступ к местоположению и камере можно отозвать в настройках телефона.',
        ]],
        ['6. Безопасность', [
          'Данные передаются по защищённому соединению (HTTPS), пароли не хранятся в открытом виде.',
        ]],
        ['7. Дети', [
          'Платформа не предназначена для лиц младше 16 лет, и мы намеренно не собираем их данные.',
        ]],
        ['8. Изменения и контакты', [
          `Политика может обновляться; о существенных изменениях сообщим в приложении. Вопросы и запросы: ${email}`,
        ]],
      ],
    },
    en: {
      title: 'Privacy Policy',
      sections: [
        ['1. Data we collect', [
          'Account: name, email or phone number, profile photo.',
          'Your content: listings, photos and videos, comments, ratings, chat messages, service requests.',
          'Location: only with your permission — to show nearby listings and providers and as the address when you hire a provider.',
          'Device: push token for notifications, app version and technical error data.',
        ]],
        ['2. How we use it', [
          'To run the Platform: show listings, deliver orders and messages, send notifications.',
          'Safety: preventing fraud and rule violations.',
          'Improvement: making the app faster and easier to use. We do not sell your data.',
        ]],
        ['3. Who can see it', [
          'Other users — your listings, profile name and photo, reviews. Your phone number is shown only where you add it or after an order is accepted.',
          'Service providers (only to operate the Platform): Supabase (sign-in), MongoDB Atlas (database), Render (server), Google Firebase (notifications), Cloudflare (photos and videos), Groq (AI assistant replies to the text you send).',
          'Authorities — only where required by law.',
        ]],
        ['4. Retention and deletion', [
          'Data is kept while your account is active. You can delete your account at any time: Settings → “Delete account”. After deletion your personal data and listings are removed (except records the law requires us to keep).',
        ]],
        ['5. Your rights', [
          'You can view, correct and delete your data and turn off notifications (Settings → Notifications). Location and camera access can be revoked in your phone settings at any time.',
        ]],
        ['6. Security', [
          'Data is transmitted over an encrypted connection (HTTPS); passwords are never stored in plain text.',
        ]],
        ['7. Children', [
          'The Platform is not intended for children under 16 and we do not knowingly collect their data.',
        ]],
        ['8. Changes and contact', [
          `This policy may be updated; we will notify you in the app about material changes. Questions and requests: ${email}`,
        ]],
      ],
    },
  },
};
