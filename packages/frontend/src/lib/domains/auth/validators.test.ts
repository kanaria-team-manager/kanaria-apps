import { describe, it, expect } from "vitest"
import { validateEmail, validatePassword, validateLoginCredentials } from "./validators"

describe("validateEmail", () => {
  it("returns error for empty email", () => {
    expect(validateEmail("")).toBe("メールアドレスを入力してください")
  })

  it("returns error for invalid email format", () => {
    expect(validateEmail("invalid")).toBe("有効なメールアドレスを入力してください")
    expect(validateEmail("invalid@")).toBe("有効なメールアドレスを入力してください")
    expect(validateEmail("@domain.com")).toBe("有効なメールアドレスを入力してください")
  })

  it("returns null for valid email", () => {
    expect(validateEmail("test@example.com")).toBeNull()
    expect(validateEmail("user.name@domain.co.jp")).toBeNull()
  })
})

describe("validatePassword", () => {
  it("returns error for empty password", () => {
    expect(validatePassword("")).toBe("パスワードを入力してください")
  })

  it("returns error for short password", () => {
    expect(validatePassword("1234567")).toBe("パスワードは8文字以上で入力してください")
  })

  it("returns null for valid password", () => {
    expect(validatePassword("12345678")).toBeNull()
    expect(validatePassword("securepassword123")).toBeNull()
  })
})

describe("validateLoginCredentials", () => {
  it("returns email error first if both are invalid", () => {
    expect(validateLoginCredentials("", "")).toBe("メールアドレスを入力してください")
  })

  it("returns password error if email is valid but password is invalid", () => {
    expect(validateLoginCredentials("test@example.com", "")).toBe("パスワードを入力してください")
  })

  it("returns null if both are valid", () => {
    expect(validateLoginCredentials("test@example.com", "12345678")).toBeNull()
  })
})
