package com.skylite.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;
import org.json.JSONObject;
import java.util.Collections;
import java.util.Set;

import com.getcapacitor.BridgeActivity;

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
            navigateToRoute(pendingRoute);
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
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    navigateToRoute(route);
                } else {
                    pendingRoute = route;
                }
                intent.removeExtra("route");
            }
        }
    }

    private void navigateToRoute(String route) {
        String js = "window.location.hash = " + JSONObject.quote(route) + ";";
        getBridge().getWebView().evaluateJavascript(js, null);
    }
}
