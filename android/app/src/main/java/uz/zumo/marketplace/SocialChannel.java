package uz.zumo.marketplace;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

/**
 * Layk, izoh, javob va obuna xabarlari: buyurtma ovozidan ajralib turadigan yengil "ding-dong"
 * (res/raw/zumo_social) va qisqa tebranish. Ovoz o'zgarsa ID yangilanadi (backend ham shu ID'ga yuboradi).
 */
final class SocialChannel {
    static final String ID = "zumo_social_v1";
    private static final long[] VIBRATION = { 0, 60, 90, 60 };

    private SocialChannel() {}

    static void ensure(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(ID) != null) return;

        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.zumo_social);
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        NotificationChannel channel = new NotificationChannel(ID, "Layk, izoh va obunalar", NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription("Kimdir e’loningizni yoqtirsa, izoh yozsa yoki obuna bo‘lsa");
        channel.setSound(sound, attributes);
        channel.enableVibration(true);
        channel.setVibrationPattern(VIBRATION);
        manager.createNotificationChannel(channel);
    }
}
