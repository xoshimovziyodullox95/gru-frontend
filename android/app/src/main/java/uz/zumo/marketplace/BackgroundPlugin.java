package uz.zumo.marketplace;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Xiaomi/Oppo/Vivo/Huawei ilovani qatordan surib yopganda push'larni ham to'xtatadi.
 * Usta va sotuvchi buyurtmani boy bermasligi uchun kerakli sozlama sahifalarini ochadi.
 */
@CapacitorPlugin(name = "Background")
public class BackgroundPlugin extends Plugin {
    // Ishlab chiqaruvchilarning "avtozapusk" oynalari (birinchi ochilgani ishlatiladi)
    private static final String[][] AUTOSTART = {
        { "com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity" },
        { "com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity" },
        { "com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity" },
        { "com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity" },
        { "com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity" },
        { "com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity" },
        { "com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity" },
        { "com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity" },
    };

    @PluginMethod
    public void status(PluginCall call) {
        Context context = getContext();
        boolean unrestricted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = context.getSystemService(PowerManager.class);
            unrestricted = pm != null && pm.isIgnoringBatteryOptimizations(context.getPackageName());
        }
        JSObject ret = new JSObject();
        ret.put("batteryUnrestricted", unrestricted);
        ret.put("manufacturer", Build.MANUFACTURER == null ? "" : Build.MANUFACTURER.toLowerCase());
        call.resolve(ret);
    }

    @PluginMethod
    public void openAutostart(PluginCall call) {
        for (String[] target : AUTOSTART) {
            try {
                Intent intent = new Intent().setComponent(new ComponentName(target[0], target[1]));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("opened", true);
                call.resolve(ret);
                return;
            } catch (Exception ignored) {
                // Bu telefonda yo'q — keyingisini sinaymiz
            }
        }
        openAppDetails(call);
    }

    // Ilova sahifasi: "Batareya → Cheklovsiz" shu yerda (Samsung va boshqalar)
    @PluginMethod
    public void openAppDetails(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Sozlamalar ochilmadi", e);
        }
    }
}
