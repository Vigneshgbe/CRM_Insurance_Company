@echo off
findstr /n "^export async function\|^export function\|^export const" ^
  src\controllers\notes.controller.ts ^
  src\controllers\activities.controller.ts ^
  src\controllers\history.controller.ts ^
  src\controllers\contact-access.controller.ts ^
  src\controllers\dashboard.controller.ts ^
  src\controllers\cases.controller.ts ^
  src\controllers\clients.controller.ts ^
  src\controllers\documents.controller.ts ^
  src\controllers\auth.controller.ts ^
  src\controllers\client-info.controller.ts ^
  src\controllers\employment.controller.ts ^
  src\controllers\initial-interview.controller.ts ^
  src\controllers\lawyers.controller.ts ^
  src\controllers\medical.controller.ts ^
  src\controllers\police-info.controller.ts ^
  src\controllers\specialist.controller.ts
