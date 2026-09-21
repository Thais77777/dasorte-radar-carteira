# Dá Sorte CRM — Radar de Carteira

CRM interno para o time de Sucesso do Cliente da Dá Sorte Loterias: gestão da base de PDVs,
relacionamento, sellout, retenção, churn, reativação e contactabilidade.

## 1. Objetivo

Transformar a base de PDVs importada em uma **fila de trabalho operacional**, respondendo
diariamente à pergunta: *quais PDVs precisam de ação e o que o time deve fazer?*

Princípio fundamental: a classificação estratégica dos PDVs (**Prioridade, Status de
Retenção, Maturidade, Valor, Segmento**) já vem pronta da planilha importada. O sistema
**nunca recalcula** esses campos — apenas importa, armazena, exibe, filtra e ordena por eles.
O que o CRM controla é a dimensão **operacional**: contactabilidade, tentativas, tarefas,
responsável e timeline.

## 2. Arquitetura

Monorepo com duas aplicações independentes que, em produção, rodam como **um único serviço
web** (o backend compila e serve o build estático do frontend):

```
/backend      API REST em Node.js + TypeScript + Express + Prisma + PostgreSQL
/frontend     SPA em React + TypeScript + Vite + Tailwind CSS
render.yaml   Blueprint de deploy no Render (web service + PostgreSQL gerenciado)
```

Camadas do backend: `routes` (HTTP) → `services` (regras de filtro/importação) →
`utils` (RBAC, paginação, timeline, serialização) → `Prisma` (acesso a dados).
Autorização de carteira (RBAC) é aplicada **no backend**, nunca só no frontend: cada
consulta de PDV é automaticamente restrita ao escopo do usuário autenticado
(`src/utils/scope.ts`).

## 3. Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Recharts
- **Backend:** Node.js, TypeScript, Express
- **Banco:** PostgreSQL (via Prisma ORM)
- **Autenticação:** JWT (bcrypt para senhas)
- **Importação:** ExcelJS (.xlsx/.xls) e PapaParse (.csv)
- **Validação:** Zod

## 4. Modelo de dados (resumo)

`User`, `PDV`, `PDVAssignment` (responsável/backup controlado pelo CRM, independente da
planilha), `Contactability` + `ContactAttempt` (dimensão operacional), `Task`,
`TimelineEvent` (histórico cronológico de tudo), `ImportBatch` + `ImportChange` (auditoria de
importações), `PerformanceSnapshot` (histórico para evolução futura), `Notification`,
`AppConfig` (régua de contactabilidade configurável). Veja `backend/prisma/schema.prisma`.

## 5. Instalação

Pré-requisitos: Node.js 20+, PostgreSQL 14+, npm.

```bash
git clone <url-do-repositorio>
cd dasorte-radar-carteira
```

## 6. Configuração

### Backend

```bash
cd backend
cp .env.example .env
```

Edite `.env`:

```
DATABASE_URL="postgresql://usuario:senha@localhost:5432/dasorte_crm?schema=public"
JWT_SECRET="troque-por-um-segredo-longo-e-aleatorio"
JWT_EXPIRES_IN="8h"
APP_URL="http://localhost:5173"
NODE_ENV="development"
PORT="4000"
```

### Frontend

```bash
cd frontend
cp .env.example .env
```

`VITE_API_URL=/api` (o Vite já faz proxy de `/api` para `http://localhost:4000` em
desenvolvimento — ver `frontend/vite.config.ts`).

## 7. Banco de dados

Crie o banco PostgreSQL local:

```bash
createdb dasorte_crm
# ou: psql -c "CREATE DATABASE dasorte_crm;"
```

## 8. Migration

```bash
cd backend
npm install
npx prisma migrate dev --name init
```

Isso cria todas as tabelas e gera o Prisma Client.

## 9. Seed (dados de teste)

```bash
cd backend
npm run seed
```

Cria **60 PDVs fictícios** cobrindo todas as combinações de Prioridade × Status de
Retenção × Valor, incluindo casos sem telefone, com contato já registrado e tarefas
atrasadas — e os seguintes usuários (senha para todos: `DaSorte@123`):

| Perfil | E-mail |
|---|---|
| Administrador | admin@dasorte.com.br |
| Gestor | gestor@dasorte.com.br |
| Supervisor | supervisor@dasorte.com.br |
| CS / Farmer | cs@dasorte.com.br, cs2@dasorte.com.br |
| Analista de Dados | analista@dasorte.com.br |
| Analista Financeiro | financeiro@dasorte.com.br |

## 10. Usuário admin

O usuário `admin@dasorte.com.br` (criado pelo seed) tem acesso completo, incluindo a tela
**Configurações**, onde é possível criar/editar demais usuários e ajustar a régua de
contactabilidade — sem precisar de acesso direto ao banco.

## 11. Importação da base real

1. Login como Admin ou Gestor.
2. Menu **Importar Base** → selecione o arquivo (`.xlsx`, `.xls` ou `.csv` — a coluna **PDV**
   é a chave única).
3. Confira o mapeamento automático de colunas (pode ser ajustado manualmente) e o preview.
4. Confirme. O relatório final mostra novos registros, atualizados, duplicados e inválidos.
5. Toda alteração em campos estratégicos (Prioridade, Status de Retenção, Valor, Maturidade,
   Segmento) fica registrada na timeline do PDV e no histórico de importações
   (`/historico`), nunca é sobrescrita silenciosamente.

> Arquivos `.ods` devem ser exportados como `.xlsx` antes da importação (não suportado
> nativamente).

## 12. Execução local

Em dois terminais:

```bash
# terminal 1 — API
cd backend
npm run dev        # http://localhost:4000

# terminal 2 — frontend
cd frontend
npm run dev         # http://localhost:5173
```

Acesse `http://localhost:5173` e faça login com um dos usuários do seed.

## 13. GitHub

O repositório já está pronto para versionamento: `.gitignore` cobre `node_modules`, `dist`,
`.env` e `backend/public` (build do frontend copiado em produção). Nunca commite `.env` nem
segredos — apenas os arquivos `.env.example`.

## 14. Deploy no Render

O `render.yaml` na raiz descreve um **Blueprint**: um Web Service Node (que compila o
backend e o frontend, e o backend serve o build estático do frontend) e um banco PostgreSQL
gerenciado.

1. No painel do Render: **New → Blueprint**, aponte para este repositório.
2. O Render lê `render.yaml` e cria o banco `dasorte-crm-db` e o serviço `dasorte-crm`.
3. Preencha a variável `APP_URL` com a URL pública do serviço (ex.:
   `https://dasorte-crm.onrender.com`) — `JWT_SECRET` é gerado automaticamente.
4. No primeiro deploy, o `startCommand` roda `prisma migrate deploy` automaticamente.
5. Após o primeiro deploy, rode o seed **uma vez** via Shell do Render (opcional, apenas
   para ambiente de homologação):
   ```bash
   cd backend && npm run seed
   ```
6. Crie o usuário admin de produção pelo seed, ou insira manualmente via Shell do Render
   com um script Node que use `bcryptjs` para gerar o hash da senha.

## 15. Variáveis de ambiente

Backend (`backend/.env`, ver `backend/.env.example`):

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_SECRET` | Segredo para assinatura dos tokens JWT |
| `JWT_EXPIRES_IN` | Validade do token (ex.: `8h`) |
| `APP_URL` | URL pública do frontend (CORS/links) |
| `NODE_ENV` | `development` ou `production` |
| `PORT` | Porta da API (padrão 4000) |

Frontend (`frontend/.env`, ver `frontend/.env.example`):

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | Base da API (`/api` em dev via proxy e em produção, mesma origem) |

## 16. Troubleshooting

- **`Missing required environment variable`**: falta preencher `backend/.env` — copie de
  `.env.example`.
- **Erro de conexão com o banco**: confirme que o PostgreSQL está rodando e que
  `DATABASE_URL` aponta para um banco existente (`createdb dasorte_crm`).
- **Importação falha em `.ods`**: exporte a planilha como `.xlsx` antes de importar.
- **401 em todas as chamadas após login**: o token expira em `JWT_EXPIRES_IN` (padrão 8h) —
  faça login novamente.
- **Build do Render falha por memória**: reduza o plano apenas se necessário; o build
  compila backend e frontend na mesma etapa.
- **Quero resetar os dados de teste**: `npx prisma migrate reset` (apaga tudo) seguido de
  `npm run seed`.

## Perfis de acesso (RBAC)

| Perfil | Acesso |
|---|---|
| ADMIN | Completo, incluindo Configurações e gestão de usuários |
| GESTOR | Completo aos dashboards e à carteira |
| SUPERVISOR | Sua equipe (CS subordinados) e os PDVs deles |
| CS / FARMER | Apenas a própria carteira (PDVs onde é responsável ou backup) |
| ANALISTA_DADOS | Leitura completa da base + Inteligência & Performance |
| ANALISTA_FINANCEIRO | Leitura completa da base + Financeiro |

As regras de visibilidade são aplicadas nas consultas do backend
(`backend/src/utils/scope.ts`), não apenas escondidas na interface.
