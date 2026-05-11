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

  return {
    nickName,
    avatarText: nickName.charAt(0) || '健',
    gender: Number(profile.gender) || 0,
    country: profile.country || '',
    province: profile.province || '',
    city: profile.city || '',
    language: profile.language || 'zh_CN'
  }
}

const mergeProfile = (existing, incoming) => ({
  nickName: incoming.nickName && incoming.nickName !== '微信用户' ? incoming.nickName : (existing.nickName || '微信用户'),
  avatarText: incoming.avatarText || (incoming.nickName ? incoming.nickName.charAt(0) : '') || existing.avatarText || (existing.nickName ? existing.nickName.charAt(0) : '健'),
  gender: incoming.gender || existing.gender || 0,
  country: incoming.country || existing.country || '',
  province: incoming.province || existing.province || '',
  city: incoming.city || existing.city || '',
  language: incoming.language || existing.language || 'zh_CN'
})

const toPublicUser = user => ({
  id: user.id,
  nickName: user.nickName,
  avatarText: user.avatarText || (user.nickName ? user.nickName.charAt(0) : '健'),
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

const updateByOpenid = async (openid, payload = {}) => {
  const users = await readUsers()
  const index = users.findIndex(user => user.openid === openid)

  if (index < 0) {
    return null
  }

  const existing = users[index]
  const now = new Date().toISOString()
  const updated = { ...existing }

  if (Object.prototype.hasOwnProperty.call(payload, 'myNotes')) {
    updated.myNotes = Array.isArray(payload.myNotes) ? payload.myNotes : []
    updated.noteCount = updated.myNotes.length
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'myFavorites')) {
    updated.myFavorites = Array.isArray(payload.myFavorites) ? payload.myFavorites : []
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'myLikes')) {
    updated.myFavorites = Array.isArray(payload.myLikes) ? payload.myLikes : []
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'readingProgress')) {
    updated.readingProgress = payload.readingProgress
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'readingStats')) {
    const readingStats = payload.readingStats || {}
    updated.readChapters = Number(readingStats.readChapters ?? updated.readChapters ?? 0)
    updated.noteCount = Number(readingStats.noteCount ?? updated.noteCount ?? 0)
    updated.likeCount = Number(readingStats.likeCount ?? updated.likeCount ?? 0)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'profileInfo')) {
    const profileInfo = payload.profileInfo || {}

    if (typeof profileInfo.nickName === 'string' && profileInfo.nickName.trim()) {
      updated.nickName = profileInfo.nickName.trim()
    }

    updated.avatarText = updated.nickName ? updated.nickName.charAt(0) : '健'

    if (Object.prototype.hasOwnProperty.call(profileInfo, 'readDays')) {
      updated.readDays = Number(profileInfo.readDays) || 0
    }
  }

  updated.updatedAt = now
  users[index] = updated
  await writeUsers(users)
  return updated
}

const listAllNotes = async ({ chapterId } = {}) => {
  const users = await readUsers()
  const normalizedChapterId = chapterId ? String(chapterId) : ''
  const notes = []

  users.forEach(user => {
    const userNotes = Array.isArray(user.myNotes) ? user.myNotes : []

    userNotes.forEach(note => {
      const noteChapterId = note && note.chapterId != null ? String(note.chapterId) : ''

      if (normalizedChapterId && noteChapterId !== normalizedChapterId) {
        return
      }

      notes.push({
        ...note,
        name: note.name || user.nickName || '微信用户',
        avatar: note.avatar || user.avatarText || (user.nickName ? user.nickName.charAt(0) : '我')
      })
    })
  })

  return notes.sort((a, b) => {
    const likesDiff = (b.likes || 0) - (a.likes || 0)

    if (likesDiff !== 0) {
      return likesDiff
    }

    return String(b.id || '').localeCompare(String(a.id || ''))
  })
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

module.exports = {
  findByOpenid,
  updateByOpenid,
  upsertByOpenid,
  toPublicUser,
  listAllNotes
}