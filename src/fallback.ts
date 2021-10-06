import { Plugins, FilesystemDirectory } from '@capacitor/core';
const { Filesystem } = Plugins;

// By choosing a chunk size which is a multiple of 3, we avoid a bug in
// Filesystem.appendFile, only on the web platform, which corrupts files by
// inserting Base64 padding characters within the file. See
// https://github.com/ionic-team/capacitor-plugins/issues/649.
const chunkSize = 3 * 128 * 1024;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  let i = 0;
  while (i < bytes.byteLength) {
    binary += String.fromCharCode(bytes[i]);
    i++;
  }
  return btoa(binary);
}

function append(
  directory: FilesystemDirectory,
  path: string,
  data: Blob
): Promise<void> {
  if (data.size === 0) {
    return Promise.resolve();
  }

  return new Response(
    data.slice(0, chunkSize)
  ).arrayBuffer().then(function (buffer) {
    return Filesystem.appendFile({
      directory,
      path,
      data: arrayBufferToBase64(buffer),
    })
  }).then(function () {
    return append(directory, path, data.slice(chunkSize))
  });
}

function writeFileViaBridge (
  directory: FilesystemDirectory,
  path: string,
  data: Blob,
  recursive?: boolean
): Promise<string> {
  // create & truncate file
  return Filesystem.writeFile({
    directory,
    path,
    recursive,
    data: '',
  }).then(function({ uri }) {
    // write file incrementally to be enconomical with memory
    return append(directory, path, data).then(function() {
      return uri;
    })
  });
}

export default Object.freeze(writeFileViaBridge);
