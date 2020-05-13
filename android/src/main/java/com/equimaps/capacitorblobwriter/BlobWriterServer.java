package com.equimaps.capacitorblobwriter;

import android.os.StrictMode;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.UUID;

import fi.iki.elonen.NanoHTTPD;

public class BlobWriterServer extends NanoHTTPD {
    private String logTag = null;
    private File tmpDir = null;
    private String authToken = UUID.randomUUID().toString();

    public BlobWriterServer(int port, String logTag, File tmpDir) {
        super(port);

        this.tmpDir = tmpDir;
        this.logTag = logTag;
    }

    public String getAuthToken() {
        return authToken;
    }

    public Response newCorsResponse(Response.IStatus status, IHTTPSession session) {
        String origin = session.getHeaders().get("origin");
        Response response = newFixedLengthResponse(status, "text/plain", null, 0);

        // disables Gzip and thereby fixes weird timing-based broken pipe exceptions
        response.addHeader("Content-Length", "0");

        if (origin != null) {
            response.addHeader("Access-Control-Allow-Origin", origin);
            response.addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, HEAD, OPTIONS");

            String requestHeaders = session.getHeaders().get("access-control-request-headers");
            if (requestHeaders != null) {
                response.addHeader("Access-Control-Allow-Headers", requestHeaders);
            }
        }

        return response;
    }

    @Override
    public Response serve(IHTTPSession session) {
        Log.d(logTag, session.getMethod().toString() + " " + session.getUri());

        if (session.getMethod() == Method.PUT) {
            // ensure request is coming from the app
            String auth = session.getHeaders().get("authorization");
            if (!auth.equals(this.authToken)) {
                return newCorsResponse(Response.Status.UNAUTHORIZED, session);
            }

            long contentLength;

            try {
                contentLength = Long.parseLong(
                        session.getHeaders().get("content-length")
                );
            } catch (NumberFormatException ex) {
                Log.e(logTag, "bad content-length", ex);
                return newCorsResponse(Response.Status.BAD_REQUEST, session);
            }

            String destPath = session.getUri();
            File destFile = new File(destPath);
            if (destFile.isDirectory()) {
                Log.e(logTag, "cannot write to directory");
                return newCorsResponse(Response.Status.INTERNAL_ERROR, session);
            }

            try {
                InputStream in = session.getInputStream();
                OutputStream out = null;

                // write input stream to temp file
                String tmpName = UUID.randomUUID().toString();
                File tmpFile = File.createTempFile(tmpName, null, tmpDir);
                tmpFile.deleteOnExit();

                // any smaller than this and performance suffers noticeably on my Samsung A5
                int chunkSize = 512 * 1024;

                try {
                    out = new FileOutputStream(tmpFile);
                    byte[] buf = new byte[chunkSize];
                    int bytesRead;
                    long totalBytesRead = 0;

                    // reading from a finished input stream causes a socket timeout error
                    while (totalBytesRead < contentLength && (bytesRead = in.read(buf)) > 0) {
                        out.write(buf, 0, bytesRead);
                        totalBytesRead += bytesRead;
                    }
                } finally {
                    if (out != null) {
                        out.close();
                    }
                }

                List<String> recursiveParam = session.getParameters().get("recursive");

                if (recursiveParam != null && recursiveParam.contains("true")) {
                    destFile.getParentFile().mkdirs();
                }

                // then move into place
                if (!tmpFile.renameTo(destFile)) {
                    Log.e(logTag, "failed to move file into place");
                    return newCorsResponse(Response.Status.INTERNAL_ERROR, session);
                }
            } catch (IOException ex) {
                Log.e(logTag, "failed to write body stream to file", ex);
                return newCorsResponse(Response.Status.INTERNAL_ERROR, session);
            }

            // 204 response
            return newCorsResponse(Response.Status.NO_CONTENT, session);
        } else if (session.getMethod() == Method.OPTIONS) {
            return newCorsResponse(Response.Status.OK, session);
        }

        return newCorsResponse(Response.Status.METHOD_NOT_ALLOWED, session);
    }
}
