# 💖 Contributing to Nzila Gym Manager

We are thrilled that you are considering contributing to Nzila Gym Manager! Your help is invaluable in making this the best open-source gym management solution available. Whether you're fixing a bug, adding a new feature, or improving documentation, every contribution is welcome.

## 🚀 Getting Started

### 1. Set Up Your Environment

1.  **Fork & Clone**: Start by forking the repository to your own GitHub account and then cloning it locally.
    ```bash
    git clone https://github.com/YOUR_USERNAME/nzila-gym-manager.git
    cd nzila-gym-manager
    ```
2.  **Install Dependencies**:
    ```bash
    npm install # or pnpm install
    ```
3.  **Start Development**:
    ```bash
    npm run dev
    ```

### 2. Development Workflow

1.  **Branching**: Create a descriptive feature branch from `main`.
    ```bash
    git checkout -b feat/add-member-dashboard
    # or fix/resolve-calendar-overlap
    ```
2.  **Commit Messages**: We use **Conventional Commits** for clear history.
    *   `feat`: A new feature
    *   `fix`: A bug fix
    *   `docs`: Documentation only changes
    *   `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
    *   `refactor`: A code change that neither fixes a bug nor adds a feature
    *   `test`: Adding missing tests or correcting existing tests
    *   `chore`: Other changes that don't modify src or test files

### 3. Architectural Guidelines

We follow a **Modular Architecture** and a **Mock-First Strategy** to ensure rapid development and maintainability.

#### A. Mock-First Strategy (CRITICAL)

**All new features must be implemented and fully functional in the Development Environment first, without relying on a live backend.**

*   **Simulate Business Logic**: Implement your feature's business logic in `services/*.ts` using local memory arrays (e.g., `MEMBERS_DB`). This allows for isolated testing of the UI and logic.
*   **Validate Data Types**: Design your data types (`types.ts`) to match the expected future SQL schema. This ensures a smooth transition when connecting to the live Supabase backend.

#### B. Modular Structure

When adding a new feature (e.g., a new module like `pos`):
*   **Module Folder**: Create a dedicated folder in `src/modules/` (e.g., `src/modules/pos`).
*   **Types**: Define all related interfaces and types in a `types.ts` file within the module.
*   **Service**: Create a dedicated service (e.g., `services/posService.ts`) to encapsulate all business logic for that module.
*   **UI/Pages**: Implement the user interface components and pages within the module folder.

### 4. Code Quality & Security

| Standard | Description | Enforcement |
| :--- | :--- | :--- |
| **Strict TypeScript** | Avoid the use of `any` types. Strive for explicit typing to catch errors early. | **Mandatory** |
| **Data Validation** | All Data Transfer Objects (DTOs) and user inputs **must** have a corresponding **Zod** schema for validation. | **Mandatory** |
| **Security Middleware** | All API calls must utilize the `checkPermission` middleware simulation (or equivalent RBAC check) to enforce authorization. | **Mandatory** |
| **PII Protection** | **NEVER** expose Personally Identifiable Information (PII) in logs or non-secure environments. | **Mandatory** |
| **Testing** | Run `npm test` before submitting a Pull Request. *(Note: Test suite implementation is pending in v1.1)* | **Recommended** |

### Supabase Row Level Security (RLS)

All database tables **MUST** have RLS policies enabled. Example policies:

#### Members Table
```sql
-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Owners can see all members in their gym
CREATE POLICY "owners_view_members" ON members
  FOR SELECT
  USING (
    gym_id IN (
      SELECT gym_id FROM staff WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Staff can see members in their gym
CREATE POLICY "staff_view_members" ON members
  FOR SELECT
  USING (
    gym_id IN (
      SELECT gym_id FROM staff WHERE user_id = auth.uid()
    )
  );
```

#### Payments Table
```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Only owners and staff can view payments
CREATE POLICY "gym_staff_view_payments" ON payments
  FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE gym_id IN (
        SELECT gym_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );
```

**Test RLS policies before deploying to production.**

## 🎁 Submitting Your Contribution

1.  Ensure your branch is up-to-date with the `main` branch.
2.  Open a Pull Request (PR) to the `main` branch of the `clrogon/nzila-gym-manager` repository.
3.  The PR title should follow the Conventional Commit format (e.g., `feat: add dark mode toggle`).
4.  Describe your changes clearly and link to any relevant issues.

Thank you for helping us build Nzila!
