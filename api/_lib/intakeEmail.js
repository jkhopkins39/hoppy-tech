/** Recipients for inbound contact, referral, and chatbot intake emails. */
export function getIntakeRecipients() {
  // Comma-separated RESEND_TO is supported. Design-team CC (RESEND_DESIGN_TO) removed.
  const raw = process.env.RESEND_TO ?? 'jeremy@hoppytech.com';
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
}
