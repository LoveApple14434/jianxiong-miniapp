const express = require('express')
const cors = require('cors')

const config = require('./config')
const authRoutes = require('./routes/auth')

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { service: 'jianxiong-miniapp-server', time: new Date().toISOString() } })
})

app.use('/api/auth', authRoutes)

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' })
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ code: 500, message: '服务器内部错误' })
})

app.listen(config.port, () => {
  console.log(`登录服务已启动: http://127.0.0.1:${config.port}`)
})