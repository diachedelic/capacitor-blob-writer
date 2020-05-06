import { WebPlugin } from '@capacitor/core';
import {
  BlobWriterPlugin,
  BlobWriteOptions,
  BlobWriteResult,
} from './definitions';

export class BlobWriterWeb extends WebPlugin implements BlobWriterPlugin {
  constructor() {
    super({
      name: 'BlobWriter',
      platforms: ['web']
    });
  }

  async writeFile(options: BlobWriteOptions): Promise<BlobWriteResult> {
    throw new Error('not implemented')
  }
}

const BlobWriter = new BlobWriterWeb();

export { BlobWriter };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(BlobWriter);
