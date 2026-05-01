declare module "laravel-vapor" {
  interface VaporStoreOptions {
    baseURL?: string;
    visibility?: "private" | "public";
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
