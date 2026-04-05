package com.skylite.app;

import android.content.Intent;
import android.os.Bundle;
import org.json.JSONObject;
import java.util.Collections;
import java.util.Set;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;

public class MainActivity extends BridgeActivity {
    private static final Set<String> ALLOWED_WIDGET_ROUTES =
            Collections.singleton("/mealPlanner");

    private String pendingRoute;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleWidgetIntent();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetIntent();
    }

    @Override
    public void onStart() {
        super.onStart();
        if (pendingRoute != null) {
            Bridge bridge = getBridge();
            if (bridge != null) {
                String js = "window.location.hash = " + JSONObject.quote(pendingRoute) + ";";
                bridge.evalOnLoadUrl(js);
            }
            pendingRoute = null;
        }
    }

    private void handleWidgetIntent() {
        Intent intent = getIntent();
        if (intent != null && intent.hasExtra("route")) {
            String route = intent.getStringExtra("route");
            if (route != null && !route.isEmpty()) {
                if (!ALLOWED_WIDGET_ROUTES.contains(route)) {
                    return;
                }
                Bridge bridge = getBridge();
                if (bridge != null) {
                    String js = "window.location.hash = " + JSONObject.quote(route) + ";";
                    bridge.evalOnLoadUrl(js);
                } else {
                    pendingRoute = route;
                }
                intent.removeExtra("route");
            }
        }
    }
}
