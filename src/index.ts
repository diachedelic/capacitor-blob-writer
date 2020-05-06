export * from './definitions';
// export * from './web';

import {
  BlobWriteOptions,
  BlobWriteResult,
} from './definitions';

import { Plugins } from '@capacitor/core';

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

  const absolutePath = uri.replace('file://', '');

  const { status } = await fetch(baseUrl + absolutePath, {
    headers: { authorization: authToken },
    method: 'put',
    body: options.data,
  });

  if (status !== 204) {
    throw new Error('unexpected HTTP status')
  }

  return { uri };
}
