export function keyToSetting (x: string) {
  const colonIndex = x.indexOf(':')
  if (colonIndex === -1) {
    return normalize(x)
  }
  const firstPart = x.slice(0, colonIndex)
  const secondPart = x.slice(colonIndex + 1)
  return `${normalize(firstPart)}:${normalize(secondPart)}`
}

function normalize (s: string) {
  s = s.toLowerCase()
  if (s === '_authtoken') return '_authToken'
  let r = s[0]
  for (let i = 1; i < s.length; i++) {
    r += s[i] === '_' ? '-' : s[i]
  }
  return r
}
