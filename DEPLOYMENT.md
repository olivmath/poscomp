Deploy — variáveis de ambiente

Causa do erro 400 “API key not valid”: o repositório continha arquivos .env nas subpastas (admin/.env, app/.env) com uma chave placeholder (dummy-key-for-emulator). Isso faz com que o build em produção tenha uma chave inválida embutida.

Correção necessária (produção):

1) Nunca comitar chaves reais. Removemos os .env com chave placeholder do repositório e agora eles são ignorados.
2) Defina VITE_FIREBASE_API_KEY no painel do seu provedor antes de reconstruir/deployar o app.

Exemplos por provedor:
- Vercel: Project → Settings → Environment Variables → Add `VITE_FIREBASE_API_KEY` (Environment: Production) → Deploy
- Netlify: Site settings → Build & deploy → Environment → Add variable `VITE_FIREBASE_API_KEY` → Redeploy
- Firebase Hosting (GitHub Actions): adicione a variável no Secrets/Actions ou no CI que roda `pnpm --prefix app build` e `pnpm --prefix admin build` antes do deploy.

Depois de setar a variável, faça um novo build/deploy para que a chave seja incorporada no bundle.

Se informar qual provedor está usando, eu guio passo-a-passo ou executo ações adicionais (não consigo setar variáveis no provedor sem credenciais).