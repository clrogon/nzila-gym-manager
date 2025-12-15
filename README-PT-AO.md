# Nzila Gym Manager

> Um sistema de gestão de ginásios multi-tenant de nível profissional, construído com tecnologias web modernas. Desenvolvido para academias de artes marciais, boxes de CrossFit e centros de fitness em Angola e além.

[![Licença: MIT](https://img.shields.io/badge/Licença-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com)

## 🎯 Visão Geral

**Nzila Gym Manager** é uma plataforma SaaS completa para gestão de instalações desportivas modernas. Construído com segurança, escalabilidade e experiência do utilizador como princípios fundamentais, o Nzila trata de tudo, desde check-ins de membros até relatórios financeiros, agendamento de aulas até promoções de graduação.

**Demo ao Vivo**: [nzila-gym-manager.vercel.app](https://nzila-gym-manager.vercel.app)

---

## ✨ Funcionalidades Principais

### **Gestão de Membros**
- Perfis completos de membros com foto, contactos de emergência, condições de saúde
- Facturação familiar com relações de tutor para menores
- Tratamento de dados em conformidade com GDPR com rastreamento de consentimento
- Planos de associação com rastreamento automático de expiração
- Gestão de estado (Activo, Suspenso, Pendente)

### **Sistema de Check-In**
- Registo rápido de entrada/saída de membros
- Rastreamento de presença em tempo real
- Modo quiosque para auto-atendimento (em breve)

### **Agendamento de Aulas & Calendário**
- Calendário visual com criação de aulas por arrastar e largar
- Suporte para aulas recorrentes com regras de recorrência flexíveis
- Atribuição de treinador com detecção automática de conflitos
- Agendamento baseado em localização (múltiplas salas/áreas)
- Biblioteca de tipos de aula (Muay Thai, BJJ, CrossFit, etc.)
- Sistema de reserva de membros com limites de capacidade

### **Treino & Progresso**
- Construtor de modelos de treino com biblioteca de exercícios
- Sistema de graduação/faixa específico por disciplina
- Histórico de promoções com rastreamento de certificados
- Registos de desempenho e recordes pessoais
- Rastreamento de treinos atribuídos

### **Gestão Financeira**
- Processamento de pagamentos (Multicaixa, dinheiro, transferência bancária)
- Geração de facturas com itens de linha
- Sistema de descontos/cupões
- Relatórios de receitas e análises
- Consolidação de facturação familiar

### **CRM de Vendas**
- Gestão de pipeline de leads (quadro Kanban)
- Rastreamento de fonte de leads (Instagram, Facebook, referência, walk-in)
- Atribuição de tarefas para seguimento
- Rastreamento de conversão para membros

### **Inventário & PDV**
- Catálogo de produtos (suplementos, equipamento, vestuário)
- Gestão de stock com alertas de stock baixo
- Transacções de ponto de venda
- Rastreamento de activos (manutenção de equipamento)

### **Gestão de Staff**
- Controlo de acesso baseado em funções (5 funções: Super Admin, Proprietário de Ginásio, Admin, Staff, Membro)
- Certificações de staff com rastreamento de expiração
- Gestão de ausências/licenças
- Agendamento e disponibilidade de treinadores

### **Auditoria & Conformidade**
- Registos de auditoria imutáveis para operações sensíveis
- Funcionalidades de protecção de dados GDPR
- Segurança ao nível de campo (dados sensíveis restritos a admins)
- Padrões de visualização segura para dados de membros

---

## 🏗️ Arquitectura

### **Design Multi-Tenant**
O Nzila é arquitectado como um verdadeiro SaaS multi-tenant:
- Cada ginásio é um tenant isolado com dados separados
- Row-Level Security (RLS) impõe limites de tenant
- Função Super Admin fornece gestão a nível de plataforma
- Utilizadores podem pertencer a múltiplos ginásios com funções diferentes

### **Stack Tecnológico**

| Componente | Tecnologia | Propósito |
|-----------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Componentes UI type-safe |
| **Ferramenta de Build** | Vite | Desenvolvimento rápido + HMR |
| **Estilização** | Tailwind CSS + Flowbite | Sistema de design utility-first |
| **Backend** | Supabase | PostgreSQL + Auth + Edge Functions |
| **Gestão de Estado** | TanStack Query (React Query) | Cache de estado do servidor |
| **Roteamento** | React Router v6 | Navegação client-side |
| **Validação** | Zod | Validação de esquema |
| **Tratamento de Datas** | date-fns | Datas com consciência de fuso horário |

### **Modelo de Segurança**

**Hierarquia de Funções**:
1. **Super Admin** - Acesso a toda a plataforma, integração de proprietários de ginásios
2. **Proprietário de Ginásio** - Gestão completa do ginásio, facturação, atribuição de staff
3. **Admin** - Gestão de operações, dados de membros, finanças
4. **Staff** - Check-ins, gestão de aulas, interacções com membros
5. **Membro** - Perfil de auto-serviço, reservas de aulas (em breve)

**Funcionalidades de Segurança**:
- Row-Level Security (RLS) em todas as tabelas da base de dados
- Queries parametrizadas para prevenir SQL injection
- Validação Zod em todas as entradas
- Tratamento de dados em conformidade com GDPR
- Registo de auditoria para operações sensíveis
- Restrições ao nível de campo (dados de saúde apenas para admins)

---

## 🚀 Começar

### **Pré-requisitos**
- Node.js 18+ (LTS recomendado)
- npm ou pnpm
- Conta Supabase ([supabase.com](https://supabase.com))

### **Instalação**

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/clrogon/nzila-gym-manager.git
   cd nzila-gym-manager
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configuração de ambiente**
   ```bash
   cp .env.example .env
   ```

   Editar `.env` com as suas credenciais Supabase:
   ```env
   VITE_SUPABASE_URL=https://seu-projecto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```

4. **Configuração da base de dados**
   
   Executar migrações no Editor SQL do Supabase Studio:
   - Navegar para o seu projecto Supabase
   - Ir para Editor SQL
   - Executar migrações de `supabase/migrations/` por ordem

5. **Preencher dados de teste (opcional)**
   
   Implementar e invocar a Edge Function:
   ```bash
   # Via Supabase Studio > Edge Functions > seed-test-users > Invoke
   ```
   
   Isto cria 10 utilizadores de teste (2 por função) com credenciais:
   - Email: `[função]@nzila.ao` (ex: `admin1@nzila.ao`)
   - Senha: `!12345678#`

6. **Iniciar servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   
   Aceder à aplicação em `http://localhost:5173`

---

## 📁 Estrutura do Projecto

```
nzila-gym-manager/
├── src/
│   ├── components/        # Componentes UI reutilizáveis
│   │   ├── calendar/      # Calendário e agendamento
│   │   ├── members/       # Gestão de membros
│   │   ├── training/      # Treinos e exercícios
│   │   └── ui/            # Componentes UI base (shadcn/ui)
│   ├── pages/             # Páginas de rota
│   │   ├── Dashboard/     # Dashboard principal
│   │   ├── Members/       # Directório de membros
│   │   ├── Calendar/      # Agendamento de aulas
│   │   ├── Training/      # Gestão de treinos
│   │   ├── Financials/    # Pagamentos e facturas
│   │   └── Leads/         # CRM de vendas
│   ├── hooks/             # Hooks React personalizados
│   ├── lib/               # Funções utilitárias
│   │   ├── supabase.ts    # Cliente Supabase
│   │   └── api/           # Camada de serviço API
│   ├── contexts/          # Provedores de contexto React
│   └── types/             # Definições de tipo TypeScript
├── supabase/
│   ├── migrations/        # Versões de esquema da base de dados
│   └── functions/         # Edge Functions (serverless)
├── public/                # Activos estáticos
└── workflows/             # CI/CD GitHub Actions
```

---

## 🔐 Segurança & Conformidade

### **Conformidade GDPR**
- Rastreamento de consentimento explícito (`gdpr_consent_at`)
- Suporte para anonimização de dados (`gdpr_anonymized_at`)
- Direito ao apagamento (eliminar dados de membros)
- Trilha de auditoria para acesso a dados

### **Protecção de Dados**
- Campos sensíveis (condições de saúde, contactos de emergência) restritos a funções admin
- Visualizações seguras para dados de membros (visualização `members_safe`)
- Conexões encriptadas (Supabase impõe TLS)
- Sem PII em logs ou mensagens de erro

### **Autenticação**
- Supabase Auth com email/senha
- Gestão de sessão baseada em JWT
- Actualização automática de sessão
- Fluxo seguro de reset de senha

---

## 🛠️ Desenvolvimento

### **Scripts Disponíveis**

```bash
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Pré-visualizar build de produção
npm run lint         # Executar ESLint
npm run type-check   # Validação TypeScript
```

### **Padrões de Código**
- Modo strict do TypeScript activado
- ESLint + Prettier para formatação de código
- Commits convencionais encorajados
- Hooks de pré-commit com Husky (opcional)

### **Testes**
```bash
npm run test         # Executar testes unitários Vitest
npm run test:ui      # Modo UI Vitest
```

---

## 🤝 Contribuir

Acolhemos contribuições! Por favor, leia [CONTRIBUTING.md](CONTRIBUTING.md) para:
- Código de Conduta
- Fluxo de trabalho de desenvolvimento
- Processo de pull request
- Padrões de codificação

---

## 📄 Licença

Este projecto está licenciado sob a Licença MIT - veja o ficheiro [LICENSE](LICENSE) para detalhes.

---

## 🆘 Suporte

- **Documentação**: [GitHub Wiki](https://github.com/clrogon/nzila-gym-manager/wiki)
- **Problemas**: [GitHub Issues](https://github.com/clrogon/nzila-gym-manager/issues)
- **Discussões**: [GitHub Discussions](https://github.com/clrogon/nzila-gym-manager/discussions)
- **Email**: suporte@nzila.ao

---

## 🙏 Agradecimentos

- Construído com [Supabase](https://supabase.com) - Alternativa Firebase open-source
- Componentes UI de [Flowbite](https://flowbite.com) e [shadcn/ui](https://ui.shadcn.com)
- Ícones de [Lucide React](https://lucide.dev)
- Inspirado pela comunidade de fitness em Luanda, Angola

---

## 🗺️ Roteiro

Veja [ROADMAP.md](ROADMAP.md) para funcionalidades planeadas e cronograma.

**Funcionalidades em desenvolvimento**:
- Aplicação móvel (React Native)
- Portal de auto-serviço para membros
- Integração WhatsApp para lembretes
- Dashboard de análises avançadas
- Suporte para cadeias de ginásios multi-localização

---

**Feito com ❤️ para a comunidade fitness**
