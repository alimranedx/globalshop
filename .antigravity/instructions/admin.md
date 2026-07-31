# Feature Instruction: Platform Admin Console

## Overview
Managed via `PlatformAdminController`, `AdminUserDirectoryController`, and `AdminSupportTicketController`. Route prefix: `/admin/*`.

## Admin Capabilities
- **Shops Management (`/admin/shops`):** Approve pending shops, suspend active shops, edit tenant quotas.
- **Subscription Plans (`/admin/plans`):** Manage plan pricing and limits.
- **Admin Directory (`/admin/admins`):** Create new platform admins and configure explicit permission matrices.
- **Support Tickets (`/admin/tickets`):** View customer tickets, reply, update status, and manage internal notes.
- **Audit Logs (`/admin/logs`):** Platform-wide activity audit trail (`ActivityLog` model).
