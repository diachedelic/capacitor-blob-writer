import { Directory } from '@capacitor/filesystem';

export interface BlobWriterError {
    code?: string;
}
export interface FallbackCallback {
    (error: BlobWriterError): boolean;
}
export interface BlobWriteOptions {
    path: string;
    directory?: Directory;
    data: Blob;
    recursive?: boolean;
    fallback?: boolean | FallbackCallback;
}
export interface BlobWriteResult {
    uri: string;
}

// export interface BlobWriterPlugin {
//     writeFile(options: BlobWriteOptions): Promise<BlobWriteResult>;
// }
export interface ServerConfig {
    // The address of the web server, e.g. "http://localhost:12345"
    baseUrl: string;
    // The required value for the Authorization header on any write requests.
    authToken: string;
  }

  export interface BlobWriterPlugin {
    getConfig(): Promise<ServerConfig>;
    writeFile(options:BlobWriteOptions): Promise<BlobWriteResult>
  }