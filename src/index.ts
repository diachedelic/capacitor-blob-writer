import {
  Plugins,
  FilesystemDirectory,
  WebPlugin,
  registerWebPlugin,
} from '@capacitor/core';
import writeFileViaBridge from './fallback';

declare module "@capacitor/core" {
  interface PluginRegistry {
    BlobWriter: BlobWriterPlugin;
  }
}

interface BlobWriterPlugin {
  getConfig(): Promise<ServerConfig>;
}

interface BlobWriterError {
  code?: string;
}

interface ServerConfig {
  // The address of the web server, e.g. "http://localhost:12345"
  baseUrl: string;
  // The required value for the Authorization header on any write requests.
  authToken: string;
}

interface FallbackCallback {
  (error: BlobWriterError): boolean
}

class BlobWriterWeb extends WebPlugin implements BlobWriterPlugin {
  constructor() {
    super({
      name: 'BlobWriter',
      platforms: ['web']
    });
  }

  getConfig(): Promise<ServerConfig> {
    const err = new Error('Not implemented for web') as BlobWriterError
    err.code = 'NOT_IMPLEMENTED'
    return Promise.reject(err);
  }
}

const BlobWriter = new BlobWriterWeb();

registerWebPlugin(BlobWriter);

export interface BlobWriteOptions {
  path: string;
  directory?: FilesystemDirectory;
  data: Blob;
  recursive?: boolean;
  fallback?: boolean | FallbackCallback;
}

export interface BlobWriteResult {
  // The URI of the file which has just been written.
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
      }),
    ])

    const absolutePath = uri.replace('file://', '')
    const queryString = options.recursive ? '?recursive=true' : ''
    const url = baseUrl + absolutePath + queryString

    const { status } = await fetch(url, {
      headers: { authorization: authToken },
      method: 'put',
      body: options.data,
    })

    if (status !== 204) {
      throw new Error('unexpected HTTP status: ' + status)
    }

    return { uri }
  } catch(err) {
    if (
      typeof options.fallback === 'function'
        ? options.fallback(err)
        : options.fallback !== false
    ) {
      if ((err as BlobWriterError).code !== 'NOT_IMPLEMENTED') {
        console.error(err)
      }

      return writeFileViaBridge(
        options.directory,
        options.path,
        options.data,
        options.recursive,
      ).then(function(uri) {
        return { uri };
      });
    }

    throw err
  }
}
