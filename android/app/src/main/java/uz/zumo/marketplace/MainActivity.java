package uz.zumo.marketplace;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Android ilovani fonda o'zi yopgan bo'lsa savedInstanceState bor —
        // web tomon oxirgi sahifani tiklaydi. Qatordan o'chirilsa — noldan boshlanadi.
        LaunchPlugin.restored = savedInstanceState != null;
        registerPlugin(LaunchPlugin.class);
        super.onCreate(savedInstanceState);
        OrderAlertChannel.ensure(this);
    }
}
