# Nzila Gym Manager Roadmap | Roteiro

## 📊 Current Version | Versão Actual: 1.0.1 (January 2025)

---

## 🎯 Core Features | Funcionalidades Principais

### 01. Pagamentos Digitais | Digital Payments
Processamento seguro e imediato. O sistema valida o pagamento e liberta a entrada na hora.
> Secure and immediate processing. The system validates payment and releases entry instantly.

- [x] Multicaixa Express integration | Integração Multicaixa Express
- [x] Real-time payment validation | Validação de pagamento em tempo real
- [x] Automatic access release | Liberação automática de acesso
- [x] Multiple payment methods | Múltiplos métodos de pagamento

### 02. Controlo de Entradas | Entry Control
O Nzila conecta-se diretamente aos equipamentos físicos do seu ginásio para garantir segurança total.
> Nzila connects directly to your gym's physical equipment to ensure total security.

**Biometria Facial | Facial Biometrics**
Compatível com Hikvision e ZKTeco para entrada sem contacto.
> Compatible with Hikvision and ZKTeco for contactless entry.

**Sincronização Offline | Offline Sync**
O torniquete continua a funcionar mesmo se a internet cair.
> The turnstile continues to work even if the internet goes down.

**Cartões RFID | RFID Cards**
Gestão simples de cartões de acesso para staff e membros.
> Simple access card management for staff and members.

- [x] Turnstile/hardware integration | Integração com torniquetes
- [x] Automatic overdue blocking | Bloqueio automático por atraso
- [x] Biometric support (Hikvision, ZKTeco) | Suporte biométrico facial
- [x] RFID card management | Gestão de cartões RFID
- [x] Offline sync capability | Sincronização offline

### 03. Relatórios Financeiros | Financial Reports
Saiba exatamente quanto faturou hoje. Mapas de caixa, previsões e histórico de vendas.
> Know exactly how much you invoiced today. Cash maps, forecasts, and sales history.

- [x] Daily/monthly revenue reports | Relatórios de receita diária/mensal
- [x] Cash flow dashboards | Dashboards de fluxo de caixa
- [x] PDF export | Exportação PDF
- [x] Bank reconciliation | Reconciliação bancária
- [ ] Revenue forecasting | Previsão de receitas

### 04. Gestão de Membros | Member Management
Ficha completa do aluno: histórico de pagamentos, plano de treino e dados de saúde.
> Complete member profile: payment history, training plan, and health data.

- [x] Complete member profiles | Perfis completos de membros
- [x] Payment history tracking | Rastreamento de histórico de pagamentos
- [x] Training plan assignment | Atribuição de plano de treino
- [x] Health data management (secure) | Gestão de dados de saúde (seguro)
- [x] Family/dependent relationships | Relações familiares/dependentes

### 05. Renovações Automáticas | Automatic Renewals
Alertas automáticos via SMS e WhatsApp antes da mensalidade expirar para aumentar a retenção.
> Automatic alerts via SMS and WhatsApp before membership expires to increase retention.

- [x] Expiration tracking | Rastreamento de expiração
- [ ] SMS notifications | Notificações SMS
- [ ] WhatsApp integration | Integração WhatsApp
- [ ] Email reminders | Lembretes por email
- [ ] Configurable reminder periods | Períodos de lembrete configuráveis

### 06. Multi-Filial | Multi-Branch
Gira várias unidades (Luanda, Talatona, Benguela) num único painel administrativo.
> Manage multiple locations (Luanda, Talatona, Benguela) from a single admin dashboard.

- [x] Multiple gym management | Gestão de múltiplos ginásios
- [x] Unified admin dashboard | Painel administrativo unificado
- [x] Per-location permissions | Permissões por localização
- [ ] Cross-location member access | Acesso de membros entre localizações
- [ ] Consolidated reporting | Relatórios consolidados

---

## ✅ Version 1.0.1 - Security Hardening (Complete | Completo)

### Security Fixes | Correções de Segurança
- [x] Fixed PUBLIC_USER_DATA vulnerability | Corrigida vulnerabilidade PUBLIC_USER_DATA
- [x] Fixed EXPOSED_SENSITIVE_DATA vulnerability | Corrigida vulnerabilidade EXPOSED_SENSITIVE_DATA
- [x] Fixed MISSING_RLS_PROTECTION vulnerability | Corrigida vulnerabilidade MISSING_RLS_PROTECTION
- [x] Created member_sensitive_data table | Criada tabela member_sensitive_data
- [x] Added audit logging for sensitive data | Adicionado registo de auditoria para dados sensíveis
- [x] Strengthened RLS policies | Políticas RLS reforçadas

---

## ✅ Version 1.0 - Core Platform (Complete | Completo)

### Authentication & Security | Autenticação & Segurança
- [x] Email/password authentication | Autenticação email/senha
- [x] Role-based access control (12 roles) | Controlo de acesso baseado em funções (12 funções)
- [x] Row-Level Security (RLS) on all tables | RLS em todas as tabelas
- [x] Secure session management | Gestão segura de sessões
- [x] Protected routes | Rotas protegidas

### Member Management | Gestão de Membros
- [x] Member profiles with photos | Perfis de membros com fotos
- [x] Membership plans & expiration | Planos de associação & expiração
- [x] Family/dependent relationships | Relações familiares/dependentes
- [x] Health conditions tracking (secure) | Rastreamento de condições de saúde (seguro)
- [x] Status management (Active, Suspended, Pending) | Gestão de estados

### Check-In System | Sistema de Check-In
- [x] Quick check-in/out | Check-in/out rápido
- [x] Attendance history | Histórico de presença
- [x] Real-time tracking | Rastreamento em tempo real

### Calendar & Scheduling | Calendário & Agendamento
- [x] Visual weekly calendar | Calendário semanal visual
- [x] Class creation & editing | Criação & edição de aulas
- [x] Recurring class series | Séries de aulas recorrentes
- [x] Coach assignment | Atribuição de treinador
- [x] Location management | Gestão de localização
- [x] Conflict detection | Detecção de conflitos
- [x] Discipline integration | Integração com disciplinas

### Training & Progress | Treino & Progresso
- [x] Exercise library | Biblioteca de exercícios
- [x] Workout template builder | Construtor de modelos de treino
- [x] Workout assignment to members | Atribuição de treinos a membros
- [x] Discipline management | Gestão de disciplinas
- [x] Rank/belt system | Sistema de graduação/faixa
- [x] Promotion criteria | Critérios de promoção
- [x] Member progress dashboard | Dashboard de progresso de membros

### Financial Management | Gestão Financeira
- [x] Payment processing | Processamento de pagamentos
- [x] Invoice generation | Geração de facturas
- [x] Multicaixa Express integration | Integração Multicaixa Express
- [x] Bank reconciliation | Reconciliação bancária
- [x] Financial reports (PDF export) | Relatórios financeiros (exportação PDF)
- [x] Discount/coupon system | Sistema de descontos/cupões

### Sales CRM | CRM de Vendas
- [x] Lead pipeline (Kanban) | Pipeline de leads (Kanban)
- [x] Lead source tracking | Rastreamento de fonte de leads
- [x] Task management | Gestão de tarefas
- [x] Conversion to member | Conversão para membro

### Inventory & POS | Inventário & PDV
- [x] Product catalog | Catálogo de produtos
- [x] Stock management | Gestão de stock
- [x] Low stock alerts | Alertas de stock baixo
- [x] POS interface | Interface PDV
- [x] Asset tracking | Rastreamento de activos

### Staff Management | Gestão de Staff
- [x] 12 international standard roles | 12 funções padrão internacional
- [x] Permission-based access | Acesso baseado em permissões
- [x] Trainer flag for specialized permissions | Flag de treinador para permissões especializadas

---

## 🚧 Version 1.2 - Q1 2025 (In Progress | Em Progresso)

### GDPR Compliance | Conformidade GDPR
- [ ] Consent management UI | UI de gestão de consentimentos
- [ ] Data export requests | Pedidos de exportação de dados
- [ ] Data deletion requests | Pedidos de eliminação de dados
- [ ] Anonymization workflows | Fluxos de anonimização

### Notifications | Notificações
- [ ] Email notifications (Edge Function) | Notificações por email
- [ ] Booking confirmations | Confirmações de reserva
- [ ] Payment reminders | Lembretes de pagamento
- [ ] Class cancellation alerts | Alertas de cancelamento de aulas

### Kiosk Mode | Modo Quiosque
- [ ] Self-service check-in terminal | Terminal de check-in self-service
- [ ] PIN-based authentication | Autenticação baseada em PIN
- [ ] Tablet-optimized interface | Interface optimizada para tablet

### Member Portal | Portal do Membro
- [ ] Class booking interface | Interface de reserva de aulas
- [ ] Payment history | Histórico de pagamentos
- [ ] Profile management | Gestão de perfil

---

## 📋 Version 1.3 - Q2 2025 (Planned | Planeado)

### Mobile Experience | Experiência Móvel
- [ ] React Native mobile app | Aplicação móvel React Native
- [ ] Push notifications | Notificações push
- [ ] Offline check-in support | Suporte a check-in offline

### Communication | Comunicação
- [ ] WhatsApp integration | Integração WhatsApp
- [ ] SMS notifications | Notificações SMS
- [ ] In-app messaging | Mensagens na aplicação

### Advanced Analytics | Análises Avançadas
- [ ] Revenue forecasting | Previsão de receitas
- [ ] Member retention analysis | Análise de retenção de membros
- [ ] Class popularity metrics | Métricas de popularidade de aulas
- [ ] Coach performance dashboard | Dashboard de desempenho de treinadores

---

## 🔮 Version 2.0 - Q4 2025 (Vision | Visão)

### Multi-Location | Multi-Localização
- [ ] Gym chain management | Gestão de cadeias de ginásios
- [ ] Cross-location member access | Acesso de membros entre localizações
- [ ] Consolidated reporting | Relatórios consolidados

### API & Integrations | API & Integrações
- [ ] Public REST API | API REST pública
- [ ] Webhook support | Suporte a webhooks
- [ ] Third-party integrations | Integrações de terceiros
- [ ] Wearable device sync | Sincronização com dispositivos vestíveis

### White-Label | Marca Branca
- [ ] Custom branding per gym | Marca personalizada por ginásio
- [ ] Custom domain support | Suporte a domínio personalizado
- [ ] Theme customization | Personalização de tema

### AI Features | Funcionalidades IA
- [ ] AI training recommendations | Recomendações de treino por IA
- [ ] Automated scheduling optimization | Optimização automática de agendamento
- [ ] Churn prediction | Previsão de abandono

---

## 💰 Planos Flexíveis | Flexible Plans

### Starter
**35.000 Kz/mês | 35,000 Kz/month**
Para pequenos estúdios e boxes de CrossFit.
> For small studios and CrossFit boxes.

- [x] Membros Activos | Active Members
- [x] Pagamentos Digitais | Digital Payments
- [x] Controlo de Hardware | Hardware Control
- [ ] Dashboard BI | BI Dashboard
- [ ] Suporte Prioritário | Priority Support

### Pro (Melhor Escolha | Best Choice)
**75.000 Kz/mês | 75,000 Kz/month**
Para ginásios com controlo de acesso e alto volume.
> For gyms with access control and high volume.

- [x] Membros Activos | Active Members
- [x] Pagamentos Digitais | Digital Payments
- [x] Controlo de Hardware | Hardware Control
- [x] Dashboard BI | BI Dashboard
- [x] Suporte Prioritário | Priority Support

### Enterprise
**Sob Consulta | On Request**
Para redes de ginásios e grandes complexos desportivos.
> For gym chains and large sports complexes.

- [x] Membros Activos | Active Members
- [x] Pagamentos Digitais | Digital Payments
- [x] Controlo de Hardware | Hardware Control
- [x] Dashboard BI | BI Dashboard
- [x] Suporte Prioritário | Priority Support
- [x] Implementação Personalizada | Custom Implementation

---

## 💬 Quem Confia | Who Trusts Us

### Testemunhos | Testimonials

> "Antes perdíamos muito tempo a conferir comprovativos de transferência. Com o Nzila e os pagamentos digitais, é tudo automático."
> — **João Manuel**, Proprietário, Luanda Elite Fit

> "O bloqueio automático no torniquete reduziu os pagamentos em atraso em quase 90%. O sistema paga-se sozinho."
> — **Maria Costa**, Gerente, The Talatona Club

---

## ❓ Perguntas Frequentes | FAQ

### Preciso comprar torniquetes novos? | Do I need to buy new turnstiles?
O Nzila integra com as principais marcas do mercado (Hikvision, ZKTeco). Provavelmente podemos usar os seus atuais.
> Nzila integrates with major market brands (Hikvision, ZKTeco). We can probably use your current ones.

### Como recebo o dinheiro dos pagamentos? | How do I receive payment money?
O dinheiro vai directamente para a sua conta bancária via Multicaixa Express. Sem intermediários.
> Money goes directly to your bank account via Multicaixa Express. No intermediaries.

### Quanto tempo demora a implementação? | How long does implementation take?
Normalmente 2-3 dias úteis para configuração completa, incluindo integração de hardware.
> Usually 2-3 business days for complete setup, including hardware integration.

### Posso experimentar antes de comprar? | Can I try before buying?
Sim! Oferecemos uma demonstração gratuita personalizada para o seu ginásio.
> Yes! We offer a free personalized demo for your gym.

---

## 🎯 Long-term Vision | Visão de Longo Prazo

- Cloud-native architecture | Arquitectura cloud-native
- AI personal training assistant | Assistente de treino pessoal IA
- IoT equipment integration | Integração de equipamento IoT
- Biometric check-in | Check-in biométrico
- Virtual/hybrid class support | Suporte a aulas virtuais/híbridas

---

**Have suggestions? | Tem sugestões?** 
[Open a feature request | Abra um pedido de funcionalidade](https://github.com/clrogon/nzila-gym-manager/issues/new/choose)

**Digitalize o seu Ginásio | Digitize your Gym**
📧 email@gym.ao | 📱 +244 ...
