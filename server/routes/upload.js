const express = require('express')
const path = require('path')

const { parseUploadFile, saveUploadedFile, getAvatarUrl } = require('../middleware/upload')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

// POST /api/upload/avatar
const uploadAvatar = async (req, res) => {
  try {
    const upload = await parseUploadFile(req, { limits: { fileSize: 5 * 1024 * 1024 } })
    const avatarFile = upload.files.avatar

    if (!avatarFile) {
      return res.status(400).json({ code: 400, message: '缺少头像文件' })
    }

    const filename = await saveUploadedFile(avatarFile.data, avatarFile.filename)
    const baseUrl = req.get('origin') || 'http://127.0.0.1:3000/api'
    const permanentUrl = getAvatarUrl(baseUrl, filename)

    console.log('[upload] avatar saved:', { filename, url: permanentUrl })

    return res.json({
      code: 0,
      message: '头像上传成功',
      data: {
        filename,
        permanentUrl
      }
    })
  } catch (error) {
    console.error('[upload] error:', error)
    return res.status(500).json({ code: 500, message: error.message || '头像上传失败' })
  }
}

router.post('/avatar', uploadAvatar)

module.exports = router
