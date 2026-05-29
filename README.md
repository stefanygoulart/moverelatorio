# Move Reports — Gerador Automático de Relatórios Meta Ads

Sistema estilo Dashgo para gerar relatórios completos das suas contas de anúncio do Meta Ads automaticamente.

---

## O que o sistema faz

- Login com conta do Facebook/Meta via OAuth
- Lista todas as suas contas de anúncio automaticamente
- Seleciona período e quais contas gerar
- Busca dados reais da API do Meta (spend, leads, CPA, CTR, CPM, CPC, ROAS, alcance, impressões, etc.)
- Gera relatório completo com 3 páginas por conta:
  - Resumo Geral com todos os KPIs
  - Tabela de campanhas com status automático (Eficiente / Médio / Alto CPA)
  - Análise visual com gráficos
- Exporta como PDF com um clique (Imprimir → Salvar como PDF)

---

## Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- [Git](https://git-scm.com)
- Conta no [GitHub](https://github.com) (gratuita)
- Conta na [Vercel](https://vercel.com) (gratuita)
- Conta no [Meta for Developers](https://developers.facebook.com) (gratuita)

---

## PASSO 1 — Criar o App no Meta

1. Acesse https://developers.facebook.com/apps
2. Clique em **"Criar app"**
3. Escolha **"Outro"** → **"Business"**
4. Preencha o nome (ex: "Move Reports") e clique em Criar
5. No painel do app, vá em **Configurações → Básico**
6. Anote o **ID do app** e o **Segredo do app** (clique em "Mostrar")
7. No campo **"URIs de redirecionamento OAuth válidos"**, adicione:
   ```
   http://localhost:3000/api/auth/callback/facebook
   https://SEU-PROJETO.vercel.app/api/auth/callback/facebook
   ```
8. Vá em **Produtos → Adicionar produto → Marketing API** e ative
9. Em **Marketing API → Permissões**, solicite:
   - `ads_read`
   - `ads_management`
   - `business_management`
   - `read_insights`

---

## PASSO 2 — Instalar e rodar localmente

```bash
# Clone o projeto
git clone https://github.com/SEU_USUARIO/move-reports.git
cd move-reports

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

Abra o arquivo `.env.local` e preencha:

```env
META_APP_ID=SEU_APP_ID
META_APP_SECRET=SEU_APP_SECRET
NEXTAUTH_SECRET=qualquer_string_aleatoria_longa_aqui
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_AGENCY_NAME=Move Marketing
NEXT_PUBLIC_AGENCY_TAGLINE=Business Intelligence
```

```bash
# Rode o projeto
npm run dev
```

Acesse http://localhost:3000

---

## PASSO 3 — Subir no GitHub

```bash
git init
git add .
git commit -m "Move Reports - inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/move-reports.git
git push -u origin main
```

---

## PASSO 4 — Deploy na Vercel (gratuito)

1. Acesse https://vercel.com e faça login com GitHub
2. Clique em **"New Project"**
3. Importe o repositório `move-reports`
4. Na seção **"Environment Variables"**, adicione as mesmas variáveis do `.env.local`:
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → coloque a URL que a Vercel vai gerar (ex: `https://move-reports.vercel.app`)
   - `NEXT_PUBLIC_AGENCY_NAME`
   - `NEXT_PUBLIC_AGENCY_TAGLINE`
5. Clique em **"Deploy"**
6. Após o deploy, copie a URL gerada e atualize `NEXTAUTH_URL` nas variáveis da Vercel

---

## PASSO 5 — Atualizar URI no Meta

Volte no Meta for Developers → Configurações do app → Login do Facebook → URIs de redirecionamento OAuth válidos.

Adicione a URL da Vercel:
```
https://SEU-PROJETO.vercel.app/api/auth/callback/facebook
```

---

## Como usar

1. Acesse o site e clique em **"Entrar com Facebook / Meta"**
2. Autorize as permissões solicitadas
3. Selecione o **período** do relatório
4. Selecione as **contas de anúncio** que deseja gerar
5. Clique em **"Gerar relatórios"**
6. Aguarde o carregamento dos dados (alguns segundos por conta)
7. Clique em **"Imprimir / Salvar PDF"** para exportar

---

## Personalização

Para mudar o nome e cores da agência:

- **Nome**: edite `NEXT_PUBLIC_AGENCY_NAME` no `.env.local`
- **Cores**: edite `brand` em `tailwind.config.js`
- **Logo**: substitua no componente `src/components/report/ReportView.tsx`

---

## Estrutura do projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # OAuth Meta
│   │   └── meta/
│   │       ├── accounts/         # Lista contas
│   │       └── insights/         # Dados das campanhas
│   ├── login/                    # Tela de login
│   ├── dashboard/                # Seleção de contas
│   └── report/                   # Geração e visualização
├── components/
│   └── report/
│       └── ReportView.tsx        # Componente do relatório completo
├── lib/
│   └── meta.ts                   # Toda a lógica da API do Meta
└── types/
    └── next-auth.d.ts
```

---

## Dúvidas frequentes

**O app do Meta precisa de aprovação?**
Para uso próprio (suas contas), não precisa. Para outros usuários, precisaria solicitar aprovação das permissões avançadas no Meta.

**Posso adicionar mais gestores usando o sistema?**
Sim — cada gestor faz login com a própria conta Meta e vê apenas as contas dele.

**Os dados ficam salvos?**
Não. O sistema busca os dados em tempo real da API do Meta a cada geração. Não há banco de dados.
