package com.skylite.app;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
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

    private void handleWidgetIntent() {
        Intent intent = getIntent();
        if (intent != null && intent.hasExtra("route")) {
            String route = intent.getStringExtra("route");
            if (route != null && !route.isEmpty()) {
                String js = "window.location.hash = '" + route + "';";
                getBridge().evalOnLoadUrl(js);
            }
        }
    }
}
