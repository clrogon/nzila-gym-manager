# Documentation Index | Índice de Documentação

> **EN**: Central hub for all Nzila Gym Manager documentation.
> **PT**: Hub central para toda a documentação do Gestor de Ginásios Nzila.

---

## Quick Start | Começar Rápido

| User Type | Documentation | Language |
|-----------|--------------|------------|
| **Gym Member** | [User Guide](./USER_GUIDE.md) | EN/PT |
| **Gym Owner/Manager** | [Admin Guide](./ADMIN_GUIDE.md) | EN/PT |
| **Trainer/Coach/Staff** | [Staff Guide](./STAFF_GUIDE.md) | EN/PT |
| **Developer** | [README](../README.md) | EN/PT |

---

## Documentation Categories | Categorias de Documentação

### User Guides | Guias de Usuário

| Document | Description | Who Should Read |
|----------|-------------|-----------------|
| [User Guide](./USER_GUIDE.md) | Complete member portal usage guide | All gym members |
| Topics covered | Profile management, class booking, workout tracking, rank progress, payments, check-in | |

### Admin Guides | Guias Administrativos

| Document | Description | Who Should Read |
|----------|-------------|-----------------|
| [Admin Guide](./ADMIN_GUIDE.md) | Gym management and operations guide | Gym owners, managers, administrators |
| Topics covered | Member management, class scheduling, staff management, financials, discipline/rank management, reports, settings | |

### Staff Guides | Guias de Staff

| Document | Description | Who Should Read |
|----------|-------------|-----------------|
| [Staff Guide](./STAFF_GUIDE.md) | Daily operations guide for all staff roles | Trainers, coaches, instructors, receptionists, physiotherapists, nutritionists |
| Topics covered | Check-in/out, class management, workout assignment, member progress tracking, payments, reporting | |

### Technical Documentation | Documentação Técnica

| Document | Description | Who Should Read |
|----------|-------------|-----------------|
| [README](../README.md) | Project overview, architecture, technology stack | Developers, system administrators |
| [DISCIPLINE_ENHANCEMENTS](../DISCIPLINE_ENHANCEMENTS.md) | Discipline, rank, and class enhancement features | Developers, database administrators |
| Topics covered | System architecture, security, development setup, database schema, API usage | |

---

## Feature Documentation | Documentação de Funcionalidades

### Core Features | Funcionalidades Principais

#### Authentication & Security
- Multi-tenant architecture
- Role-based access control (12 roles)
- Row-level security (RLS)
- GDPR compliance
- Audit logging

#### Member Management
- Profile management with health data
- Family/dependent relationships
- Membership plans and auto-expiration
- Check-in/out system
- Member portal

#### Class Scheduling
- Visual calendar with drag-drop
- Recurring classes with flexible rules
- Coach assignment and conflict detection
- Discipline and rank integration
- Mandatory vs regular classes
- Capacity management and waitlists

#### Training & Progress
- Workout template builder
- Exercise library
- Discipline-specific rank systems
- Promotion tracking with certificates
- Personal record tracking
- Assigned workout completion

#### Financial Management
- Payment processing (Multicaixa, cash, bank transfer)
- Invoice generation
- Discount/coupon system
- Revenue reporting
- Bank reconciliation

#### Sales CRM
- Lead pipeline (Kanban board)
- Lead source tracking
- Task assignment and follow-ups
- Conversion tracking

#### Inventory & POS
- Product catalog
- Stock management with alerts
- Point-of-sale transactions
- Asset tracking

#### Staff Management
- Role-based permissions
- Certification tracking
- Availability management
- Discipline assignments (for trainers)

#### Discipline & Rank System
- Multiple disciplines per gym
- Rank/belt level tracking
- Skill criteria and requirements
- Promotion history
- Rank-based workout filtering

---

## Role-Based Permissions | Permissões Baseadas em Funções

### EN

| Role | Member Mgmt | Classes | Workouts | Payments | Reports | Sensitive Data |
|------|---------------|----------|-----------|-----------|----------|-----------------|
| **Super Admin** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Gym Owner** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Manager** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ View |
| **Admin** | ✅ Full | ✅ Full | ✅ View | ✅ View | ✅ View |
| **Coach** | ✅ View | ✅ Full | ✅ Full | ✅ View | ❌ |
| **Trainer** | ✅ View | ✅ View | ✅ Assign | ❌ | ❌ |
| **Instructor** | ✅ View | ✅ Teach | ❌ | ❌ | ❌ |
| **Physiotherapist** | ✅ View | ✅ View | ❌ | ✅ View | ✅ Health |
| **Nutritionist** | ✅ View | ❌ | ❌ | ✅ View | ❌ |
| **Receptionist** | ✅ View | ✅ View | ❌ | ✅ Process | ❌ |
| **Staff** | ✅ View | ❌ | ❌ | ❌ | ❌ |
| **Member** | ✅ Self | ✅ Book | ✅ View Assigned | ✅ View Own | ❌ |

### PT

| Função | Gestão Membros | Aulas | Treinos | Pagamentos | Relatórios | Dados Sensíveis |
|---------|----------------|---------|----------|-------------|------------|-----------------|
| **Super Admin** | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Completo |
| **Gym Owner** | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Completo |
| **Manager** | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Visualizar |
| **Admin** | ✅ Completo | ✅ Completo | ✅ Visualizar | ✅ Visualizar | ✅ Visualizar |
| **Coach** | ✅ Visualizar | ✅ Completo | ✅ Completo | ✅ Visualizar | ❌ |
| **Personal Trainer** | ✅ Visualizar | ✅ Visualizar | ✅ Atribuir | ❌ | ❌ |
| **Instrutor** | ✅ Visualizar | ✅ Ensinar | ❌ | ❌ | ❌ |
| **Fisioterapeuta** | ✅ Visualizar | ✅ Visualizar | ❌ | ✅ Visualizar | ✅ Saúde |
| **Nutricionista** | ✅ Visualizar | ❌ | ❌ | ✅ Visualizar | ❌ |
| **Recepcionista** | ✅ Visualizar | ✅ Visualizar | ❌ | ✅ Processar | ❌ |
| **Staff** | ✅ Visualizar | ❌ | ❌ | ❌ | ❌ |
| **Member** | ✅ Próprio | ✅ Reservar | ✅ Visualizar Atribuídos | ✅ Visualizar Próprios | ❌ |

---

## Data Model Overview | Visão Geral do Modelo de Dados

### Core Entities | Entidades Principais

```
Gyms
├── Members
│   ├── Profile
│   ├── Sensitive Data (secure)
│   ├── Ranks (per discipline)
│   ├── Workouts (assigned)
│   ├── Payments
│   └── Check-ins
├── Disciplines
│   ├── Ranks (levels 1-7+)
│   ├── Classes (linked)
│   ├── Workout Templates (linked)
│   └── Exercises (linked)
├── Staff
│   ├── Roles
│   ├── Certifications
│   ├── Disciplines (qualified)
│   └── Availability
├── Classes
│   ├── Bookings
│   ├── Attendance
│   └── Series (recurring)
├── Workout Templates
│   └── Exercises (JSON array)
└── Payments
    ├── Invoices
    └── Discounts
```

---

## Common Workflows | Fluxos de Trabalho Comuns

### EN

#### Member Onboarding
1. Receptionist registers new member
2. Member receives activation email
3. Member completes profile in portal
4. Member pays for membership plan
5. Member can now check-in and book classes

#### Booking a Class
1. Member browses available classes in portal
2. Member books class (subject to capacity)
3. If full, added to waitlist
4. Receives confirmation notification
5. Checks in at class time
6. Attendance recorded by coach

#### Rank Promotion
1. Coach assesses member readiness
2. Coach schedules mandatory belt test class
3. Member books mandatory test
4. Assessment conducted
5. If passed, coach promotes member
6. Certificate auto-generated
7. Member receives notification

#### Payment Processing
1. Member receives invoice notification
2. Member pays (Multicaixa/cash/transfer)
3. Member provides proof (if applicable)
4. Receptionist verifies and processes
5. Payment recorded in system
6. Invoice marked as paid

### PT

#### Integração de Novo Membro
1. Recepcionista regista novo membro
2. Membro recebe email de activação
3. Membro completa perfil no portal
4. Membro paga plano de associação
5. Membro agora pode fazer check-in e reservar aulas

#### Reservar uma Aula
1. Membro navega aulas disponíveis no portal
2. Membro reserva aula (sujeito a capacidade)
3. Se cheia, adicionado à lista de espera
4. Recebe notificação de confirmação
5. Faz check-in no horário da aula
6. Presença registada pelo treinador

#### Promoção de Graduação
1. Treinador avalia prontidão do membro
2. Treinador agenda aula de teste de faixa obrigatória
3. Membro reserva teste obrigatório
4. Avaliação conduzida
5. Se aprovado, treinador promove membro
6. Certificado gerado automaticamente
7. Membro recebe notificação

#### Processamento de Pagamento
1. Membro recebe notificação de factura
2. Membro paga (Multicaixa/dinheiro/transferência)
3. Membro fornece comprovativo (se aplicável)
4. Recepcionista verifica e processa
5. Pagamento registado no sistema
6. Factura marcada como paga

---

## FAQ | Perguntas Frequentes

### General | Geral

**Q: What happens when a discipline is deactivated?**
A: All linked classes, workout templates, and exercises become inactive. Existing bookings are preserved. Reactivating requires manual reactivation of content.

**Q: Can a member belong to multiple disciplines?**
A: Yes, members can participate in multiple disciplines, each with its own rank progression.

**Q: How does the waitlist work?**
A: When a class is full, members can join waitlist. If someone cancels, the first waitlisted member is automatically promoted and notified.

**Q: What data is shared across gyms?**
A: No data is shared. Each gym is completely isolated (multi-tenant) with Row-Level Security enforcing separation.

**Q: How are sensitive member health data protected?**
A: Health data is stored in a separate secure table (`member_sensitive_data`) with restricted access. Only authorized roles (physiotherapists, coaches, gym owners) can view this data.

---

## Support Resources | Recursos de Suporte

### EN

| Support Type | Contact | Response Time |
|--------------|----------|----------------|
| **Support** | [GitHub Issues](https://github.com/clrogon/nzila-gym-manager/issues) | Community-based |
| **Documentation** | [Documentation Index](../DOCUMENTATION.md) | Self-service |

### PT

| Tipo de Suporte | Contacto | Tempo de Resposta |
|-----------------|----------|------------------|
| **Suporte** | [GitHub Issues](https://github.com/clrogon/nzila-gym-manager/issues) | Baseado em comunidade |
| **Documentação** | [Índice de Documentação](../DOCUMENTATION.md) | Auto-serviço |

---

## Changelog | Histórico de Alterações

| Date | Version | Changes |
|-------|----------|----------|
| 2026-01-10 | 1.0.3 | Discipline enhancements: mandatory classes, rank-based filtering, cascade deactivation |
| 2026-01-09 | 1.0.2 | Trainer discipline integration |
| 2025-12-28 | 1.0.1 | Security hardening, RLS improvements |
| 2025-12-01 | 1.0.0 | Initial release with full feature set |

---

**Last Updated | Última Actualização**: January 10, 2026
