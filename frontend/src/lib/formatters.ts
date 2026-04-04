export function formatCurrency(value: number | string | undefined): string {
  if (value === undefined || value === "") return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(num);
}

export function formatDate(date: string | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  return phone;
}

export function daysUntil(date: string): number {
  const target = new Date(date);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isWithinDays(date: string, days: number): boolean {
  const d = daysUntil(date);
  return d >= 0 && d <= days;
}

export function maskSIN(sin: string): string {
  if (!sin) return "—";
  return "***-***-" + sin.slice(-3);
}

export function generateFileNo(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `MVA-${year}-${seq}`;
}

export function formatMobileNumber(mobile: string): string {
  if (!mobile) return "";
  const cleaned = mobile.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `+1-${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return mobile;
}

export function getMobileTelUri(mobile: string): string {
  if (!mobile) return "";
  const cleaned = mobile.replace(/\D/g, "");
  return `tel:+${cleaned.startsWith("1") ? cleaned : "1" + cleaned}`;
}

export function validateMobileNumber(value: string): string | true {
  if (!value || value.trim() === "") return true;
  const formatted = /^\+1-\d{3}-\d{3}-\d{4}$/.test(value);
  const parens = /^\(\d{3}\)\s?\d{3}-\d{4}$/.test(value);
  const plain = /^\+?1?\d{10,11}$/.test(value.replace(/\D/g, ""));
  if (formatted || parens || plain) return true;
  return "Format: +1-XXX-XXX-XXXX or (XXX) XXX-XXXX";
}
