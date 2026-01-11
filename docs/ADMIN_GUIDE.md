# Admin Guide | Guia Administrativo

> **EN**: Complete guide for Gym Owners, Managers, and Administrators to manage gym operations, staff, members, and finances.
>
> **PT**: Guia completo para Proprietários de Ginásios, Gerentes e Administradores gerir operações do ginásio, staff, membros e finanças.

---

## Table of Contents | Índice

1. [Dashboard | Painel](#dashboard--painel)
2. [Member Management | Gestão de Membros](#member-management--gestão-de-membros)
3. [Class Scheduling | Agendamento de Aulas](#class-scheduling--agendamento-de-aulas)
4. [Staff Management | Gestão de Staff](#staff-management--gestão-de-staff)
5. [Financial Management | Gestão Financeira](#financial-management--gestão-financeira)
6. [Discipline & Rank Management | Gestão de Disciplina & Graduação](#discipline--rank-management--gestão-de-disciplina--graduação)
7. [Reports & Analytics | Relatórios & Análises](#reports--analytics--relatórios--análises)
8. [Settings | Configurações](#settings--configurações)

---

## Dashboard | Painel

### EN

Your dashboard provides real-time overview of gym operations:

| Widget | Description |
|---------|-------------|
| **Today's Attendance** | Members checked in today |
| **Upcoming Classes** | Next scheduled classes (3 hours) |
| **Active Members** | Total active membership count |
| **Revenue This Month** | Total payments received |
| **Pending Actions** | Tasks requiring attention (low stock, overdue payments) |
| **Recent Activity** | Latest check-ins, bookings, payments |

### PT

Seu painel fornece visão geral em tempo real das operações do ginásio:

| Widget | Descrição |
|---------|-------------|
| **Presença Hoje** | Membros com check-in hoje |
| **Próximas Aulas** | Próximas aulas agendadas (3 horas) |
| **Membros Ativos** | Total de contagem de associação ativa |
| **Receita Este Mês** | Total de pagamentos recebidos |
| **Ações Pendentes** | Tarefas requerendo atenção (stock baixo, pagamentos atrasados) |
| **Atividade Recente** | Últimos check-ins, reservas, pagamentos |

---

## Member Management | Gestão de Membros

### EN

#### Adding a New Member
1. Go to **Members** → **Add Member**
2. Fill in:
   - Personal details (name, email, phone)
   - Date of birth
   - Emergency contact
   - Address
3. Assign membership plan
4. Set initial status (Active/Pending)
5. Click **Create Member**

#### Member Profile
Each member has complete profile with:
- **Personal Info** - Name, contact, address, photo
- **Emergency Contact** - Name and phone number
- **Health Information** - Conditions, allergies, blood type (secure)
- **Membership** - Plan, start date, expiration, status
- **Family** - Dependents (if family billing)
- **Activity** - Check-in history, class attendance
- **Payments** - Invoice and payment history
- **Ranks** - Current grades in disciplines (if applicable)

#### Managing Member Status
| Status | Description |
|--------|-------------|
| **Active** | Member can access gym, book classes, check-in |
| **Inactive** | No access, membership expired or cancelled |
| **Suspended** | Access temporarily blocked (payment issues, conduct) |
| **Pending** | New member awaiting activation |

#### Family Billing
To add family members:
1. Open primary member profile
2. Go to **Family** tab
3. Click **Add Dependent**
4. Fill dependent details
5. Set relationship (parent/guardian)

Dependents can check-in independently but billing is tied to primary member.

#### GDPR Management
Members can request:
- **Data Export** - Download all their data
- **Account Deletion** - Anonymize and delete account
- **Consent Management** - Manage marketing preferences

These requests appear in **Settings** → **Data Protection** for review.

### PT

#### Adicionar um Novo Membro
1. Vá a **Membros** → **Adicionar Membro**
2. Preencha:
   - Detalhes pessoais (nome, email, telefone)
   - Data de nascimento
   - Contacto de emergência
   - Endereço
3. Atribua plano de associação
4. Defina estado inicial (Activo/Pendente)
5. Clique em **Criar Membro**

#### Perfil de Membro
Cada membro tem perfil completo com:
- **Informações Pessoais** - Nome, contacto, endereço, foto
- **Contacto de Emergência** - Nome e número de telefone
- **Informações de Saúde** - Condições, alergias, tipo sanguíneo (seguro)
- **Associação** - Plano, data de início, expiração, estado
- **Família** - Dependentes (se facturação familiar)
- **Atividade** - Histórico de check-in, frequência em aulas
- **Pagamentos** - Histórico de facturas e pagamentos
- **Graduações** - Graduações actuais em disciplinas (se aplicável)

#### Gerir Estado de Membro
| Estado | Descrição |
|--------|-------------|
| **Activo** | Membro pode aceder ao ginásio, reservar aulas, fazer check-in |
| **Inactivo** | Sem acesso, associação expirada ou cancelada |
| **Suspenso** - Acesso temporariamente bloqueado (problemas de pagamento, conduta) |
| **Pendente** - Novo membro aguardando activação |

#### Facturação Familiar
Para adicionar membros da família:
1. Abra o perfil do membro principal
2. Vá à aba **Família**
3. Clique em **Adicionar Dependente**
4. Preencha os detalhes do dependente
5. Defina a relação (pai/guardião)

Dependentes podem fazer check-in independentemente mas a facturação está vinculada ao membro principal.

#### Gestão GDPR
Membros podem solicitar:
- **Exportação de Dados** - Baixar todos os seus dados
- **Exclusão de Conta** - Anonimizar e excluir conta
- **Gestão de Consentimento** - Gerir preferências de marketing

Estas solicitações aparecem em **Configurações** → **Proteção de Dados** para revisão.

---

## Class Scheduling | Agendamento de Aulas

### EN

#### Creating a Single Class
1. Go to **Classes** → **Add Class**
2. Fill in:
   - **Title** - Class name
   - **Discipline** - (Optional) Link to a discipline
   - **Workout Template** - (Optional) Pre-defined workout to use
   - **Coach** - Assign trainer/instructor
   - **Location** - Room or training area
   - **Date & Time** - Start and end time
   - **Capacity** - Maximum participants
   - **Is Mandatory** - Mark if required (belt tests, assessments)
3. Click **Create Class**

#### Creating Recurring Classes (Series)
1. Go to **Classes** → **Add Series**
2. Fill in:
   - Title, Coach, Location, Capacity
   - **Start Date** - First occurrence
   - **End Date** - Last occurrence (optional)
   - **Recurrence** - Days of week (e.g., Mon, Wed, Fri)
   - **Time** - Start and end time
3. Click **Create Series**
4. System generates individual class instances

#### Class Types
| Type | Description | Use Case |
|------|-------------|-----------|
| **Regular** | Standard group class | Daily classes, open sessions |
| **Mandatory** | Required attendance | Belt tests, assessments, program requirements |
| **Assessment** | Evaluation sessions | Skill testing, fitness assessments |

#### Discipline Integration
When scheduling classes with disciplines:
- Only members enrolled in that discipline can see the class
- Rank requirements are enforced
- Attendance contributes to rank progression

#### Managing Class Conflicts
System automatically detects:
- **Coach conflicts** - Coach double-booked at same time
- **Location conflicts** - Room already booked
- **Capacity conflicts** - Overlapping classes in same location

#### Viewing Class Attendance
1. Open class details
2. Go to **Attendance** tab
3. See:
   - Booked members
   - Checked-in members
   - No-show members
   - Waitlist

### PT

#### Criar uma Aula Única
1. Vá a **Aulas** → **Adicionar Aula**
2. Preencha:
   - **Título** - Nome da aula
   - **Disciplina** - (Opcional) Vincular a uma disciplina
   - **Modelo de Treino** - (Opcional) Treino predefinido para usar
   - **Treinador** - Atribuir treinador/instrutor
   - **Localização** - Sala ou área de treino
   - **Data & Hora** - Hora de início e fim
   - **Capacidade** - Máximo de participantes
   - **É Obrigatória** - Marcar se necessário (testes de faixa, avaliações)
3. Clique em **Criar Aula**

#### Criar Aulas Recorrentes (Série)
1. Vá a **Aulas** → **Adicionar Série**
2. Preencha:
   - Título, Treinador, Localização, Capacidade
   - **Data de Início** - Primeira ocorrência
   - **Data de Fim** - Última ocorrência (opcional)
   - **Recorrência** - Dias da semana (ex: Seg, Qua, Sex)
   - **Hora** - Hora de início e fim
3. Clique em **Criar Série**
4. Sistema gera instâncias de aula individuais

#### Tipos de Aulas
| Tipo | Descrição | Caso de Uso |
|------|-------------|-----------|
| **Regular** | Aula de grupo padrão | Aulas diárias, sessões abertas |
| **Obrigatória** - Frequência requerida | Testes de faixa, avaliações, requisitos de programa |
| **Avaliação** - Sessões de avaliação | Teste de habilidades, avaliações de fitness |

#### Integração de Disciplina
Ao agendar aulas com disciplinas:
- Apenas membros inscritos nessa disciplina podem ver a aula
- Requisitos de graduação são aplicados
- Frequência contribui para progressão de graduação

#### Gerir Conflitos de Aulas
Sistema detecta automaticamente:
- **Conflitos de Treinador** - Treinador com reserva dupla no mesmo horário
- **Conflitos de Localização** - Sala já reservada
- **Conflitos de Capacidade** - Aulas sobrepostas na mesma localização

#### Ver Frequência de Aulas
1. Abra os detalhes da aula
2. Vá à aba **Presença**
3. Veja:
   - Membros reservados
   - Membros com check-in
   - Membros que não apareceram
   - Lista de espera

---

## Staff Management | Gestão de Staff

### EN

#### Adding Staff Members
1. Go to **Staff** → **Add Staff**
2. Fill in:
   - Personal details
   - Role (Coach, Trainer, Receptionist, etc.)
   - Assigned gym (if multi-gym organization)
3. Click **Create Staff**

#### Assigning Disciplines to Trainers
For coaches/trainers/instructors:
1. Open staff member profile
2. Go to **Disciplines** tab
3. Add disciplines they're qualified to teach
4. Mark as **Certified** if they have formal certification
5. Add certification date and notes

#### Managing Certifications
Track staff certifications with expiry dates:
1. Open staff profile
2. Go to **Certifications** tab
3. Add:
   - Certification name
   - Issuing organization
   - Issue date
   - Expiry date (if applicable)
4. System alerts when certifications are expiring

#### Staff Availability
1. Open staff profile
2. Go to **Availability** tab
3. Set:
   - Working days
   - Available hours
4. Use this information when scheduling classes

#### Managing Absences
1. Go to **Staff** → **Absences**
2. Staff can request or admin can create absence
3. Fill in:
   - Staff member
   - Start and end date
   - Reason (vacation, sick, training)
   - Status (pending/approved/rejected)
4. Approve or reject requests

### PT

#### Adicionar Membros de Staff
1. Vá a **Staff** → **Adicionar Staff**
2. Preencha:
   - Detalhes pessoais
   - Função (Treinador, Recepcionista, etc.)
   - Ginásio atribuído (se organização multi-ginásio)
3. Clique em **Criar Staff**

#### Atribuir Disciplinas a Treinadores
Para treinadores/instrutores:
1. Abra o perfil do membro do staff
2. Vá à aba **Disciplinas**
3. Adicione as disciplinas que estão qualificados a ensinar
4. Marque como **Certificado** se tiverem certificação formal
5. Adicione data de certificação e notas

#### Gerir Certificações
Rastreie certificações de staff com datas de expiração:
1. Abra o perfil do staff
2. Vá à aba **Certificações**
3. Adicione:
   - Nome da certificação
   - Organização emissora
   - Data de emissão
   - Data de expiração (se aplicável)
4. Sistema alerta quando certificações estão expirando

#### Disponibilidade de Staff
1. Abra o perfil do staff
2. Vá à aba **Disponibilidade**
3. Defina:
   - Dias de trabalho
   - Horários disponíveis
4. Use esta informação ao agendar aulas

#### Gerir Ausências
1. Vá a **Staff** → **Ausências**
2. O staff pode solicitar ou admin pode criar ausência
3. Preencha:
   - Membro do staff
   - Data de início e fim
   - Motivo (férias, doença, treinamento)
   - Estado (pendente/aprovado/rejeitado)
4. Aprove ou rejeite solicitações

---

## Financial Management | Gestão Financeira

### EN

#### Membership Plans
Create and manage membership plans:
1. Go to **Settings** → **Membership Plans**
2. Click **Add Plan**
3. Configure:
   - Plan name
   - Price
   - Duration (days)
   - Description
4. Click **Save**

#### Processing Payments
1. Go to **Payments** → **New Payment**
2. Fill in:
   - Member
   - Amount
   - Payment method (Multicaixa, cash, bank transfer, other)
   - Reference number (for Multicaixa)
   - Description
3. Click **Process Payment**

#### Generating Invoices
Invoices are auto-generated when payments are processed, or you can create manually:
1. Go to **Payments** → **Invoices**
2. Click **Create Invoice**
3. Add line items (membership, products, services)
4. Assign to member
5. Set due date
6. Click **Generate**

#### Discount Codes
Create promotional discounts:
1. Go to **Settings** → **Discounts**
2. Click **Add Discount**
3. Configure:
   - Code name
   - Discount type (percentage/fixed)
   - Discount value
   - Max uses (optional)
   - Valid date range
   - Is active
4. Click **Save**

#### Bank Reconciliation
1. Go to **Finance** → **Bank Reconciliation**
2. Import bank statement (CSV)
3. System auto-matches payments
4. Review unmatched items
5. Confirm reconciliation

### PT

#### Planos de Associação
Crie e gerie planos de associação:
1. Vá a **Configurações** → **Planos de Associação**
2. Clique em **Adicionar Plano**
3. Configure:
   - Nome do plano
   - Preço
   - Duração (dias)
   - Descrição
4. Clique em **Salvar**

#### Processar Pagamentos
1. Vá a **Pagamentos** → **Novo Pagamento**
2. Preencha:
   - Membro
   - Valor
   - Método de pagamento (Multicaixa, dinheiro, transferência bancária, outros)
   - Número de referência (para Multicaixa)
   - Descrição
3. Clique em **Processar Pagamento**

#### Gerar Facturas
Facturas são geradas automaticamente quando pagamentos são processados, ou você pode criar manualmente:
1. Vá a **Pagamentos** → **Facturas**
2. Clique em **Criar Fatura**
3. Adicione itens de linha (associação, produtos, serviços)
4. Atribua ao membro
5. Defina data de vencimento
6. Clique em **Gerar**

#### Códigos de Desconto
Crie descontos promocionais:
1. Vá a **Configurações** → **Descontos**
2. Clique em **Adicionar Desconto**
3. Configure:
   - Nome do código
   - Tipo de desconto (percentual/fixo)
   - Valor do desconto
   - Máximo de usos (opcional)
   - Período de validade
   - Está activo
4. Clique em **Salvar**

#### Reconciliação Bancária
1. Vá a **Finanças** → **Reconciliação Bancária**
2. Importe extrato bancário (CSV)
3. Sistema corresponde automaticamente pagamentos
4. Revise itens não correspondidos
5. Confirme reconciliação

---

## Discipline & Rank Management | Gestão de Disciplina & Graduação

### EN

#### Creating Disciplines
1. Go to **Disciplines** → **Add Discipline**
2. Fill in:
   - Discipline name (e.g., BJJ, Yoga)
   - Category
   - Description
   - Has belt/rank system? (Yes/No)
3. Click **Save**

#### Setting Up Rank Systems
For disciplines with ranks:
1. Open discipline details
2. Go to **Ranks** tab
3. Add ranks:
   - Rank name (e.g., White Belt)
   - Level (1-7)
   - Color (for UI display)
   - Requirements (time in grade, skills needed)
   - Criteria (JSON - assessment rubric)
4. Click **Save**

#### Assigning Member Ranks
1. Open member profile
2. Go to **Ranks** tab
3. Add:
   - Discipline
   - Current rank
   - Date awarded
   - Notes
4. Click **Save**

#### Promoting Members
When a member passes assessment:
1. Go to **Ranks** → **Promote Member**
2. Select member and discipline
3. Choose new rank
4. Enter promotion details (date, notes)
5. Certificate is auto-generated
6. Member receives notification

#### Deactivating a Discipline
**Warning:** This will deactivate ALL related content (classes, workouts, exercises).

1. Go to **Disciplines**
2. Select discipline
3. Click **Deactivate**
4. Confirm deactivation
5. All classes, workout templates, and exercises are hidden from members

### PT

#### Criar Disciplinas
1. Vá a **Disciplinas** → **Adicionar Disciplina**
2. Preencha:
   - Nome da disciplina (ex: BJJ, Yoga)
   - Categoria
   - Descrição
   - Tem sistema de faixa/graduação? (Sim/Não)
3. Clique em **Salvar**

#### Configurar Sistemas de Graduação
Para disciplinas com graduações:
1. Abra os detalhes da disciplina
2. Vá à aba **Graduações**
3. Adicione graduações:
   - Nome da graduação (ex: Faixa Branca)
   - Nível (1-7)
   - Cor (para exibição na UI)
   - Requisitos (tempo na graduação, habilidades necessárias)
   - Critérios (JSON - rubrica de avaliação)
4. Clique em **Salvar**

#### Atribuir Graduações a Membros
1. Abra o perfil do membro
2. Vá à aba **Graduações**
3. Adicione:
   - Disciplina
   - Graduação atual
   - Data atribuída
   - Notas
4. Clique em **Salvar**

#### Promover Membros
Quando um membro passar na avaliação:
1. Vá a **Graduações** → **Promover Membro**
2. Selecione membro e disciplina
3. Escolha nova graduação
4. Insira detalhes da promoção (data, notas)
5. Certificado é gerado automaticamente
6. Membro recebe notificação

#### Desactivar uma Disciplina
**Aviso:** Isso desactivará TODO o conteúdo relacionado (aulas, treinos, exercícios).

1. Vá a **Disciplinas**
2. Seleccione disciplina
3. Clique em **Desactivar**
4. Confirme a desactivação
5. Todas as aulas, modelos de treino e exercícios ficam ocultos para membros

---

## Reports & Analytics | Relatórios & Análises

### EN

#### Available Reports
| Report | Description | Export |
|--------|-------------|---------|
| **Attendance Report** | Check-ins by date/member | CSV, PDF |
| **Class Attendance** | Attendance per class | CSV, PDF |
| **Revenue Report** | Payments by period | CSV, PDF |
| **Member Report** | Active members, new signups | CSV, PDF |
| **Payment Aging** | Outstanding invoices | CSV, PDF |
| **Inventory Report** | Stock levels, low stock | CSV, PDF |
| **Rank Progress** | Member progression | CSV, PDF |

#### Generating Reports
1. Go to **Reports**
2. Select report type
3. Set date range and filters
4. Click **Generate**
5. Review results
6. Click **Export** to download

### PT

#### Relatórios Disponíveis
| Relatório | Descrição | Exportação |
|--------|-------------|-----------|
| **Relatório de Presença** | Check-ins por data/membro | CSV, PDF |
| **Presença em Aulas** | Frequência por aula | CSV, PDF |
| **Relatório de Receitas** | Pagamentos por período | CSV, PDF |
| **Relatório de Membros** | Membros activos, novos registos | CSV, PDF |
| **Envelhecimento de Pagamentos** - Facturas pendentes | CSV, PDF |
| **Relatório de Inventário** | Níveis de stock, stock baixo | CSV, PDF |
| **Progresso de Graduação** - Progresso de membros | CSV, PDF |

#### Gerar Relatórios
1. Vá a **Relatórios**
2. Seleccione tipo de relatório
3. Defina intervalo de datas e filtros
4. Clique em **Gerar**
5. Revise resultados
6. Clique em **Exportar** para baixar

---

## Settings | Configurações

### EN

#### Gym Profile
1. Go to **Settings** → **Gym Profile**
2. Edit:
   - Gym name
   - Address
   - Contact information
   - Logo
   - Operating hours
3. Click **Save**

#### Payment Methods
Configure accepted payment methods:
1. Go to **Settings** → **Payment Methods**
2. Enable/disable:
   - Multicaixa
   - Cash
   - Bank Transfer
   - Other
3. Configure Multicaixa settings if used

#### Locations
Manage training areas:
1. Go to **Settings** → **Locations**
2. Add locations:
   - Name
   - Capacity
   - Equipment available
   - Floor/room number
3. Set active/inactive

#### Class Types
Create reusable class templates:
1. Go to **Settings** → **Class Types**
2. Add class type:
   - Name
   - Default duration
   - Default capacity
   - Color for calendar
3. Click **Save**

### PT

#### Perfil do Ginásio
1. Vá a **Configurações** → **Perfil do Ginásio**
2. Edite:
   - Nome do ginásio
   - Endereço
   - Informações de contacto
   - Logótipo
   - Horário de funcionamento
3. Clique em **Salvar**

#### Métodos de Pagamento
Configure métodos de pagamento aceites:
1. Vá a **Configurações** → **Métodos de Pagamento**
2. Active/desactive:
   - Multicaixa
   - Dinheiro
   - Transferência Bancária
   - Outros
3. Configure definições Multicaixa se usado

#### Localizações
Gerir áreas de treino:
1. Vá a **Configurações** → **Localizações**
2. Adicione localizações:
   - Nome
   - Capacidade
   - Equipamento disponível
   - Número de andar/sala
3. Defina activo/inactivo

#### Tipos de Aulas
Crie modelos de aula reutilizáveis:
1. Vá a **Configurações** → **Tipos de Aulas**
2. Adicione tipo de aula:
   - Nome
   - Duração padrão
   - Capacidade padrão
   - Cor para calendário
3. Clique em **Salvar**

---

## FAQ | Perguntas Frequentes

### EN

**Q: What happens to classes when I deactivate a discipline?**
A: All classes, workout templates, and exercises linked to that discipline become inactive. Existing bookings are preserved but members cannot book new classes. Reactivating the discipline requires manual reactivation of content.

**Q: Can I schedule mandatory classes for specific members only?**
A: No, mandatory classes are shown to all members enrolled in that discipline. Use regular classes and communicate requirements separately.

**Q: How do I handle payments when a member is suspended?**
A: Suspended members cannot check-in or book classes. You can still record payments if they pay to reactivate their account.

**Q: What's the difference between a workout template and a gym workout?**
A: Workout templates are reusable plans stored centrally. Gym workouts are instances assigned to specific members. Use templates to ensure consistency.

**Q: How do I backup my data?**
A: Go to **Settings** → **Data Export** to download full gym data. Supabase also provides automated backups.

### PT

**P: O que acontece com as aulas quando eu desactivo uma disciplina?**
R: Todas as aulas, modelos de treino e exercícios vinculados a essa disciplina tornam-se inactivos. Reservas existentes são preservadas mas membros não podem reservar novas aulas. Reactivar a disciplina requer reactivação manual do conteúdo.

**P: Posso agendar aulas obrigatórias apenas para membros específicos?**
R: Não, aulas obrigatórias são mostradas a todos os membros inscritos nessa disciplina. Use aulas regulares e comunique requisitos separadamente.

**P: Como lido com pagamentos quando um membro está suspenso?**
R: Membros suspensos não podem fazer check-in ou reservar aulas. Você ainda pode registrar pagamentos se pagarem para reactivar a sua conta.

**P: Qual é a diferença entre um modelo de treino e um treino de ginásio?**
R: Modelos de treino são planos reutilizáveis armazenados centralmente. Treinos de ginásio são instâncias atribuídas a membros específicos. Use modelos para garantir consistência.

**P: Como faço backup dos meus dados?**
R: Vá a **Configurações** → **Exportação de Dados** para baixar dados completos do ginásio. O Supabase também fornece backups automatizados.

---

## Support | Suporte

- **GitHub Issues**: [https://github.com/clrogon/nzila-gym-manager/issues](https://github.com/clrogon/nzila-gym-manager/issues)
- **Documentation**: [README.md](../README.md)
