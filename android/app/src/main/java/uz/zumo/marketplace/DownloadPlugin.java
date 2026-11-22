package uz.zumo.marketplace;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Chatdagi rasm/videoni telefonga saqlash (Telegram kabi).
 * Android DownloadManager faylni Pictures/ZUMO yoki Movies/ZUMO ga yuklaydi,
 * bildirishnomada jarayon ko'rinadi va fayl galereyada paydo bo'ladi.
 * Android 10+ da ruxsat kerak emas.
 */
@CapacitorPlugin(name = "Download")
public class DownloadPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName", "zumo_" + System.currentTimeMillis());
        String mimeType = call.getString("mimeType");

        if (url == null || !(url.startsWith("http://") || url.startsWith("https://"))) {
            call.reject("Noto'g'ri manzil");
            return;
        }

        // Fayl nomida papka ajratgichlari bo'lmasin
        String safeName = fileName.replaceAll("[\\\\/:*?\"<>|]", "_");
        boolean isVideo = mimeType != null && mimeType.startsWith("video");
        String dir = isVideo ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES;

        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle(safeName);
            request.setDescription("ZUMO");
            if (mimeType != null) request.setMimeType(mimeType);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(dir, "ZUMO/" + safeName);

            DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            long id = manager.enqueue(request);

            JSObject ret = new JSObject();
            ret.put("id", id);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Yuklab bo'lmadi: " + e.getMessage());
        }
    }
}
