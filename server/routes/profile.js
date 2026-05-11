const express = require('express')

const { authRequired } = require('../middleware/auth')
const { getData, listNotes, saveData } = require('../controllers/profile-controller')

const router = express.Router()

router.get('/notes', listNotes)
router.get('/data', authRequired, getData)
router.post('/data', authRequired, saveData)

module.exports = router
