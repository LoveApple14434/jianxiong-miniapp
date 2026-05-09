const { findByOpenid, updateByOpenid } = require('../models/user-store')

const getData = async (req, res) => {
  try {
    const openid = req.auth && req.auth.decoded && req.auth.decoded.openid

    if (!openid) {
      return res.status(401).json({ code: 401, message: '未登录或登录已过期' })
    }

    const user = await findByOpenid(openid)

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    const data = {
      notes: user.myNotes && Array.isArray(user.myNotes) ? user.myNotes : [],
      favorites: user.myFavorites && Array.isArray(user.myFavorites) ? user.myFavorites : [],
      readingProgress: user.readingProgress || null,
      readingStats: {
        readChapters: user.readChapters || 0,
        noteCount: user.noteCount || 0,
        likeCount: user.likeCount || 0
      },
      profileInfo: {
        nickName: user.nickName || '',
        avatarText: user.nickName ? (user.nickName.charAt(0) || '健') : '健',
        readDays: user.readDays || 0
      }
    }

    return res.json({ code: 0, message: 'ok', data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ code: 500, message: error.message || '获取数据失败' })
  }
}

const saveData = async (req, res) => {
  try {
    const openid = req.auth && req.auth.decoded && req.auth.decoded.openid

    if (!openid) {
      return res.status(401).json({ code: 401, message: '未登录或登录已过期' })
    }

    const payload = req.body || {}

    const allowed = {}

    // Accept only known keys
    ;['myNotes', 'myFavorites', 'readingProgress', 'readingStats', 'profileInfo'].forEach(k => {
      if (Object.prototype.hasOwnProperty.call(payload, k)) {
        allowed[k] = payload[k]
      }
    })

    const updated = await updateByOpenid(openid, allowed)

    if (!updated) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    return res.json({ code: 0, message: '保存成功', data: { success: true } })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ code: 500, message: error.message || '保存失败' })
  }
}

module.exports = {
  getData,
  saveData
}
