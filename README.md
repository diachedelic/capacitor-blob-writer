# capacitor-blob-writer
A faster, more stable alternative to `Filesystem.writeFile` for larger files.
Tested with Capacitor v2.

## Installation
```sh
npm install capacitor-blob-writer
npx cap update
```
Then (for Android), add to your `MainActivity.java`:

```java
import com.equimaps.capacitorblobwriter.BlobWriter;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Additional plugins you've installed go here
      // Ex: add(TotallyAwesomePlugin.class);
      add(BlobWriter.class);
    }});
  }
}
```

## Usage
```javascript

import { FilesystemDirectory, Capacitor } from '@capacitor/core'

// you must use the module directly, rather than using `Plugins.BlobWriter`
import { writeFile } from 'capacitor-blob-writer'

async function downloadVideo() {
  // fetch a blob
  const res = await fetch('http://example.com/funny.mp4')
  const blob = await res.blob()

  const { uri } = await writeFile({
    path: 'media/videos/funny.mp4',
    directory: FilesystemDirectory.Data,

    // data must be a Blob (creating a Blob which wraps other data types
    // is trivial)
    data: blob,

    // create intermediate directories if they don't already exist
    // default: false
    recursive: true,

    // fallback to Filesystem.writeFile instead of throwing an error
    // default: true
    fallback: process.env.NODE_ENV === 'production',
  })

  const src = Capacitor.convertFileSrc(uri)

  const video = document.createElement('video')
  video.src = src

  // watch the video offline!
  document.body.appendChild(video)
}
```

## Why it is needed
Capacitor's plugins work by passing data across the "bridge", which is the
javascript interface within the webview which passes data to and from native
code. Unfortunately, only strings can be passed across this bridge, meaning that
binary data must be encoded to Base64. Binary data can be read efficiently by 
using `Capacitor.convertFileSrc` (see example below), however there is no
built-in mechanism for writing.

`Filesystem` becomes very inefficient when writing larger files to disk
(incrementally calling `Filesystem.appendFile` is one solution but it is
excruciatingly slow). Plugins exist for downloading files directly to disk,
but that does not help if large amounts of data is generated from within the
webview, for instance via `<input type="file" capture accept="video/*">`.

Further reading: https://github.com/ionic-team/capacitor/issues/984

## How it works
When the plugin is loaded, a simple webserver is started on a random
port, which streams authenticated `PUT` requests to disk, then moves them into
place. `BlobWriter.writeFile` handles the actual `fetch` call and associated
authentication (and falls back to `Filesystem.writeFile` if the request fails).
Because browsers are highly optimised for network operations,
this write does not block the UI (unlike encoding Base64).

Incredibly, neither iOS nor Android's webview are capable of correctly
reading request bodies, due to
[this](https://issuetracker.google.com/issues/36918490) and
[this](https://bugs.webkit.org/show_bug.cgi?id=179077). Hence an actual
webserver will be required for the forseeable future.

## Known limitations & issues
- potential security risk (only as secure as [GCDWebServer](https://github.com/swisspol/GCDWebServer)/[nanohttpd](https://github.com/NanoHttpd/nanohttpd)), and also #12
- no `append` option yet (see #11)
- still uses `Filesystem.writeFile` for Electron (see #5)

## Benchmarks
I have compared the performance & stability of `Filesystem.writeFile` with
`BlobWriter.writeFile` on my two devices, see `example/src/index.js` for more
details.

### Android (Samsung A5)

| Size          | Filesystem       | BlobWriter          |
|---------------|------------------|---------------------|
| 1 kilobyte    | 18ms             | 89ms                |
| 1 megabyte    | 1009ms           | 87ms                |
| 8 megabytes   | 10.6s            | 0.4s                |
| 32 megabytes  | Out of memory[1] | 1.1s                |
| 256 megabytes |                  | 17.5s               |
| 512 megabytes |                  | Quota exceeded[2]   |

- [1] Crash `java.lang.OutOfMemoryError`
- [2] File cannot be moved into the app's sandbox, I assume because the app's disk quota is exceeded

### iOS (iPhone 6)

| Size          | Filesystem       | BlobWriter          |
|---------------|------------------|---------------------|
| 1 kilobyte    | 6ms              | 16ms                |
| 1 megabyte    | 439ms            | 26ms                |
| 8 megabytes   | 3.7s             | 0.2s                |
| 32 megabytes  | Out of memory[1] | 0.7s                |
| 128 megabytes |                  | 3.1s                |
| 512 megabytes |                  | WebKit error[2]     |

- [1] Crashes the WKWebView, which immediately reloads the page
- [2] `Failed to load resource: WebKit encountered an internal error`

### Google Chrome (MacBook Pro 2012)
Falls back to `Filesystem.writeFile` in the browser, so these results should be
approximately equal.

| Size          | Filesystem       | BlobWriter          |
|---------------|------------------|---------------------|
| 1 kilobyte    | 46ms             | 45ms                |
| 1 megabyte    | 113ms            | 105ms               |
| 8 megabytes   | 1.5s             | 1.3s                |
| 32 megabytes  | 6.7s             | 5.9s                |
| 64 megabytes  | 12.5s            | 16.7s               |
| 512 megabytes | Error[1]         | Error[1]            |

- [1] `DOMException: The serialized keys and/or value are too large`
