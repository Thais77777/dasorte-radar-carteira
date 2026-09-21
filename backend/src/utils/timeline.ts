import { Prisma, TimelineEventType } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function logTimelineEvent(params: {
  pdvId: string;
  usuarioId?: string | null;
  tipo: TimelineEventType;
  descricao: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.timelineEvent.create({
    data: {
      pdvId: params.pdvId,
      usuarioId: params.usuarioId ?? null,
      tipo: params.tipo,
      descricao: params.descricao,
      metadata: (params.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}
