package com.equimaps.capacitorblobwriter;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.IOException;

@NativePlugin()
public class BlobWriter extends Plugin {
    public BlobWriter() {
        // TODO search for open port, e.g. if two apps using this plugin are both running
        int port = 8080;
        BlobWriterServer server = new BlobWriterServer(port, getLogTag());

        try {
            server.start();
        } catch (IOException ex) {
            Log.e(getLogTag(), "Failed to start server on port " + port, ex);
        }

        Log.d(getLogTag(), "BlobWriter server listening at http://localhost:" + port);
    }

    @PluginMethod()
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.success(ret);
    }
}
