const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const busboy = require('busboy')

const uploadsDir = path.join(__dirname, '..', 'uploads')

const ensureUploadsDir = async () => {
  try {
    await fs.promises.mkdir(uploadsDir, { recursive: true })
  } catch (error) {
    console.error('Failed to create uploads directory:', error)
  }
}

const parseUploadFile = (req, options = {}) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers, ...options })
    const result = {
      fields: {},
      files: {}
    }

    bb.on('file', (fieldname, file, info) => {
      const { filename, mimetype } = info
      const chunks = []

      file.on('data', data => {
        chunks.push(data)
      })

      file.on('end', () => {
        result.files[fieldname] = {
          fieldname,
          filename,
          mimetype,
          data: Buffer.concat(chunks)
        }
      })

      file.on('error', reject)
    })

    bb.on('field', (fieldname, val) => {
      result.fields[fieldname] = val
    })

    bb.on('close', () => {
      resolve(result)
    })

    bb.on('error', reject)

    req.pipe(bb)
  })
}

const saveUploadedFile = async (fileData, filename) => {
  await ensureUploadsDir()

  const ext = filename ? path.extname(filename).toLowerCase() : '.jpg'
  const hash = crypto.randomBytes(16).toString('hex')
  const savedFilename = `avatar_${hash}${ext}`
  const filepath = path.join(uploadsDir, savedFilename)

  await fs.promises.writeFile(filepath, fileData)

  return savedFilename
}

const getAvatarUrl = (baseUrl, filename) => {
  return `${baseUrl}/uploads/${filename}`
}

module.exports = {
  parseUploadFile,
  saveUploadedFile,
  getAvatarUrl,
  ensureUploadsDir
}
