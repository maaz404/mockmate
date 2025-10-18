// Deprecated: Email verification is handled by the identity provider.
// This gate now simply renders children without extra checks.
const EmailVerificationGate = ({ children }) => children;

export default EmailVerificationGate;
