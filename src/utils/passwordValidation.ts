export interface PasswordRule {
  label: string;
  test: (pwd: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  { label: 'Mínimo 8 caracteres',           test: (p) => p.length >= 8 },
  { label: 'Al menos una mayúscula (A-Z)',   test: (p) => /[A-Z]/.test(p) },
  { label: 'Al menos una minúscula (a-z)',   test: (p) => /[a-z]/.test(p) },
  { label: 'Al menos un número (0-9)',       test: (p) => /\d/.test(p) },
  { label: 'Al menos un carácter especial (@$!%*?&._-#)', test: (p) => /[@$!%*?&._\-#]/.test(p) },
];

export function validatePassword(pwd: string): { valid: boolean; failedRules: string[] } {
  const failedRules = passwordRules.filter(r => !r.test(pwd)).map(r => r.label);
  return { valid: failedRules.length === 0, failedRules };
}
