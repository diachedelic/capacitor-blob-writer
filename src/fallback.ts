import { Directory, Filesystem } from '@capacitor/filesystem';

const chunkSize = 256 * 1024;

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
  directory: Directory,
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

function _writeFileViaBridge(
  directory: Directory,
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
  }).then(function ({ uri }) {
    // write file incrementally to be enconomical with memory
    return append(directory, path, data).then(function () {
      return uri;
    })
  });
}

export const writeFileViaBridge = Object.freeze(_writeFileViaBridge);
