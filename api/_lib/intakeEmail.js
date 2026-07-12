/** Recipients for inbound contact, referral, and chatbot intake emails. */
export function getIntakeRecipients() {
  const primary = process.env.RESEND_TO ?? 'jeremy@hoppytech.com';
  const secondary = process.env.RESEND_DESIGN_TO ?? 'bella@hoppytech.com';
  return [...new Set([primary, secondary].filter(Boolean))];
}
