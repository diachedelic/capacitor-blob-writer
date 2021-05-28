import {
    WebPlugin,
  } from '@capacitor/core';
  import {Filesystem} from '@capacitor/filesystem'
import { BlobWriteOptions, BlobWriterError, BlobWriteResult, BlobWriterPlugin, ServerConfig } from './definitions';
  import writeFileViaBridge from './fallback';
  
  
  export class BlobWriterWeb extends WebPlugin implements BlobWriterPlugin {
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
    async writeFile(options: BlobWriteOptions): Promise<BlobWriteResult> {
      try {
        const [
          { baseUrl, authToken },
          { uri }
        ] = await Promise.all([
          this.getConfig(),
          Filesystem.getUri({
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
            : options.fallback
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
    
  }
  
