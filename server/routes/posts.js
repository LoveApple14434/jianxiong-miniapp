const express = require('express')
const { listPosts, getPost, createPost, createComment, deleteComment, deletePost, likePost } = require('../controllers/posts-controller')

const router = express.Router()

router.get('/', listPosts)
router.get('/:id', getPost)
router.post('/', createPost)
router.post('/:id/comments', createComment)
router.post('/:id/like', likePost)
router.delete('/:id', deletePost)
router.delete('/:id/comments/:commentId', deleteComment)

module.exports = router
