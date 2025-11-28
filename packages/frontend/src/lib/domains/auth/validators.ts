const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): string | null {
  if (!email) {
    return "メールアドレスを入力してください";
  }
  if (!EMAIL_REGEX.test(email)) {
    return "有効なメールアドレスを入力してください";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "パスワードを入力してください";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください`;
  }
  return null;
}

export function validateLoginCredentials(
  email: string,
  password: string,
): string | null {
  return validateEmail(email) || validatePassword(password);
}
