package uz.zumo.marketplace;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

/**
 * Chat xabarlari: jarangdor qo'ng'iroqcha ovozi (res/raw/zumo_message) va qisqa tebranish.
 * Ovoz o'zgarsa ID yangilanadi (backend ham shu ID'ga yuboradi).
 */
final class MessageChannel {
    static final String ID = "zumo_message_v1";
    private static final long[] VIBRATION = { 0, 90, 70, 90 };

    private MessageChannel() {}

    static void ensure(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(ID) != null) return;

        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.zumo_message);
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        NotificationChannel channel = new NotificationChannel(ID, "Chat xabarlari", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Sotuvchi, xaridor va ustalardan kelgan xabarlar");
        channel.setSound(sound, attributes);
        channel.enableVibration(true);
        channel.setVibrationPattern(VIBRATION);
        manager.createNotificationChannel(channel);
    }
}
