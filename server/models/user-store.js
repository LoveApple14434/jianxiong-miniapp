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
  const nickName = typeof profile.nickName === 'string' && profile.nickName.trim() ? profile.nickName.trim() : '微信用户'

  return {
    nickName,
    avatarUrl: typeof profile.avatarUrl === 'string' && profile.avatarUrl.trim() ? profile.avatarUrl.trim() : '',
    gender: Number(profile.gender) || 0,
    country: profile.country || '',
    province: profile.province || '',
    city: profile.city || '',
    language: profile.language || 'zh_CN'
  }
}

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
  lastLoginAt: user.lastLoginAt
})

const findByOpenid = async openid => {
  const users = await readUsers()
  return users.find(user => user.openid === openid) || null
}

const upsertByOpenid = async ({ openid, profile, session }) => {
  const users = await readUsers()
  const now = new Date().toISOString()
  const normalizedProfile = normalizeProfile(profile)
  const index = users.findIndex(user => user.openid === openid)

  if (index >= 0) {
    const existing = users[index]
    const updated = {
      ...existing,
      ...normalizedProfile,
      sessionKey: session.session_key || existing.sessionKey,
      unionid: session.unionid || existing.unionid || '',
      loginCount: (existing.loginCount || 0) + 1,
      updatedAt: now,
      lastLoginAt: now
    }

    users[index] = updated
    await writeUsers(users)
    return updated
  }

  const created = {
    id: createId(),
    openid,
    sessionKey: session.session_key || '',
    unionid: session.unionid || '',
    ...normalizedProfile,
    readChapters: 5,
    noteCount: 12,
    likeCount: 32,
    loginCount: 1,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  }

  users.push(created)
  await writeUsers(users)
  return created
}

module.exports = {
  findByOpenid,
  upsertByOpenid,
  toPublicUser
}