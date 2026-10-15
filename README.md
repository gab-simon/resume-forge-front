# Resume Forge (front)

Front-end do Resume Forge, a plataforma de currículos ATS-friendly. Consome a API FastAPI do repositório [resume-forge](https://github.com/gab-simon/resume-forge). O resultado do build é uma SPA estática: HTML, CSS e JavaScript servidos por nginx ou por qualquer CDN.

Nasceu do `react-front-template`, que veio da pasta `frontend/` do [full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template).

## O que vem pronto

- Vite 8, React 19 e TypeScript strict
- TanStack Router com rotas por arquivo e um chunk JavaScript por rota
- TanStack Query com client tipado, gerado do OpenAPI do FastAPI por `@hey-api/openapi-ts`
- shadcn/ui e Tailwind CSS 4, com tema claro e escuro
- Fonte Geist, instalada por `@fontsource-variable/geist`. Os arquivos entram no build, e o browser não faz requisição ao Google Fonts
- React Hook Form e Zod
- Interface em inglês (`en-US`) e português do Brasil (`pt-BR`), com i18next
- Biome, Vitest, Testing Library e Playwright
- Login por código enviado ao e-mail (feature `auth`) e configurações da conta (feature `account`)
- `Dockerfile` com nginx e workflow do GitHub Actions
- `AGENTS.md` com as regras que os agentes de código devem seguir

## Login

Não há senha. A tela `/login` pede o e-mail, o back envia um código de 6 dígitos e a tela troca o código por um par de tokens. O primeiro login de um e-mail cria a conta.

- Os tokens ficam no `localStorage` (`auth-session`), junto com um identificador fixo do navegador (`device-id`). O access token vale 60 minutos.
- `src/api/client.ts` envia `Authorization: Bearer` só nas operações que o OpenAPI marca como autenticadas. Faltando menos de 1 minuto para expirar, a sessão troca o refresh token por um par novo antes da requisição. Várias requisições ao mesmo tempo compartilham uma só troca, porque o back revoga a sessão quando um refresh token é usado duas vezes.
- Uma resposta 401 de uma operação autenticada encerra a sessão e leva ao `/login?redirect=...`. O 401 de um código errado no login não faz isso.
- As rotas dentro de `src/routes/_app/` exigem sessão. Sem ela, `beforeLoad` redireciona para `/login`, que volta à página pedida depois do login.
- No login, a interface passa para o idioma salvo na conta. Em `/settings`, a pessoa troca o nome, o idioma da interface, o idioma do currículo e o modelo padrão.

Com o back em desenvolvimento (`EMAIL_BACKEND=console`), o código aparece no log da API em vez de ir por e-mail.

## Pré-requisitos

- [Bun](https://bun.sh) 1.x. O template foi testado com a versão 1.4
- Node.js 22 ou mais novo, para o gerador de rotas, o Vitest e o Playwright. Com Node 20 o `typecheck` falha com `ERR_REQUIRE_ESM`
- Docker, só para gerar a imagem de produção

## Como rodar

```bash
bun install
cp .env.example .env
bun run dev
```

A aplicação abre em `http://localhost:5173` e manda para o `/login`. O login precisa do back respondendo em `VITE_API_URL`, com `CORS_ALLOWED_ORIGINS=http://localhost:5173`. Pelo workspace, `mani run dev --all` sobe os dois.

## Testes e verificações

Antes de considerar qualquer alteração pronta, rode:

```bash
bun run lint:fix   # formata e ordena imports
bun run check      # lint, typecheck e testes unitários
bun run test:e2e   # Playwright, com a API simulada
```

O projeto tem três tipos de teste:

- testes unitários de lógica (`*.test.ts`), para schemas Zod e utilitários;
- testes de componente (`*.test.tsx`), que renderizam a página de uma feature em jsdom com a rede simulada;
- testes E2E (`e2e/*.spec.ts`), que abrem a aplicação no Chromium e respondem às chamadas da API com dados em memória.

Na primeira execução do E2E, instale o navegador com `bunx playwright install chromium`. Para rodar o E2E contra o back real em vez da API simulada, use `E2E_REAL_API=1 bun run test:e2e`. Para ver os passos na tela, use `bunx playwright test --ui`.

O workflow do GitHub roda `lint`, `typecheck`, `test` e `build`, mas não o E2E. Rode o E2E localmente.

A seção "Tests" do [AGENTS.md](AGENTS.md) lista quais testes cada tipo de mudança exige.

## Como apontar para o back

A única variável de ambiente é `VITE_API_URL`, a URL base do FastAPI, sem barra no final:

```
VITE_API_URL=http://localhost:9000
```

`src/config/env.ts` valida a variável com Zod. Se ela faltar ou não for uma URL, a aplicação falha ao iniciar com uma mensagem que cita o nome da variável.

O Vite grava o valor no JavaScript durante o build. Trocar a URL exige um build novo.

### Back-end

O back é o `resume-forge`. O `openapi.json` versionado aqui é o schema gerado por ele, e a porta padrão em `.env.example`, 9000, é a porta local dele.

### CORS

Em desenvolvimento o front roda em `http://localhost:5173` e o back em outra porta, então o back precisa liberar essa origem. No back, isso é a variável `CORS_ALLOWED_ORIGINS` do `.env`:

```
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Em produção, o valor é a URL pública do front. Vários valores são separados por vírgula. Com a variável vazia, o browser bloqueia todas as chamadas do front.

### Nomes das operações

O client gerado usa o `operationId` de cada endpoint como nome de função. O padrão do FastAPI produz nomes como `readMeApiV1MeGet`. O back define `generate_unique_id_function` para montar o `operationId` como `<TAG>-<nome da função>`:

```python
def _generate_unique_id(route: APIRoute) -> str:
    if not route.tags:
        return route.name
    return f'{route.tags[0]}-{route.name}'


app = FastAPI(generate_unique_id_function=_generate_unique_id)
```

Com isso, a função `read_me` em um router com `tags=['ME']` vira o `operationId` `ME-read_me`. O client gera a função `meReadMe`, as query options `meReadMeOptions()` e a query key `meReadMeQueryKey()`. Renomear a função ou a tag no back renomeia essas funções no front.

### Erros

O back responde erros no formato padrão do FastAPI, `{ "detail": "..." }` ou `{ "detail": [{ "loc", "msg", "type" }] }`. `getErrorMessage`, em `src/api/errors.ts`, entende os dois.

## Idiomas

A interface existe em inglês e em português do Brasil. Cada idioma é um arquivo JSON em `src/locales`, com o nome da sua tag: `en-US.json` e `pt-BR.json`. Os dois têm as mesmas chaves, agrupadas por área (`common`, `errors`, `nav`) e por feature (`auth`, `account`).

```json
{
  "common": { "save": "Save" },
  "auth": {
    "code": { "description": "We sent a 6-digit code to {{email}}." }
  }
}
```

Um componente lê o texto com `t("auth.code.description", { email })`, de `useTranslation()`. Os dois arquivos entram no bundle principal, e trocar de idioma não faz nenhuma requisição.

A aplicação escolhe o idioma ao carregar a página, nesta ordem:

1. a escolha salva em `localStorage`, na chave `ui-language`;
2. o primeiro idioma de `navigator.languages` que existe na aplicação. Outra região do mesmo idioma também vale, então um browser em `pt-PT` abre em `pt-BR`;
3. `en-US`.

O item "Language" no rodapé da sidebar ("Idioma", com a tela em português) e os botões da tela de login trocam o idioma e salvam a escolha. Depois do login vale o idioma salvo na conta. A troca atualiza a tela, o título da aba e o atributo `lang` do `<html>` sem recarregar a página.

Três verificações acompanham os arquivos:

- o `typecheck` falha quando o código usa uma chave que não existe em `en-US.json`;
- o teste `src/locales/locales.test.ts` falha quando `pt-BR.json` tem chave faltando, chave sobrando, texto vazio ou variáveis diferentes das do inglês;
- os testes unitários e o E2E rodam em `en-US`. `e2e/language.spec.ts` cobre a detecção e a troca para `pt-BR`.

Nenhuma verificação encontra um texto escrito direto em um componente. Isso depende de revisão.

O front não traduz as mensagens de erro que vêm da API. Um `detail` em inglês aparece em inglês com a tela em português. A mensagem genérica, usada quando a resposta não traz texto, é traduzida.

A seção "Interface text and languages" do [AGENTS.md](AGENTS.md) tem as regras para escrever textos, formatar números e datas e adicionar um idioma.

## Como gerar o client

O `openapi.json` fica versionado na raiz, então o build e o workflow do GitHub não dependem do back estar no ar.

```bash
bun run fetch-openapi     # baixa ${VITE_API_URL}/openapi.json para a raiz
bun run generate-client   # gera src/api/generated
bun run typecheck         # mostra o que a mudança do back quebrou no front
```

Faça commit de `openapi.json` e de `src/api/generated` juntos. O workflow `Code quality` roda `generate-client` e falha se a pasta gerada ficar diferente da versionada.

Nunca edite `src/api/generated` à mão. A configuração do gerador fica em `openapi-ts.config.ts`, e a configuração do client em tempo de execução fica em `src/api/client.ts`.

## Scripts

| Script | O que faz |
|---|---|
| `dev` | Servidor de desenvolvimento |
| `build` | `typecheck` e build de produção em `dist/` |
| `preview` | Serve `dist/` localmente |
| `lint` / `lint:fix` | Biome, só verificando ou corrigindo |
| `typecheck` | Regenera a árvore de rotas e roda `tsc --noEmit` |
| `generate-routes` | Regenera `src/routeTree.gen.ts` |
| `test` / `test:watch` | Vitest |
| `test:e2e` | Playwright |
| `check` | `lint`, `typecheck` e `test` |
| `fetch-openapi` | Baixa o schema do back |
| `generate-client` | Gera o client da API |
| `analyze` | Build com relatório do bundle em `dist/stats.html` |

## Como fazer deploy

### Docker

```bash
docker build --build-arg VITE_API_URL=https://api.exemplo.com -t meu-front .
docker run -p 8080:80 meu-front
```

O `Dockerfile` compila com Bun e copia `dist/` para uma imagem `nginx:1-alpine`. O `nginx.conf` faz três coisas:

- devolve `index.html` para qualquer caminho que não seja um arquivo, para que `/settings` funcione ao recarregar a página;
- envia `Cache-Control: public, max-age=31536000, immutable` para `/assets/`, cujos arquivos têm hash no nome;
- envia `Cache-Control: no-cache` para `index.html`, para que cada deploy chegue ao usuário na visita seguinte.

Cada ambiente (homologação, produção) precisa de uma imagem própria, porque `VITE_API_URL` é fixado no build.

### Hospedagem estática

Rode `VITE_API_URL=https://api.exemplo.com bun run build` e publique a pasta `dist/` em Cloudflare Pages, Netlify, S3 com CloudFront ou equivalente. Configure o serviço para devolver `index.html` em rotas não encontradas e aplique as mesmas regras de cache do `nginx.conf`.

### Abas abertas durante um deploy

Cada build muda o hash no nome dos arquivos de `/assets`. Uma aba aberta antes do deploy ainda aponta para os nomes antigos, e a navegação seguinte pede um chunk que não existe mais. `installChunkReloadHandler`, em `src/lib/chunk-reload.ts`, escuta o evento `vite:preloadError` e recarrega a página uma vez, o que busca o `index.html` novo. Se o chunk falhar de novo em menos de 10 segundos, a tela de erro do router aparece no lugar de um segundo reload. O reload descarta o que o usuário digitou em um formulário ainda não enviado.

## Verificação de qualidade no GitHub

`.github/workflows/code-quality.yml` roda em pull requests para `main` e executa `lint`, `typecheck`, `test` e `build`. Depois ele roda `generate-client` e falha se `src/api/generated` ficar diferente do que está versionado. O workflow não faz deploy e não roda o E2E. Rode `bun run test:e2e` localmente antes de abrir o pull request.

## Estrutura e regras

A estrutura de pastas, as regras de arquitetura e os passos para criar uma feature estão no [AGENTS.md](AGENTS.md).
