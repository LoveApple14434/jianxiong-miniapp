// pages/mynotes/mynotes.js
Page({
  data: {
    notes: []
  },

  onShow() {
    this.loadNotes()
  },

  loadNotes() {
    const myNotes = wx.getStorageSync('myNotes') || []
    this.setData({ notes: myNotes })
  },

  // 点赞/取消点赞
  toggleLike(e) {
    const id = e.currentTarget.dataset.id
    let notes = this.data.notes
    const index = notes.findIndex(item => item.id === id)
    if (index !== -1) {
      if (notes[index].isLiked) {
        notes[index].likes--
        notes[index].isLiked = false
      } else {
        notes[index].likes++
        notes[index].isLiked = true
      }
      this.setData({ notes })
      // 同步到本地存储
      wx.setStorageSync('myNotes', notes)
    }
  }
})