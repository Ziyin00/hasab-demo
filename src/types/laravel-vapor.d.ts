declare module "laravel-vapor" {
  interface VaporStoreOptions {
    baseURL?: string;
    visibility?: "private" | "public";
    /** Called with upload ratio in the range 0–1 while the file is sent to S3. */
    progress?: (ratio: number) => void;
  }

  interface VaporStoreResponse {
    uuid: string;
    key: string;
    bucket?: string;
    url: string;
  }

  const Vapor: {
    store(file: File, options?: VaporStoreOptions): Promise<VaporStoreResponse>;
  };

  export default Vapor;
}
