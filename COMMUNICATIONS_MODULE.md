# Communications Module - Simple Internal Chat + WhatsApp

**Status**: Created (migration pending)

## What Was Created

### 1. Database Schema (`supabase/migrations/20250108_create_communications_simple.sql`)
- **Simple approach** - 2 tables only:
  - `staff_messages` - Direct messages between staff
  - `whatsapp_messages` - WhatsApp messages to members

### 2. Types (`src/types/communications.ts`)
- `StaffMessage` - Internal staff messages
- `WhatsAppMessage` - WhatsApp messages
- Simple interfaces for sending messages

### 3. Service (`src/services/communicationService.ts`)
- Functions to send/receive staff messages
- Functions to send WhatsApp messages
- **Note**: Has type errors until migration runs (tables don't exist yet)

### 4. UI Components
- `src/modules/communications/components/SimpleStaffChat.tsx` - Simple chat interface
- `src/pages/Communications.tsx` - Main page with tabs:
  - **Internal Staff** tab - Chat between staff members
  - **WhatsApp (Members)** tab - Send WhatsApp messages

## Key Features

### Internal Staff Chat
- Real-time messaging between staff
- Online/offline status
- Read receipts
- Message history

### WhatsApp Integration
- Send messages to members via WhatsApp
- Message status tracking (pending/sent/delivered/failed)
- History of all WhatsApp messages
- **Setup required**: Configure WhatsApp Business API in settings

## Next Steps

### 1. Run Migration (CRITICAL)
```bash
# Run the database migration
supabase migration up

# Or use the Supabase Dashboard:
# Go to Database > Migrations and run the migration file
```

### 2. Add to Navigation
Add Communications link to the sidebar/navigation menu:
```tsx
import { MessageSquare } from 'lucide-react';

// Add navigation item
<NavLink to="/communications">
  <MessageSquare className="w-4 h-4" />
  Communications
</NavLink>
```

### 3. Test After Migration
Once migration runs:
- Test internal staff chat
- Test WhatsApp integration (requires API credentials)
- Verify real-time updates work

## Files Created
```
supabase/migrations/20250108_create_communications_simple.sql
src/types/communications.ts
src/services/communicationService.ts
src/pages/Communications.tsx
src/modules/communications/components/SimpleStaffChat.tsx
```

## Notes
- **Simple design** - No overcomplicated features
- **WhatsApp ready** - Placeholder for when you configure the API
- **Real-time** - Database configured for Supabase realtime
- **Migration required** - TypeScript errors in service until migration runs
