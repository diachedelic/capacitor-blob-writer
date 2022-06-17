/*jslint browser this */
import {Capacitor, registerPlugin} from "@capacitor/core";
import {Filesystem} from "@capacitor/filesystem";

const BlobWriter = registerPlugin("BlobWriter");

function array_buffer_to_base64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary_string = "";
    let byte_nr = 0;
    while (true) {
        if (byte_nr >= bytes.byteLength) {
            break;
        }
        binary_string += String.fromCharCode(bytes[byte_nr]);
        byte_nr += 1;
    }
    return window.btoa(binary_string);
}

function append_blob(directory, path, blob) {
    if (blob.size === 0) {
        return Promise.resolve();
    }

// By choosing a chunk size which is a multiple of 3, we avoid a bug in
// Filesystem.appendFile, only on the web platform, which corrupts files by
// inserting Base64 padding characters within the file. See
// https://github.com/ionic-team/capacitor-plugins/issues/649.

    const chunk_size = 3 * 128 * 1024;
    const chunk_blob = blob.slice(0, chunk_size);

// Read the Blob as an ArrayBuffer, then append it to the file on disk.

    return new window.Response(chunk_blob).arrayBuffer().then(
        function append_chunk_to_file(buffer) {
            return Filesystem.appendFile({
                directory,
                path,
                data: array_buffer_to_base64(buffer)
            });
        }
    ).then(function write_remaining() {
        return append_blob(directory, path, blob.slice(chunk_size));
    });
}

function update_blob_content(directory, relative, blob) {

    return new Promise(function (resolve, reject) {
        function fail() {
            reject(this.error);
        }

        const connection = window.indexedDB.open("Disc");
        connection.onerror = fail;
        connection.onsuccess = function () {
            const db = connection.result;

            const transaction = db.transaction("FileStorage", "readwrite");
            transaction.onerror = fail;

            const store = transaction.objectStore("FileStorage");
            const path = `/${directory}/${relative.replace(/^\//, "")}`;

            const load = store.get(path);
            load.onerror = fail;
            load.onsuccess = function () {
                const put = store.put(Object.assign(load.result, {
                    size: blob.size,
                    content: blob
                }));
                put.onerror = fail;
                put.onsuccess = function () {
                    resolve(undefined);
                };
            };
        };
    });
}

function write_file_via_indexeddb({
    path,
    directory,
    blob,
    recursive
}) {

// Firstly, create the file entry in the database.

    return Filesystem.writeFile({
        directory,
        path,
        recursive,
        data: ""
    }).then(function () {

// Now update the content of the file entry

        return update_blob_content(directory, path, blob);
    });
}

function write_file_via_bridge({
    path,
    directory,
    blob,
    recursive
}) {

// Firstly, create & truncate the file.

    return Filesystem.writeFile({
        directory,
        path,
        recursive,
        data: ""
    }).then(function () {

// Now write the file incrementally so we do not exceed our memory limits when
// attempting to Base64 encode the entire Blob at once.

        return append_blob(directory, path, blob);
    });
}

function write_blob(options) {
    const {
        path,
        directory,
        blob,
        recursive,
        on_fallback
    } = options;
    if (Capacitor.getPlatform() === "web") {
        return write_file_via_indexeddb(options);
    }
    return Promise.all([
        BlobWriter.get_config(),
        Filesystem.getUri({path, directory})
    ]).then(function on_success([config, file_info]) {
        const {base_url, auth_token} = config;
        const absolute_path = file_info.uri.replace("file://", "");
        return Promise.all([
            fetch(
                base_url + absolute_path + (
                    recursive
                    ? "?recursive=true"
                    : ""
                ),
                {
                    headers: {authorization: auth_token},
                    method: "put",
                    body: blob
                }
            ),
            Promise.resolve(file_info)
        ]);
    }).then(function ([response, file_info]) {
        if (response.status !== 204) {
            throw new Error("Bad HTTP status: " + response.status);
        }
        return file_info.uri;
    }).catch(function on_fail(error) {
        if (on_fallback !== undefined) {
            on_fallback(error);
        }
        return write_file_via_bridge(options);
    });
}

export default Object.freeze(write_blob);
