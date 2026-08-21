# Squad Suprimentos / MB

Sistema compartilhado para controle de vagas, Squads de indicação e dashboard executivo.

## Configuração

1. Crie um projeto no Supabase e execute `supabase/schema.sql` no SQL Editor.
2. Copie `.env.example` para `.env.local` e informe a URL e a chave pública.
3. Na Vercel, cadastre as mesmas variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. `npm install && npm run dev`.

Sem as variáveis, o sistema abre em modo de demonstração com as vagas importadas, mas alterações não são compartilhadas.
