import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Dá Sorte CRM API rodando na porta ${env.PORT} [${env.NODE_ENV}]`);
});
