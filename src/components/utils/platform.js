import { Capacitor } from '@capacitor/core';

// iPhone ilovasi: Apple raqamli xizmatni (Premium) faqat o'z to'lovi orqali sotishga ruxsat beradi,
// shuning uchun Uzum orqali sotib olish tugmalari bu yerda ko'rsatilmaydi.
export const IS_IOS_APP = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
