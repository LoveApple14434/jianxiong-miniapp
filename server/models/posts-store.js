const fs = require('fs')
const path = require('path')

const postsFilePath = path.join(__dirname, '..', 'data', 'posts.json')

const ensurePostsFile = async () => {
  const directory = path.dirname(postsFilePath)
  await fs.promises.mkdir(directory, { recursive: true })

  try {
    await fs.promises.access(postsFilePath, fs.constants.F_OK)
  } catch (error) {
    await fs.promises.writeFile(postsFilePath, JSON.stringify([], null, 2), 'utf8')
  }
}

const readPosts = async () => {
  await ensurePostsFile()
  const fileContent = await fs.promises.readFile(postsFilePath, 'utf8')
  try {
    return JSON.parse(fileContent || '[]')
  } catch (error) {
    return []
  }
}

const savePosts = async posts => {
  await ensurePostsFile()
  await fs.promises.writeFile(postsFilePath, JSON.stringify(posts, null, 2), 'utf8')
}

const getAllPosts = async () => {
  return await readPosts()
}

const getPostById = async postId => {
  const allPosts = await readPosts()
  return allPosts.find(post => String(post.id) === String(postId)) || null
}

const addPost = async post => {
  const allPosts = await readPosts()
  allPosts.unshift(post)
  await savePosts(allPosts)
  return post
}

const addCommentToPost = async (postId, comment) => {
  const allPosts = await readPosts()
  const idx = allPosts.findIndex(post => String(post.id) === String(postId))

  if (idx === -1) {
    return null
  }

  const post = allPosts[idx]
  post.commentsList = Array.isArray(post.commentsList) ? post.commentsList : []
  post.commentsList.unshift(comment)
  post.comments = post.commentsList.length

  await savePosts(allPosts)
  return post
}

const deleteCommentFromPost = async (postId, commentId) => {
  const allPosts = await readPosts()
  const idx = allPosts.findIndex(post => String(post.id) === String(postId))

  if (idx === -1) {
    return null
  }

  const post = allPosts[idx]
  post.commentsList = Array.isArray(post.commentsList) ? post.commentsList : []
  const commentIndex = post.commentsList.findIndex(comment => String(comment.id) === String(commentId))

  if (commentIndex === -1) {
    return null
  }

  post.commentsList.splice(commentIndex, 1)
  post.comments = post.commentsList.length

  await savePosts(allPosts)
  return post
}

const deletePost = async postId => {
  const allPosts = await readPosts()
  const idx = allPosts.findIndex(post => String(post.id) === String(postId))

  if (idx === -1) {
    return null
  }

  const deletedPost = allPosts.splice(idx, 1)[0]
  await savePosts(allPosts)
  return deletedPost
}

const updatePostLikes = async (postId, delta) => {
  const allPosts = await readPosts()
  const idx = allPosts.findIndex(post => String(post.id) === String(postId))

  if (idx === -1) {
    return null
  }

  const post = allPosts[idx]
  const currentLikes = Number(post.likes) || 0
  post.likes = Math.max(0, currentLikes + Number(delta))

  await savePosts(allPosts)
  return post
}

module.exports = {
  getAllPosts,
  getPostById,
  addPost,
  addCommentToPost,
  deleteCommentFromPost,
  deletePost,
  updatePostLikes
}
