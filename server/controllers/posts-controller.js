const { getAllPosts, getPostById, addPost, addCommentToPost, deleteCommentFromPost, deletePost, updatePostLikes } = require('../models/posts-store')
const { verifyToken } = require('../utils/token')
const { findByOpenid, toPublicUser } = require('../models/user-store')

const listPosts = async (req, res) => {
  try {
    const posts = await getAllPosts()
    return res.json({ code: 0, message: 'ok', data: posts })
  } catch (error) {
    console.error('[posts/list] error:', error)
    return res.status(500).json({ code: 500, message: error.message || '获取帖子失败' })
  }
}

const getPost = async (req, res) => {
  try {
    const { id } = req.params
    const post = await getPostById(id)

    if (!post) {
      return res.status(404).json({ code: 404, message: '帖子不存在' })
    }

    return res.json({ code: 0, message: 'ok', data: post })
  } catch (error) {
    console.error('[posts/get] error:', error)
    return res.status(500).json({ code: 500, message: error.message || '获取帖子失败' })
  }
}

const createPost = async (req, res) => {
  try {
    const { content = '', topicId, tag = '', images = [], authorName = '匿名' } = req.body || {}

    if (!content.trim()) {
      return res.status(400).json({ code: 400, message: '帖子内容不能为空' })
    }

    if (!topicId) {
      return res.status(400).json({ code: 400, message: '请选择帖子类型' })
    }

    const finalImages = Array.isArray(images) ? images : []
    const avatarText = authorName ? String(authorName).charAt(0) : 'A'
    const post = {
      id: Date.now(),
      avatar: avatarText,
      name: authorName || '匿名',
      time: '刚刚',
      topicId: Number(topicId),
      tag: String(tag),
      content: content.trim(),
      images: finalImages,
      likes: 0,
      comments: 0,
      commentsList: [],
      createdAt: new Date().toISOString()
    }

    await addPost(post)
    return res.status(201).json({ code: 0, message: '发布成功', data: post })
  } catch (error) {
    console.error('[posts/create] error:', error)
    return res.status(500).json({ code: 500, message: error.message || '发布失败' })
  }
}

const createComment = async (req, res) => {
  try {
    const { id } = req.params
    let { content = '', authorName = '', authorAvatar = '' } = req.body || {}

    // 如果请求没有提供 authorName，尝试从 Authorization: Bearer <token> 中恢复用户信息
    if (!authorName || authorName === '我') {
      try {
        const authHeader = req.headers.authorization || ''
        let token = ''

        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.slice(7).trim()
        } else if (req.body && req.body.token) {
          token = req.body.token
        } else if (req.query && req.query.token) {
          token = req.query.token
        }

        if (token) {
          const decoded = verifyToken(token)
          if (decoded && decoded.openid) {
            const user = await findByOpenid(decoded.openid)
            if (user) {
              const publicUser = toPublicUser(user)
              authorName = publicUser.nickName || publicUser.nickname || '我'
              authorAvatar = publicUser.avatarText || (authorName ? String(authorName).charAt(0) : '我')
            }
          }
        }
      } catch (err) {
        // token 解析失败则继续使用默认或请求中的值，不要阻塞评论创建
      }
    }

    if (!content.trim()) {
      return res.status(400).json({ code: 400, message: '评论内容不能为空' })
    }

    const comment = {
      id: Date.now(),
      avatar: authorAvatar || (authorName ? String(authorName).charAt(0) : '我'),
      name: authorName || '我',
      time: '刚刚',
      content: content.trim(),
      isSelf: Boolean(req.headers.authorization || req.body.token || req.query.token)
    }

    const post = await addCommentToPost(id, comment)

    if (!post) {
      return res.status(404).json({ code: 404, message: '帖子不存在' })
    }

    return res.status(201).json({ code: 0, message: '评论成功', data: comment })
  } catch (error) {
    console.error('[posts/createComment] error:', error)
    return res.status(500).json({ code: 500, message: error.message || '评论失败' })
  }
}

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params
    const post = await deleteCommentFromPost(id, commentId)

    if (!post) {
      return res.status(404).json({ code: 404, message: '帖子或评论不存在' })
    }

    return res.json({ code: 0, message: '删除成功', data: { success: true } })
  } catch (error) {
    console.error('[posts/deleteComment] error:', error)
    return res.status(500).json({ code: 500, message: error.message || '删除评论失败' })
  }
}

const deletePostController = async (req, res) => {
  try {
    const { id } = req.params
    const post = await deletePost(id)

    if (!post) {
      return res.status(404).json({ code: 404, message: '帖子不存在' })
    }

    return res.json({ code: 0, message: '删除成功', data: { success: true } })
  } catch (error) {
    console.error('[posts/deletePost] error:', error)
    return res.status(500).json({ code: 500, message: error.message || '删除帖子失败' })
  }
}

const likePost = async (req, res) => {
  try {
    const { id } = req.params
    const { delta = 1 } = req.body || {}

    const post = await updatePostLikes(id, delta)

    if (!post) {
      return res.status(404).json({ code: 404, message: '帖子不存在' })
    }

    return res.json({ code: 0, message: '点赞成功', data: { likes: post.likes } })
  } catch (error) {
    console.error('[posts/likePost] error:', error)
    return res.status(500).json({ code: 500, message: error.message || '点赞失败' })
  }
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  createComment,
  deleteComment,
  deletePost: deletePostController,
  likePost
}
