// not implemented
// export * from './web';

import { Plugins, FilesystemDirectory } from '@capacitor/core';

declare module "@capacitor/core" {
  interface PluginRegistry {
    BlobWriter: BlobWriterPlugin;
  }
}

export interface BlobWriterPlugin {
  // used internally
  getConfig(): Promise<BlobWriteResult>;
}

export interface BlobWriteOptions {
  /**
   * The filename to write
   */
  path: string;
  /**
   * The data to write
   */
  data: Blob;
  /**
   * The FilesystemDirectory to store the file in
   */
  directory?: FilesystemDirectory;
}

export interface BlobWriteResult {
  uri: string;
}

export async function writeFile(options: BlobWriteOptions): Promise<BlobWriteResult> {
  const [
    { baseUrl, authToken },
    { uri }
  ] = await Promise.all([
    Plugins.BlobWriter.getConfig(),
    Plugins.Filesystem.getUri({
      path: options.path,
      directory: options.directory,
    })
  ])

  const absolutePath = uri.replace('file://', '')

  const { status } = await fetch(baseUrl + absolutePath, {
    headers: { authorization: authToken },
    method: 'put',
    body: options.data,
  })

  if (status !== 204) {
    throw new Error('unexpected HTTP status')
  }

  return { uri }
}
