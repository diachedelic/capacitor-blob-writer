import { WebPlugin } from '@capacitor/core';
import { BlobWriterPlugin } from './definitions';

export class BlobWriterWeb extends WebPlugin implements BlobWriterPlugin {
  constructor() {
    super({
      name: 'BlobWriter',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }
}

const BlobWriter = new BlobWriterWeb();

export { BlobWriter };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(BlobWriter);
