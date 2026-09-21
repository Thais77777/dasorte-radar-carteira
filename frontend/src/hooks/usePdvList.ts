import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Paginated, PDV } from '../types';

export function usePdvList(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['pdvs', params],
    queryFn: async () => (await api.get<Paginated<PDV>>('/pdvs', { params })).data,
    placeholderData: (prev) => prev,
  });
}
