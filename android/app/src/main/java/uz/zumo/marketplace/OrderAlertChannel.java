package uz.zumo.marketplace;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

/**
 * Ustaga yangi buyurtma kanali: o'z ovozi (res/raw/zumo_order) va ovoz ritmiga mos tebranish.
 * Android kanal ovozi/tebranishini yaratilgandan keyin o'zgartirishga ruxsat bermaydi —
 * shuning uchun ovoz yoki ritm o'zgarsa ID yangilanadi (backend ham shu ID'ga yuboradi).
 */
final class OrderAlertChannel {
    static final String ID = "zumo_order_alert_v1";
    // Eskirgan kanallar — foydalanuvchi sozlamalarida takrorlanib turmasin
    private static final String[] OLD_IDS = { "zumo_orders" };

    // "ding-ding-ding" (har biri ~0.47 s), pauza, yana ikki marta — ovoz bilan bir xil ritm
    private static final long[] VIBRATION = { 0, 180, 290, 180, 290, 180, 740, 180, 290, 180, 290, 180 };

    private OrderAlertChannel() {}

    static void ensure(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        for (String old : OLD_IDS) manager.deleteNotificationChannel(old);
        if (manager.getNotificationChannel(ID) != null) return;

        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.zumo_order);
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();

        NotificationChannel channel = new NotificationChannel(ID, "Yangi buyurtmalar", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Ustaga kelgan yangi buyurtmalar — baland ovoz va tebranish bilan");
        channel.setSound(sound, attributes);
        channel.enableVibration(true);
        channel.setVibrationPattern(VIBRATION);
        channel.enableLights(true);
        channel.setLightColor(0xFF00CFFF);
        channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }
}
