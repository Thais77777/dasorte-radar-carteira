import { PrismaClient, RoleName, ContactabilidadeStatus, CanalContato, ResultadoContato, TimelineEventType, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CIDADES = ['Belo Horizonte', 'Contagem', 'Betim', 'Uberlândia', 'Juiz de Fora', 'Montes Claros', 'Ipatinga'];
const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa', 'Monitorar'];
const STATUS_RETENCAO = ['Saudável', 'Tendência', 'Risco', 'Churn'];
const VALORES = ['Alto', 'Médio', 'Baixo'];
const MATURIDADES = ['Novo', 'Médio', 'Antigo'];
const CANAIS = ['Loterica', 'Banca de Jornal', 'Conveniência', 'Bar'];

async function main() {
  console.log('Seed: criando usuários...');

  const password = await bcrypt.hash('DaSorte@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dasorte.com.br' },
    update: {},
    create: { name: 'Ana Administradora', email: 'admin@dasorte.com.br', passwordHash: password, role: RoleName.ADMIN },
  });

  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@dasorte.com.br' },
    update: {},
    create: { name: 'Gustavo Gestor', email: 'gestor@dasorte.com.br', passwordHash: password, role: RoleName.GESTOR },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@dasorte.com.br' },
    update: {},
    create: { name: 'Sandra Supervisora', email: 'supervisor@dasorte.com.br', passwordHash: password, role: RoleName.SUPERVISOR },
  });

  const cs1 = await prisma.user.upsert({
    where: { email: 'cs@dasorte.com.br' },
    update: {},
    create: { name: 'Carlos Farmer', email: 'cs@dasorte.com.br', passwordHash: password, role: RoleName.CS, supervisorId: supervisor.id },
  });

  const cs2 = await prisma.user.upsert({
    where: { email: 'cs2@dasorte.com.br' },
    update: {},
    create: { name: 'Camila Farmer', email: 'cs2@dasorte.com.br', passwordHash: password, role: RoleName.CS, supervisorId: supervisor.id },
  });

  const analista = await prisma.user.upsert({
    where: { email: 'analista@dasorte.com.br' },
    update: {},
    create: { name: 'Alice Analista', email: 'analista@dasorte.com.br', passwordHash: password, role: RoleName.ANALISTA_DADOS },
  });

  const financeiro = await prisma.user.upsert({
    where: { email: 'financeiro@dasorte.com.br' },
    update: {},
    create: { name: 'Fábio Financeiro', email: 'financeiro@dasorte.com.br', passwordHash: password, role: RoleName.ANALISTA_FINANCEIRO },
  });

  console.log('Seed: criando PDVs fictícios...');
  const csUsers = [cs1, cs2];
  let counter = 1;

  for (const prioridade of PRIORIDADES) {
    for (const statusRetencao of STATUS_RETENCAO) {
      for (const valor of VALORES) {
        const codigoPdv = `SEED-${String(counter).padStart(4, '0')}`;
        const cidade = CIDADES[counter % CIDADES.length];
        const maturidade = MATURIDADES[counter % MATURIDADES.length];
        const canal = CANAIS[counter % CANAIS.length];
        const semTelefone = counter % 6 === 0;
        const diasSemTransacao = statusRetencao === 'Churn' ? 120 + (counter % 60) : statusRetencao === 'Risco' ? 45 + (counter % 30) : statusRetencao === 'Tendência' ? 20 + (counter % 15) : counter % 10;
        const selloutTotal = (valor === 'Alto' ? 50000 : valor === 'Médio' ? 15000 : 3000) + counter * 37;
        const selloutMedioMensal = Math.round(selloutTotal / 12);
        const responsavel = csUsers[counter % csUsers.length];

        const existing = await prisma.pDV.findUnique({ where: { codigoPdv } });
        if (existing) {
          counter++;
          continue;
        }

        const pdv = await prisma.pDV.create({
          data: {
            codigoPdv,
            nome: `PDV Fictício ${counter} — ${cidade}`,
            cidade,
            telefone: semTelefone ? null : `31 9${String(90000000 + counter).slice(0, 8)}`,
            canal,
            modalidade: 'Físico',
            supervisorPlanilha: supervisor.name,
            consultorPlanilha: responsavel.name,
            statusVendas: statusRetencao === 'Churn' ? 'Inativo' : 'Ativo',
            adimplencia: counter % 7 === 0 ? 'Inadimplente' : 'Adimplente',
            maturidade,
            statusRetencao,
            valor,
            prioridade,
            segmento: `${prioridade} / ${statusRetencao} / ${valor}`,
            ultimaTransacao: new Date(Date.now() - diasSemTransacao * 86400000),
            diasSemTransacao,
            selloutTotal,
            selloutMedioMensal,
            estoque: 10 + (counter % 40),
            totalPacotesRaspadinha: 100 + counter,
            totalVendasRaspadinha: 80 + counter,
            dataAtivacao: new Date(Date.now() - (365 + counter * 3) * 86400000),
            mesesDeBase: 12 + (counter % 24),
            diasComMovimento: 200 - (counter % 100),
          },
        });

        await prisma.pDVAssignment.create({
          data: { pdvId: pdv.id, responsavelId: responsavel.id, backupId: csUsers.find((u) => u.id !== responsavel.id)!.id },
        });

        const contactStatus = semTelefone
          ? ContactabilidadeStatus.SEM_TELEFONE
          : counter % 5 === 0
          ? ContactabilidadeStatus.CONTATO_REALIZADO
          : counter % 4 === 0
          ? ContactabilidadeStatus.SEM_RESPOSTA
          : ContactabilidadeStatus.NUNCA_CONTATADO;

        await prisma.contactability.create({
          data: {
            pdvId: pdv.id,
            status: contactStatus,
            ultimoContato: contactStatus === ContactabilidadeStatus.NUNCA_CONTATADO || contactStatus === ContactabilidadeStatus.SEM_TELEFONE ? null : new Date(),
            numeroTentativas: contactStatus === ContactabilidadeStatus.NUNCA_CONTATADO || contactStatus === ContactabilidadeStatus.SEM_TELEFONE ? 0 : 1 + (counter % 3),
            ultimoCanal: contactStatus === ContactabilidadeStatus.CONTATO_REALIZADO ? 'LIGACAO' : null,
          },
        });

        await prisma.timelineEvent.create({
          data: { pdvId: pdv.id, tipo: TimelineEventType.IMPORTACAO, descricao: 'PDV criado pelo seed de dados de teste.' },
        });

        if (contactStatus === ContactabilidadeStatus.CONTATO_REALIZADO || contactStatus === ContactabilidadeStatus.SEM_RESPOSTA) {
          await prisma.contactAttempt.create({
            data: {
              pdvId: pdv.id,
              usuarioId: responsavel.id,
              canal: CanalContato.LIGACAO,
              resultado: contactStatus === ContactabilidadeStatus.CONTATO_REALIZADO ? ResultadoContato.CONTATO_REALIZADO : ResultadoContato.SEM_RESPOSTA,
              observacao: 'Contato de exemplo gerado pelo seed.',
            },
          });
          await prisma.timelineEvent.create({
            data: { pdvId: pdv.id, usuarioId: responsavel.id, tipo: TimelineEventType.CONTATO_REGISTRADO, descricao: 'Contato de exemplo registrado pelo seed.' },
          });
        }

        if (prioridade === 'Crítica' || statusRetencao === 'Risco') {
          const prazo = new Date(Date.now() + (counter % 5 === 0 ? -2 : 3) * 86400000);
          await prisma.task.create({
            data: {
              pdvId: pdv.id,
              responsavelId: responsavel.id,
              criadoPorId: supervisor.id,
              titulo: 'Ligar para negociar retenção',
              tipo: 'LIGACAO',
              status: TaskStatus.PENDENTE,
              prazo,
            },
          });
        }

        counter++;
      }
    }
  }

  console.log(`Seed concluído: ${counter - 1} PDVs fictícios criados.`);
  console.log('Usuários de teste (senha para todos: DaSorte@123):');
  console.log(`  ADMIN                admin@dasorte.com.br`);
  console.log(`  GESTOR               gestor@dasorte.com.br`);
  console.log(`  SUPERVISOR           supervisor@dasorte.com.br`);
  console.log(`  CS / FARMER          cs@dasorte.com.br / cs2@dasorte.com.br`);
  console.log(`  ANALISTA_DADOS       analista@dasorte.com.br`);
  console.log(`  ANALISTA_FINANCEIRO  financeiro@dasorte.com.br`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
