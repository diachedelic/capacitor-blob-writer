import { FilesystemDirectory } from "@capacitor/core"

declare module "@capacitor/core" {
  interface PluginRegistry {
    BlobWriter: BlobWriterPlugin;
  }
}

export interface BlobWriterPlugin {
  writeFile(options: BlobWriteOptions): Promise<BlobWriteResult>;
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
