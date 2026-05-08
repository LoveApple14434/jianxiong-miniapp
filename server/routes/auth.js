const express = require('express')

const { authRequired } = require('../middleware/auth')
const { login, me, logout } = require('../controllers/auth-controller')

const router = express.Router()

router.post('/login', login)
router.get('/me', authRequired, me)
router.post('/logout', authRequired, logout)

module.exports = router