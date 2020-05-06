export * from './definitions';
export * from './web';

import {
  BlobWriterPlugin,
  BlobWriteOptions,
  BlobWriteResult,
} from './definitions';

export class BlobWriter implements BlobWriterPlugin {
  async writeFile(options: BlobWriteOptions): Promise<BlobWriteResult> {
    throw new Error('not implemented')
  }
}
