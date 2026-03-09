export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
}
