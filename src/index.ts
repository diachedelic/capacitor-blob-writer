import { registerPlugin } from '@capacitor/core';
import type {BlobWriterPlugin} from './definitions';

const BlobWriter = registerPlugin<BlobWriterPlugin>('BlobWriter', {
  web: () => import('./web').then(m => new m.BlobWriterWeb()),
});

export * from './definitions';
export { BlobWriter };