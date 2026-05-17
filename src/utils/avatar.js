export function getAvatarUrl(nickname, size = 128, customUrl = null) {
  if (customUrl) return customUrl
  const displayName = nickname || '用户'
  const encoded = encodeURIComponent(displayName)
  return `https://ui-avatars.com/api/?name=${encoded}&size=${size}&background=random&color=fff&bold=true&format=svg`
}