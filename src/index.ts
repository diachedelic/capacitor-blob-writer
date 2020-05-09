import {
  Plugins,
  FilesystemDirectory,
  WebPlugin,
  registerWebPlugin,
} from '@capacitor/core';

/**
 * PRIVATE
 */

declare module "@capacitor/core" {
  interface PluginRegistry {
    BlobWriter: BlobWriterPlugin;
  }
}

declare global {
  interface Error {
    code?: string;
  }
}

/**
 * for internal use only
 */
interface BlobWriterPlugin {
  getConfig(): Promise<ServerConfig>;
}

interface ServerConfig {
  /**
   * The origin of the web server, e.g. 'http://localhost:12345'
   */
  baseUrl: string;
  /**
   * Required value for the Authorization header
   */
  authToken: string;
}

class BlobWriterWeb extends WebPlugin implements BlobWriterPlugin {
  constructor() {
    super({
      name: 'BlobWriter',
      platforms: ['web']
    });
  }

  async getConfig(): Promise<ServerConfig> {
    const err = new Error('Not implemented for web')
    err.code = 'NOT_IMPLEMENTED'
    throw err
  }
}

const BlobWriter = new BlobWriterWeb();

registerWebPlugin(BlobWriter);

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * PUBLIC
 */

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
  /**
   * The URI of the file which was just written to
   */
  uri: string;
}

export async function writeFile(options: BlobWriteOptions): Promise<BlobWriteResult> {
  try {
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
  } catch(err) {
    if (err.code !== 'NOT_IMPLEMENTED') {
      console.error(err)
    }

    // fallback to filesystem
    const buffer = await new Response(options.data).arrayBuffer()
    const encoded = arrayBufferToBase64(buffer)

    const { uri } = await Plugins.Filesystem.writeFile({
      path: options.path,
      directory: options.directory,
      data: encoded,
      recursive: true,
    })

    return { uri }
  }
}
