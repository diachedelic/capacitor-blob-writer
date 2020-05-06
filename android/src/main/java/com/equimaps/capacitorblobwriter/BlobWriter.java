package com.equimaps.capacitorblobwriter;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.File;
import java.io.IOException;
import java.util.Random;

@NativePlugin()
public class BlobWriter extends Plugin {
    private BlobWriterServer server = null;

    @Override
    public void load() {
        super.load();

        // listen on an open port
        int retriesLeft = 5;
        File tmpDir = this.getContext().getCacheDir();

        while (this.server == null && retriesLeft > 0) {
            int port = getRandomPrivatePort();
            BlobWriterServer server = new BlobWriterServer(port, getLogTag(), tmpDir);

            try {
                server.start();
                Log.d(getLogTag(), "Listening at http://localhost:" + port);
                this.server = server;
            } catch (IOException ex) {
                Log.e(getLogTag(), "Failed to start server on port " + port, ex);
            }

            retriesLeft--;
        }
    }

    private int getRandomPrivatePort() {
        Random random = new Random();

        // choose private ports only
        int startPort = 49151;
        int endPort = 65536;

        return startPort + random.nextInt(endPort - startPort);
    }

    @PluginMethod()
    public void getConfig(PluginCall call) {
        if (this.server != null) {
            JSObject ret = new JSObject();
            ret.put("baseUrl", "http://localhost:" + this.server.getListeningPort());
            call.success(ret);
        } else {
            call.error("Server not running", "SERVER_DOWN", null);
        }
    }
}
