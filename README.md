# Virukshaa Construction Management System

Comprehensive construction management platform with role-based dashboards for Admin, Supervisor, Client, and Supplier. It centralizes projects, employees, materials, reports, messaging, and payroll while ensuring data integrity and efficient storage management.

## Features
- Role-based dashboards and navigation
- Projects, tasks, invoices, and materials management
- Employees and supervisors management with daily shift tracking
- Supervisor shift entry is locked per day after first save
- Messaging between admin and clients, including attachments
- Background image customization for dashboard with permanent storage deletion
- Reports and payroll modules

## Tech Stack
- Next.js App Router, React, TypeScript
- UI: shadcn/ui components
- Database: MongoDB + Mongoose
- Storage: Cloudflare R2
- Notifications: `sonner` and custom toasts

## Getting Started
### Prerequisites
- Node.js 18+
- MongoDB instance
- Cloudflare R2 bucket and API credentials

### Installation
```
npm install
```

### Environment Variables
Create a `.env` file with the following variables:
```
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority"

CLOUDFLARE_R2_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
CLOUDFLARE_R2_ACCESS_KEY_ID="<access_key_id>"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="<secret_access_key>"
CLOUDFLARE_R2_BUCKET_NAME="<bucket_name>"
CLOUDFLARE_R2_PUBLIC_URL="https://<public_r2_domain>"
```

### Development
```
npm run dev
```

### Build
```
npm run build
```

## Key Workflows
### Dashboard Background Deletion
- Remove button triggers a confirmation dialog and calls `DELETE /api/admin/upload-logo` to permanently delete the background from Cloudflare R2.
- UI updates only after backend verifies storage deletion to prevent orphaned files.

### Client Message Cleanup
- Admin can delete all messages for a client via the dialog action in the message view.
- Calls `POST /api/messages/delete-all` with `{ conversationId }`.
- Deletes attachments from storage first, then removes all related message documents in an atomic transaction.

## API Endpoints
- `POST /api/admin/upload-logo` — Upload dashboard assets
- `DELETE /api/admin/upload-logo` — Permanently delete a dashboard asset (verifies removal)
- `POST /api/messages/delete-all` — Delete all messages and attachments for a conversation

## Data Integrity & Storage
- Storage deletions are verified and UI state only updates on success.
- Message deletion is atomic at the database level; if any step fails, no changes are applied.

## Notes
- If ESLint errors occur due to local configuration, build will still succeed. Adjust `.eslintrc.json` if needed.
