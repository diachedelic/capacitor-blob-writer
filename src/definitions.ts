declare module "@capacitor/core" {
  interface PluginRegistry {
    BlobWriter: BlobWriterPlugin;
  }
}

export interface BlobWriterPlugin {
  echo(options: { value: string }): Promise<{value: string}>;
}
