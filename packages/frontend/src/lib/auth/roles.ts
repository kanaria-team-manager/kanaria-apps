/**
 * ユーザーのロールIDがオーナー(0) または 管理者(1) であるかを判定する
 */
export function isOwnerOrAdmin(roleId: number | undefined | null): boolean {
  return roleId === 0 || roleId === 1;
}
