package uz.zumo.marketplace;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Launch")
public class LaunchPlugin extends Plugin {
    static boolean restored = false;

    @PluginMethod
    public void wasRestored(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("restored", restored);
        call.resolve(ret);
    }
}
