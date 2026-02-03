// Input sanitization to prevent XSS attacks

export function sanitizeString(input: string): string {
  if (!input) return ''

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .slice(0, 1000) // Limit length to prevent DOS
}

export function sanitizeHtml(input: string): string {
  if (!input) return ''

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeBookingData(data: any) {
  return {
    ...data,
    customer_name: sanitizeString(data.customer_name),
    customer_email: sanitizeString(data.customer_email?.toLowerCase()),
    customer_phone: sanitizeString(data.customer_phone),
    notes: sanitizeString(data.notes || ''),
    reference_code: sanitizeString(data.reference_code),
  }
}
