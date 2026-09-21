import { Prisma, RoleName } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { JwtPayload } from '../lib/jwt';

/**
 * Regras de visibilidade de carteira (aplicadas no backend, nunca só no
 * frontend):
 * - ADMIN, GESTOR, ANALISTA_DADOS, ANALISTA_FINANCEIRO: veem toda a base.
 * - SUPERVISOR: vê os PDVs cujo responsável/backup ativo é ele mesmo ou
 *   um membro da sua equipe.
 * - CS: vê apenas os PDVs em que é responsável ou backup ativo.
 */
export async function getPdvWhereScope(user: JwtPayload): Promise<Prisma.PDVWhereInput> {
  if (user.role === RoleName.ADMIN || user.role === RoleName.GESTOR || user.role === RoleName.ANALISTA_DADOS || user.role === RoleName.ANALISTA_FINANCEIRO) {
    return {};
  }

  let userIds: string[] = [user.sub];

  if (user.role === RoleName.SUPERVISOR) {
    const team = await prisma.user.findMany({ where: { supervisorId: user.sub }, select: { id: true } });
    userIds = [user.sub, ...team.map((t) => t.id)];
  }

  return {
    assignments: {
      some: {
        ativo: true,
        OR: [{ responsavelId: { in: userIds } }, { backupId: { in: userIds } }],
      },
    },
  };
}

export async function assertPdvVisible(user: JwtPayload, pdvId: string): Promise<boolean> {
  const scope = await getPdvWhereScope(user);
  const count = await prisma.pDV.count({ where: { AND: [{ id: pdvId }, scope] } });
  return count > 0;
}

export function isManagement(role: RoleName): boolean {
  return role === RoleName.ADMIN || role === RoleName.GESTOR;
}
