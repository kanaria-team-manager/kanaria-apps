const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 50;

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

export function validateName(name: string): string | null {
  if (!name) {
    return "名前を入力してください";
  }
  if (name.length < MIN_NAME_LENGTH) {
    return "名前を入力してください";
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `名前は${MAX_NAME_LENGTH}文字以内で入力してください`;
  }
  return null;
}

export function validatePasswordConfirm(
  password: string,
  passwordConfirm: string,
): string | null {
  if (!passwordConfirm) {
    return "パスワード確認を入力してください";
  }
  if (password !== passwordConfirm) {
    return "パスワードが一致しません";
  }
  return null;
}

export function validateLoginCredentials(
  email: string,
  password: string,
): string | null {
  return validateEmail(email) || validatePassword(password);
}
