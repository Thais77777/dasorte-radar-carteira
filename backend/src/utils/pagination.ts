import { Request } from 'express';

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function getPagination(req: Request, defaultPageSize = 25, maxPageSize = 200): PaginationParams {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(String(req.query.pageSize ?? defaultPageSize), 10) || defaultPageSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams) {
  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    },
  };
}
