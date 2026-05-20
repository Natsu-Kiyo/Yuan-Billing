// 头像工具函数：基于昵称生成 UI Avatars 占位头像
/** 获取头像 URL，优先使用自定义 URL，否则用昵称自动生成 */
export function getAvatarUrl(nickname, size = 128, customUrl = null) {
  if (customUrl) return customUrl
  const displayName = nickname || '用户'
  const encoded = encodeURIComponent(displayName)
  return `https://ui-avatars.com/api/?name=${encoded}&size=${size}&background=random&color=fff&bold=true&format=svg`
}