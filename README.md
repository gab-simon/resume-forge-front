# react-front-template

Template de front-end em React e TypeScript para projetos que consomem uma API FastAPI. O resultado do build é uma SPA estática: HTML, CSS e JavaScript servidos por nginx ou por qualquer CDN.

O ponto de partida foi a pasta `frontend/` do [full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template), reorganizada por feature e sem as telas de usuários e de autenticação.

## O que vem pronto

- Vite 8, React 19 e TypeScript strict
- TanStack Router com rotas por arquivo e um chunk JavaScript por rota
- TanStack Query com client tipado, gerado do OpenAPI do FastAPI por `@hey-api/openapi-ts`
- shadcn/ui e Tailwind CSS 4, com tema claro e escuro
- Fonte Geist, instalada por `@fontsource-variable/geist`. Os arquivos entram no build, e o browser não faz requisição ao Google Fonts
- React Hook Form e Zod
- Interface em inglês (`en-US`) e português do Brasil (`pt-BR`), com i18next
- Biome, Vitest, Testing Library e Playwright
- Uma feature de exemplo, `items`, com listagem paginada, criação, edição, exclusão e testes
- `Dockerfile` com nginx e workflow do GitHub Actions
- `AGENTS.md` com as regras que os agentes de código devem seguir

O template não inclui autenticação. O `AGENTS.md` descreve onde adicioná-la.

## Pré-requisitos

- [Bun](https://bun.sh) 1.x. O template foi testado com a versão 1.4
- Node.js, para rodar o Playwright. O template foi testado com a versão 26
- Docker, só para gerar a imagem de produção

## Como rodar

```bash
bun install
cp .env.example .env
bun run dev
```

A aplicação abre em `http://localhost:5173`. A tela `Items` precisa de um back que responda em `VITE_API_URL`. Sem back, ela mostra o estado de erro com o botão de nova tentativa.

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

## Como criar um projeto a partir do template

1. Crie o repositório novo a partir deste (botão "Use this template" no GitHub).
2. Troque `name` em `package.json`, `APP_NAME` em `src/config/app.ts`, o `<title>` em `index.html` e `public/favicon.svg`. O `APP_NAME` é o nome do produto e não é traduzido.
3. Aponte para o seu back e gere o client, como descrito abaixo.
4. Crie as features do projeto seguindo o passo a passo do `AGENTS.md`.
5. Remova a feature `items` quando a primeira feature real estiver completa e puder servir de modelo. Ela existe só para demonstrar o padrão. A seção "How to remove the example feature" do `AGENTS.md` lista os arquivos a apagar e os textos a atualizar, e instrui os agentes a fazer a remoção na mesma tarefa em que concluem a primeira feature real.

## Como apontar para o back

A única variável de ambiente é `VITE_API_URL`, a URL base do FastAPI, sem barra no final:

```
VITE_API_URL=http://localhost:9000
```

`src/config/env.ts` valida a variável com Zod. Se ela faltar ou não for uma URL, a aplicação falha ao iniciar com uma mensagem que cita o nome da variável.

O Vite grava o valor no JavaScript durante o build. Trocar a URL exige um build novo.

### Back-end de referência

Este template foi feito para funcionar com o `fastapi-api-template`. O `openapi.json` versionado aqui é o schema gerado por ele, e a porta padrão em `.env.example`, 9000, é a porta local dele. As três configurações abaixo já existem nesse back. Se você usar outro back FastAPI, precisa reproduzi-las.

### CORS

Em desenvolvimento o front roda em `http://localhost:5173` e o back em outra porta, então o back precisa liberar essa origem. No `fastapi-api-template`, isso é a variável `CORS_ALLOWED_ORIGINS` do `.env`:

```
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Em produção, o valor é a URL pública do front. Vários valores são separados por vírgula. Com a variável vazia, o browser bloqueia todas as chamadas do front.

### Nomes das operações

O client gerado usa o `operationId` de cada endpoint como nome de função. O padrão do FastAPI produz nomes como `readItemsApiV1ItemsGet`. O back de referência define `generate_unique_id_function` para montar o `operationId` como `<TAG>-<nome da função>`:

```python
def _generate_unique_id(route: APIRoute) -> str:
    if not route.tags:
        return route.name
    return f'{route.tags[0]}-{route.name}'


app = FastAPI(generate_unique_id_function=_generate_unique_id)
```

Com isso, a função `read_items` em um router com `tags=['ITEMS']` vira o `operationId` `ITEMS-read_items`. O client gera a função `itemsReadItems`, as query options `itemsReadItemsOptions()` e a query key `itemsReadItemsQueryKey()`. Renomear a função ou a tag no back renomeia essas funções no front.

### Formato da API de exemplo

A feature `items` usa estes endpoints do back de referência:

- `GET /api/v1/items?offset=0&limit=10` retorna `{ "items": [...], "total": 42, "offset": 0, "limit": 10 }`, onde `total` é o número de registros sem paginação
- `POST /api/v1/items` recebe `{ "name": "...", "description": "..." | null }` e responde 201
- `GET`, `PATCH` e `DELETE` em `/api/v1/items/{item_id}`, com `item_id` inteiro. O `DELETE` responde 204, sem corpo
- Erros no formato padrão do FastAPI, `{ "detail": "..." }` ou `{ "detail": [{ "loc", "msg", "type" }] }`

## Idiomas

A interface existe em inglês e em português do Brasil. Cada idioma é um arquivo JSON em `src/locales`, com o nome da sua tag: `en-US.json` e `pt-BR.json`. Os dois têm as mesmas chaves, agrupadas por área (`common`, `errors`, `nav`) e por feature (`items`).

```json
{
  "common": { "save": "Save" },
  "items": {
    "toast": { "created": "Item created successfully" },
    "delete": { "description": "\"{{name}}\" will be permanently deleted." }
  }
}
```

Um componente lê o texto com `t("items.toast.created")`, de `useTranslation()`. Os dois arquivos entram no bundle principal, e trocar de idioma não faz nenhuma requisição.

A aplicação escolhe o idioma ao carregar a página, nesta ordem:

1. a escolha salva em `localStorage`, na chave `ui-language`;
2. o primeiro idioma de `navigator.languages` que existe na aplicação. Outra região do mesmo idioma também vale, então um browser em `pt-PT` abre em `pt-BR`;
3. `en-US`.

O item "Language" no rodapé da sidebar ("Idioma", com a tela em português) troca o idioma e salva a escolha. A troca atualiza a tela, o título da aba e o atributo `lang` do `<html>` sem recarregar a página.

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

- devolve `index.html` para qualquer caminho que não seja um arquivo, para que `/items` funcione ao recarregar a página;
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
