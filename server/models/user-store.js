const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const usersFile = path.join(__dirname, '..', 'data', 'users.json')

const ensureStore = async () => {
  await fs.promises.mkdir(path.dirname(usersFile), { recursive: true })

  try {
    await fs.promises.access(usersFile)
  } catch (error) {
    await fs.promises.writeFile(usersFile, '[]', 'utf8')
  }
}

const readUsers = async () => {
  await ensureStore()
  const content = await fs.promises.readFile(usersFile, 'utf8')

  try {
    const users = JSON.parse(content)
    return Array.isArray(users) ? users : []
  } catch (error) {
    return []
  }
}

const writeUsers = async users => {
  await ensureStore()
  await fs.promises.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8')
}

const createId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return crypto.randomBytes(16).toString('hex')
}

const normalizeProfile = profile => {
  const nickName = typeof profile.nickName === 'string' && profile.nickName.trim()
    ? profile.nickName.trim()
    : (typeof profile.nickname === 'string' && profile.nickname.trim() ? profile.nickname.trim() : '微信用户')
  const avatarUrl = typeof profile.avatarUrl === 'string' && profile.avatarUrl.trim()
    ? profile.avatarUrl.trim()
    : (typeof profile.avatar === 'string' && profile.avatar.trim() ? profile.avatar.trim() : '')

  return {
    nickName,
    avatarUrl,
    gender: Number(profile.gender) || 0,
    country: profile.country || '',
    province: profile.province || '',
    city: profile.city || '',
    language: profile.language || 'zh_CN'
  }
}

const mergeProfile = (existing, incoming) => ({
  nickName: incoming.nickName && incoming.nickName !== '微信用户' ? incoming.nickName : (existing.nickName || '微信用户'),
  avatarUrl: incoming.avatarUrl || existing.avatarUrl || '',
  gender: incoming.gender || existing.gender || 0,
  country: incoming.country || existing.country || '',
  province: incoming.province || existing.province || '',
  city: incoming.city || existing.city || '',
  language: incoming.language || existing.language || 'zh_CN'
})

const toPublicUser = user => ({
  id: user.id,
  nickName: user.nickName,
  avatarUrl: user.avatarUrl,
  gender: user.gender,
  country: user.country,
  province: user.province,
  city: user.city,
  language: user.language,
  readChapters: user.readChapters,
  noteCount: user.noteCount,
  likeCount: user.likeCount,
  loginCount: user.loginCount,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt,
  previousLoginAt: user.previousLoginAt || null
})

const findByOpenid = async openid => {
  const users = await readUsers()
  return users.find(user => user.openid === openid) || null
}

const upsertByOpenid = async ({ openid, clientId = '', profile, session }) => {
  const users = await readUsers()
  const now = new Date().toISOString()
  const normalizedProfile = normalizeProfile(profile)
  const index = users.findIndex(user => user.openid === openid)

  if (index >= 0) {
    const existing = users[index]
    const mergedProfile = mergeProfile(existing, normalizedProfile)
    const updated = {
      ...existing,
      ...mergedProfile,
      sessionKey: session.session_key || existing.sessionKey,
      unionid: session.unionid || existing.unionid || '',
      loginCount: (existing.loginCount || 0) + 1,
      updatedAt: now,
      previousLoginAt: existing.lastLoginAt || existing.previousLoginAt || null,
      lastLoginAt: now
    }

    users[index] = updated
    await writeUsers(users)
    return updated
  }

  const created = {
    id: createId(),
    openid,
    clientId: clientId || '',
    sessionKey: session.session_key || '',
    unionid: session.unionid || '',
    ...normalizedProfile,
    readChapters: 5,
    noteCount: 12,
    likeCount: 32,
    loginCount: 1,
    createdAt: now,
    updatedAt: now,
    previousLoginAt: null,
    lastLoginAt: now
  }

  users.push(created)
  await writeUsers(users)
  return created
}

const updateByOpenid = async (openid, changes = {}) => {
  const users = await readUsers()
  const index = users.findIndex(u => u.openid === openid)

  if (index < 0) {
    return null
  }

  const user = users[index]

  // Allowed keys to store as user-specific data
  const allowed = ['myNotes', 'myFavorites', 'readingProgress', 'readingStats', 'profileInfo']

  const next = { ...user }

  allowed.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      next[key] = changes[key]
    }
  })

  // Sync some summary counters if readingStats provided
  if (changes.readingStats) {
    const stats = changes.readingStats || {}
    if (typeof stats.readChapters === 'number') next.readChapters = stats.readChapters
    if (typeof stats.noteCount === 'number') next.noteCount = stats.noteCount
    if (typeof stats.likeCount === 'number') next.likeCount = stats.likeCount
  }

  next.updatedAt = new Date().toISOString()

  users[index] = next
  await writeUsers(users)
  return next
}

module.exports = {
  findByOpenid,
  upsertByOpenid,
  updateByOpenid,
  toPublicUser
}