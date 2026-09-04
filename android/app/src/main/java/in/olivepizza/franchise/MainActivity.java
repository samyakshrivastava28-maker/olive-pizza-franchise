package in.olivepizza.franchise;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

/**
 * Olive Pizza Franchise — Main Activity
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "OliveFranchiseMainActivity";

    public static final String CHANNEL_ORDER_STATUS = "olive_order_status";
    public static final String CHANNEL_SYSTEM       = "olive_system";
    public static final String CHANNEL_MARKETING    = "olive_marketing";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        createNotificationChannels();
        super.onCreate(savedInstanceState);
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        createChannel(nm, CHANNEL_ORDER_STATUS, "Olive Order Status", NotificationManager.IMPORTANCE_HIGH);
        createChannel(nm, CHANNEL_SYSTEM, "Olive System Alerts", NotificationManager.IMPORTANCE_HIGH);
        createChannel(nm, CHANNEL_MARKETING, "Olive Franchise Updates", NotificationManager.IMPORTANCE_DEFAULT);

        Log.i(TAG, "Franchise notification channels initialized successfully.");
    }

    private void createChannel(NotificationManager nm, String id, String name, int importance) {
        if (nm.getNotificationChannel(id) != null) return;

        NotificationChannel channel = new NotificationChannel(id, name, importance);
        channel.enableVibration(true);
        channel.setShowBadge(true);

        Uri soundUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION);
        AudioAttributes attrs = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();
        channel.setSound(soundUri, attrs);

        nm.createNotificationChannel(channel);
    }
}

