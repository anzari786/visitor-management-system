export interface PaginationParams {
   page: number;
   limit: number;
}

export interface PaginationMeta {
   page: number;
   limit: number;
   total: number;
   totalPages: number;
}

export const getSkipTake = ({ page, limit }: PaginationParams) => ({
   skip: (page - 1) * limit,
   take: limit,
});

export const buildPaginationMeta = (
   params: PaginationParams,
   total: number,
): PaginationMeta => ({
   page: params.page,
   limit: params.limit,
   total,
   totalPages: Math.ceil(total / params.limit),
});
