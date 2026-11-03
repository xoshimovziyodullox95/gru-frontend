package uz.zumo.marketplace;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

/**
 * Usta chaqirish jarayoni: uzunroq va jarangdor qo'ng'iroq ovozi (res/raw/zumo_service) va tebranish.
 * Ovoz o'zgarsa ID yangilanadi (backend ham shu ID'ga yuboradi).
 */
final class ServiceChannel {
    static final String ID = "zumo_service_v1";
    private static final long[] VIBRATION = { 0, 140, 120, 140, 120, 260 };

    private ServiceChannel() {}

    static void ensure(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(ID) != null) return;

        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.zumo_service);
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        NotificationChannel channel = new NotificationChannel(ID, "Usta xizmati", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Taklif, qabul qilindi, yo‘lda, yetib keldi, ish tugadi — usta chaqirish jarayoni");
        channel.setSound(sound, attributes);
        channel.enableVibration(true);
        channel.setVibrationPattern(VIBRATION);
        manager.createNotificationChannel(channel);
    }
}
