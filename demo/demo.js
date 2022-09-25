/*jslint browser, devel */

import {Filesystem, Directory} from "@capacitor/filesystem";
import {Capacitor} from "@capacitor/core";
import write_blob from "capacitor-blob-writer";

const button = document.createElement("button");
const output = document.createElement("pre");

function log(msg) {
    output.innerHTML += msg + "\n";
    console.log(msg);
}

function compare_array_buffers(...buffers) {
    buffers.map(function (buffer) {
        return new Uint8Array(buffer);
    }).reduce(function (a, b) {
        if (a.length !== b.length) {
            throw new Error("length");
        }
        if (a.some(function (ignore, byte_nr) {
            return a[byte_nr] !== b[byte_nr];
        })) {
            throw new Error("bytes");
        }
        return b;
    });
}

//debug const a = new Uint8Array([0, 42, 128]);
//debug const b = new Uint8Array([0, 42, 128]);
//debug const c = new Uint8Array([0, 42, 128]);
//debug compare_array_buffers(a, b, c);

function make_random_buffer(byte_length) {

// Make an ArrayBuffer containing random bytes.

    return new Uint8Array(byte_length).map(function () {
        return Math.floor(256 * Math.random());
    }).buffer;
}

//debug console.log(new Uint8Array(make_random_buffer(5)));

function resolve_uri({path, directory}) {
    if (directory === undefined) {
        directory = Directory.Data;
    }
    return (
        Capacitor.getPlatform() === "web"
        ? Filesystem.readFile({path, directory}).then(function (result) {
            return URL.createObjectURL(result.data);
        })
        : Filesystem.getUri({path, directory}).then(function (result) {
            return Capacitor.convertFileSrc(result.uri);
        })
    );
}

function test_write({path, buffer, directory, recursive}) {
    path = path ?? `${Math.random()}.bin`;
    buffer = buffer ?? make_random_buffer(10);
    directory = directory ?? Directory.Data;
    recursive = recursive ?? false;
    const start = Date.now();
    let fallback_error;

// Write the file to disk.

    return write_blob({
        path,
        directory,
        blob: new Blob([buffer], {type: "application/octet-stream"}),
        fast_mode: true,
        recursive,
        on_fallback(error) {
            console.log(error.name, error.message);
            fallback_error = error;
        }
    }).then(function () {
        if (fallback_error !== undefined) {
            log("on_fallback");
            throw fallback_error;
        }
        log(`Wrote ${buffer.byteLength} bytes in ${Date.now() - start}ms.`);

// Now read the file back again.

        return resolve_uri({path, directory});
    }).then(
        fetch
    ).then(function (response) {
        if (response.status !== 200) {
            throw new Error("bad status: " + response.status);
        }
        return response.arrayBuffer();
    }).then(function (read_buffer) {

// Make sure it is the same.

        return compare_array_buffers(buffer, read_buffer);
    });
}

function run_tests() {
    log("Starting tests...");
    const now = Date.now();
    return Promise.all([

// Create a file and then overwrite it.

        test_write({path: `${now}.txt`}).then(function () {
            return test_write({path: `${now}.txt`});
        }),

// A file with no file extension.

        test_write({path: `${now}`}),

// A deeply nested file.

        test_write({
            path: `foo/${now}/${now}/${now}.txt`,
            recursive: true
        }),

// Recursive but no parent directory.

        test_write({
            path: `${now}-root.txt`,
            recursive: true
        }),

// Alternate directory.

        test_write({directory: Directory.External}),

// Write larger file to force multiple chunks, for example when streaming to
// disk.

        test_write({buffer: make_random_buffer(5 * 1024 * 1024)})
    ]).then(function () {
        log("Tests passed.");
    });
}

// function array_buffer_to_base64(buffer) {
//     return window.btoa(
//         Array.from(new Uint8Array(buffer)).map(function (byte) {
//             return String.fromCharCode(byte);
//         }).join("")
//     );
// }

// async function run_benchmark() {
//     log("starting benchmark");

//     for (const plugin of ["BlobWriter", "Filesystem"]) {
//         const max_size = 256 * 1024 * 1024;

//         let byte_length = 1;

//         while (byte_length <= max_size) {
//             const blob = make_uniform_blob(byte_length);

//             const start = Date.now();
//             const path = `${Math.random()}.bin`;
//             const directory = Directory.Data;

//             if (plugin === "Filesystem") {

// // read blob as array buffer

//                 const buffer = await new Response(blob).arrayBuffer();

//                 await Filesystem.writeFile({
//                     path,
//                     directory,
//                     data: array_buffer_to_base64(buffer)
//                 });
//             } else {
//                 if (plugin === "BlobWriter") {
//                     await write_blob({
//                         path,
//                         directory,
//                         blob,
//                         fast_mode: true
//                     });
//                 }
//             }

//             log(`${plugin} wrote ${byte_length} in ${Date.now() - start}ms`);

// // exponentially increase data size

//             byte_length *= 2;
//         }
//     }

//     log("benchmark finished");
// }

button.innerHTML = "Write file";
button.onclick = function () {
    test_write({});
};
document.body.append(button);
document.body.append(output);

run_tests().catch(function (err) {
    console.error(err);
    log(err.message);
    log(err.stack);
});
