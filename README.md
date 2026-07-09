# 📋 Ctrl-Licitação

> Plataforma web para gestão de licitações e contratos públicos — Lei 14.133/2021

Sistema completo de gestão de contratos públicos, funcionando como um **Diário de Obras/Serviços Inteligente** com controle de acesso por perfil (RBAC), módulos de execução física, faturamento, workflow e auditoria.

---

## 🚀 Funcionalidades

- **Inteligência Pré-Contratual** — Upload de editais, análise com IA (Anthropic Claude), painel de decisão Go/No-Go
- **Diário de Contrato** — Avanço físico diário, milestones, upload de fotos, registros imutáveis após 24h
- **Medições & Faturamento** — Boletins de medição, upload de NF, cronômetro de reajuste contratual anual
- **Central de Ações** — Inbox de tarefas (estilo Kanban), @menções, trilha completa de auditoria

## 👥 Perfis de Acesso

| Perfil | Acesso |
|---|---|
| **Diretoria** | Total — aprovação Go/No-Go, exclusão, auditoria |
| **Coordenador** | Gestão dos contratos vinculados, aprovação de medições |
| **Operador de Campo** | Apenas diário físico (sem acesso a valores) |
| **Operador Administrativo** | Apenas faturamento/medições (sem diário de campo) |

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Banco de dados:** PostgreSQL (Supabase) via Prisma ORM
- **Autenticação:** NextAuth.js v5 (JWT)
- **IA:** Anthropic Claude Haiku (opcional)
- **Estilização:** Vanilla CSS com design system dark theme

---

## ⚙️ Instalação

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)
- (Opcional) Conta na [Anthropic](https://console.anthropic.com) para análise de IA

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/Poneyzada/Ctrl-licitacoes-app.git
cd Ctrl-licitacoes-app

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Crie as tabelas no banco
npx prisma db push

# 5. Popule com dados de demonstração
npm run db:seed

# 6. Inicie o servidor
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🔑 Usuários de Demonstração

Após rodar o seed, use estes logins (senha: `123456`):

| Email | Perfil |
|---|---|
| `diretoria@ctrl.com` | Diretoria |
| `coordenador@ctrl.com` | Coordenador |
| `campo@ctrl.com` | Operador de Campo |
| `adm@ctrl.com` | Operador Administrativo |

---

## 🌐 Deploy (Vercel + Supabase)

1. Faça fork/clone do repositório
2. Crie um projeto no [Vercel](https://vercel.com) e conecte ao GitHub
3. Adicione as variáveis de ambiente no painel do Vercel
4. O deploy é automático a cada `git push`

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── dashboard/          # Páginas autenticadas
│   │   ├── page.tsx        # Dashboard geral
│   │   ├── licitacoes/     # Módulo pré-contratual
│   │   ├── contratos/      # Gestão de contratos
│   │   ├── tarefas/        # Inbox de tarefas
│   │   └── auditoria/      # Trilha de auditoria
│   ├── api/                # API Routes
│   └── login/              # Autenticação
├── components/             # Componentes reutilizáveis
├── lib/                    # Utilitários (auth, prisma, rbac)
└── types/                  # Tipos TypeScript
prisma/
├── schema.prisma           # Schema do banco de dados
└── seed.ts                 # Dados de demonstração
```

---

## 📄 Licença

Projeto proprietário — todos os direitos reservados.
