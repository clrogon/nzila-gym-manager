# Nzila Gym Manager | Gestor de Ginásios Nzila

> **EN**: A production-grade, multi-tenant gym management system built with modern web technologies. Designed for martial arts studios, CrossFit boxes, and fitness centers in Angola and beyond.

> **PT**: Um sistema de gestão de ginásios multi-tenant de nível profissional, construído com tecnologias web modernas. Desenvolvido para academias de artes marciais, boxes de CrossFit e centros de fitness em Angola e além.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com)

**Live Demo | Demo ao Vivo**: [nzila-gym-manager.vercel.app](https://nzila-gym-manager.vercel.app)

---

## 🎯 Overview | Visão Geral

### EN-US

**Nzila Gym Manager** is a comprehensive SaaS platform for managing modern fitness facilities. Built with security, scalability, and user experience as core principles, Nzila handles everything from member check-ins to financial reporting, class scheduling to rank promotions.

### PT-AO/PT-PT

**Nzila Gym Manager** é uma plataforma SaaS completa para gestão de instalações desportivas modernas. Construído com segurança, escalabilidade e experiência do utilizador como princípios fundamentais, o Nzila trata de tudo, desde check-ins de membros até relatórios financeiros, agendamento de aulas até promoções de graduação.

---

## ✨ Core Features | Funcionalidades Principais

### Member Management | Gestão de Membros
- **EN**: Complete profiles with photo, emergency contacts, health conditions • Family billing with tutor relationships • GDPR-compliant data handling • Membership plans with auto-expiration • Status management (Active, Suspended, Pending)
- **PT**: Perfis completos com foto, contactos de emergência, condições de saúde • Facturação familiar com relações de tutor • Tratamento de dados em conformidade com GDPR • Planos de associação com auto-expiração • Gestão de estado (Activo, Suspenso, Pendente)

### Check-In System | Sistema de Check-In
- **EN**: Fast member check-in/out logging • Real-time attendance tracking • Kiosk mode for self-service (coming soon)
- **PT**: Registo rápido de entrada/saída de membros • Rastreamento de presença em tempo real • Modo quiosque para auto-atendimento (em breve)

### Class Scheduling & Calendar | Agendamento de Aulas & Calendário
- **EN**: Visual calendar with drag-drop class creation • Recurring classes with flexible rules • Coach assignment with conflict detection • Location-based scheduling • Class type library • Member booking with capacity limits
- **PT**: Calendário visual com criação de aulas por arrastar e largar • Aulas recorrentes com regras flexíveis • Atribuição de treinador com detecção de conflitos • Agendamento baseado em localização • Biblioteca de tipos de aula • Reserva de membros com limites de capacidade

### Training & Progress | Treino & Progresso
- **EN**: Workout template builder with exercise library • Discipline-specific rank/belt system • Promotion history with certificates • Performance records and personal bests • Assigned workout tracking
- **PT**: Construtor de modelos de treino com biblioteca de exercícios • Sistema de graduação/faixa específico por disciplina • Histórico de promoções com certificados • Registos de desempenho e recordes pessoais • Rastreamento de treinos atribuídos

### Financial Management | Gestão Financeira
- **EN**: Payment processing (Multicaixa, cash, bank transfer) • Invoice generation with line items • Discount/coupon system • Revenue reporting and analytics • Family billing consolidation
- **PT**: Processamento de pagamentos (Multicaixa, dinheiro, transferência bancária) • Geração de facturas com itens de linha • Sistema de descontos/cupões • Relatórios de receitas e análises • Consolidação de facturação familiar

### Sales CRM | CRM de Vendas
- **EN**: Lead pipeline management (Kanban board) • Lead source tracking • Task assignment for follow-ups • Conversion tracking to members
- **PT**: Gestão de pipeline de leads (quadro Kanban) • Rastreamento de fonte de leads • Atribuição de tarefas para seguimento • Rastreamento de conversão para membros

### Inventory & POS | Inventário & PDV
- **EN**: Product catalog (supplements, gear, apparel) • Stock management with low-stock alerts • Point-of-sale transactions • Asset tracking (equipment maintenance)
- **PT**: Catálogo de produtos (suplementos, equipamento, vestuário) • Gestão de stock com alertas de stock baixo • Transacções de ponto de venda • Rastreamento de activos (manutenção de equipamento)

### Staff Management | Gestão de Staff
- **EN**: Role-based access control (5 roles) • Staff certifications with expiry tracking • Absence/leave management • Coach scheduling and availability
- **PT**: Controlo de acesso baseado em funções (5 funções) • Certificações de staff com rastreamento de expiração • Gestão de ausências/licenças • Agendamento e disponibilidade de treinadores

### Audit & Compliance | Auditoria & Conformidade
- **EN**: Immutable audit logs for sensitive operations • GDPR data protection features • Field-level security • Secure view patterns for member data
- **PT**: Registos de auditoria imutáveis para operações sensíveis • Funcionalidades de protecção de dados GDPR • Segurança ao nível de campo • Padrões de visualização segura para dados de membros

---

## 🏗️ Architecture | Arquitectura

### Multi-Tenant Design | Design Multi-Tenant

**EN**: Nzila is architected as a true multi-tenant SaaS with isolated gym data, Row-Level Security (RLS) enforcement, Super Admin platform management, and support for users belonging to multiple gyms with different roles.

**PT**: O Nzila é arquitectado como um verdadeiro SaaS multi-tenant com dados de ginásio isolados, imposição de Row-Level Security (RLS), gestão de plataforma Super Admin e suporte para utilizadores pertencentes a múltiplos ginásios com funções diferentes.

### Technology Stack | Stack Tecnológico

| Component | Technology | Purpose EN | Propósito PT |
|-----------|-----------|------------|--------------|
| **Frontend** | React 18 + TypeScript | Type-safe UI components | Componentes UI type-safe |
| **Build Tool** | Vite | Fast development + HMR | Desenvolvimento rápido + HMR |
| **Styling** | Tailwind CSS + Flowbite | Utility-first design system | Sistema de design utility-first |
| **Backend** | Supabase | PostgreSQL + Auth + Edge Functions | PostgreSQL + Auth + Edge Functions |
| **State Management** | TanStack Query | Server state caching | Cache de estado do servidor |
| **Routing** | React Router v6 | Client-side navigation | Navegação client-side |
| **Validation** | Zod | Schema validation | Validação de esquema |
| **Date Handling** | date-fns | Timezone-aware dates | Datas com consciência de fuso horário |

### Security Model | Modelo de Segurança

**Role Hierarchy | Hierarquia de Funções**:
1. **Super Admin** - EN: Platform-wide access, gym owner onboarding | PT: Acesso a toda a plataforma, integração de proprietários
2. **Gym Owner** - EN: Full gym management, billing, staff assignment | PT: Gestão completa do ginásio, facturação, atribuição de staff
3. **Admin** - EN: Operations management, member data, financials | PT: Gestão de operações, dados de membros, finanças
4. **Staff** - EN: Check-ins, class management, member interactions | PT: Check-ins, gestão de aulas, interacções com membros
5. **Member** - EN: Self-service profile, class bookings (coming soon) | PT: Perfil de auto-serviço, reservas de aulas (em breve)

---

## 🚀 Getting Started | Começar

### Prerequisites | Pré-requisitos
- Node.js 18+ (LTS recommended | LTS recomendado)
- npm or pnpm
- Supabase account ([supabase.com](https://supabase.com))

### Installation | Instalação

**1. Clone the repository | Clonar o repositório**
```bash
git clone https://github.com/clrogon/nzila-gym-manager.git
cd nzila-gym-manager
```

**2. Install dependencies | Instalar dependências**
```bash
npm install
```

**3. Environment setup | Configuração de ambiente**
```bash
cp .env.example .env
# EN: Edit .env with your Supabase credentials
# PT: Editar .env com as suas credenciais Supabase
```

**4. Database setup | Configuração da base de dados**

**EN**: Run migrations in Supabase Studio SQL Editor - Navigate to your project, go to SQL Editor, execute migrations from `supabase/migrations/` in order.

**PT**: Executar migrações no Editor SQL do Supabase Studio - Navegar para o seu projecto, ir para Editor SQL, executar migrações de `supabase/migrations/` por ordem.

**5. Seed test data (optional) | Preencher dados de teste (opcional)**

**EN**: Deploy and invoke the Edge Function via Supabase Studio > Edge Functions > seed-test-users > Invoke. This creates 10 test users (2 per role) with credentials: `[role]@nzila.ao` / Password: `!12345678#`

**PT**: Implementar e invocar a Edge Function via Supabase Studio > Edge Functions > seed-test-users > Invoke. Isto cria 10 utilizadores de teste (2 por função) com credenciais: `[função]@nzila.ao` / Senha: `!12345678#`

**6. Start development server | Iniciar servidor de desenvolvimento**
```bash
npm run dev
# Access at | Aceder em: http://localhost:5173
```

---

## 📁 Project Structure | Estrutura do Projecto

```
nzila-gym-manager/
├── src/
│   ├── components/        # Reusable UI components | Componentes UI reutilizáveis
│   ├── pages/             # Route pages | Páginas de rota
│   ├── hooks/             # Custom React hooks | Hooks React personalizados
│   ├── lib/               # Utility functions | Funções utilitárias
│   ├── contexts/          # React context providers | Provedores de contexto React
│   └── types/             # TypeScript type definitions | Definições de tipo TypeScript
├── supabase/
│   ├── migrations/        # Database schema versions | Versões de esquema da base de dados
│   └── functions/         # Edge Functions (serverless)
├── public/                # Static assets | Activos estáticos
└── workflows/             # GitHub Actions CI/CD
```

---

## 🔐 Security & Compliance | Segurança & Conformidade

### GDPR Compliance | Conformidade GDPR
- **EN**: Explicit consent tracking • Data anonymization support • Right to erasure • Audit trail for data access
- **PT**: Rastreamento de consentimento explícito • Suporte para anonimização de dados • Direito ao apagamento • Trilha de auditoria para acesso a dados

### Data Protection | Protecção de Dados
- **EN**: Sensitive fields restricted to admin roles • Secure views for member data • Encrypted connections (TLS) • No PII in logs
- **PT**: Campos sensíveis restritos a funções admin • Visualizações seguras para dados de membros • Conexões encriptadas (TLS) • Sem PII em logs

---

## 🛠️ Development | Desenvolvimento

### Available Scripts | Scripts Disponíveis

```bash
npm run dev          # Start development | Iniciar desenvolvimento
npm run build        # Production build | Build de produção
npm run preview      # Preview build | Pré-visualizar build
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation | Validação TypeScript
npm run test         # Run tests | Executar testes
```

---

## 🤝 Contributing | Contribuir

**EN**: We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for our development workflow, coding standards, and pull request process.

**PT**: Acolhemos contribuições! Por favor, leia [CONTRIBUTING.md](CONTRIBUTING.md) para o nosso fluxo de trabalho de desenvolvimento, padrões de codificação e processo de pull request.

---

## 📄 License | Licença

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

Este projecto está licenciado sob a Licença MIT - veja o ficheiro [LICENSE](LICENSE) para detalhes.

---

## 🆘 Support | Suporte

- **Documentation | Documentação**: [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/clrogon/nzila-gym-manager/issues)
- **Discussions | Discussões**: [GitHub Discussions](https://github.com/clrogon/nzila-gym-manager/discussions)
- **Email**: support@nzila.ao | suporte@nzila.ao

---

## 🙏 Acknowledgments | Agradecimentos

- Built with [Supabase](https://supabase.com) - Open-source Firebase alternative
- UI components from [Flowbite](https://flowbite.com) and [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide React](https://lucide.dev)
- **EN**: Inspired by the fitness community in Luanda, Angola
- **PT**: Inspirado pela comunidade fitness em Luanda, Angola

---

## 🗺️ Roadmap | Roteiro

**EN**: See [ROADMAP.md](ROADMAP.md) for planned features and timeline.

**PT**: Veja [ROADMAP.md](ROADMAP.md) para funcionalidades planeadas e cronograma.

**Upcoming | Em desenvolvimento**:
- Mobile app (React Native) | Aplicação móvel
- Member self-service portal | Portal de auto-serviço para membros
- WhatsApp integration | Integração WhatsApp
- Advanced analytics dashboard | Dashboard de análises avançadas
- Multi-location gym chains | Cadeias de ginásios multi-localização

---

**Made with ❤️ for the fitness community | Feito com ❤️ para a comunidade fitness**
