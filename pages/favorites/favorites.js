// pages/favorites/favorites.js
Page({
  data: {
    favorites: []
  },

  onShow() {
    this.loadFavorites();
  },

  loadFavorites() {
    const favorites = wx.getStorageSync('favorites') || [];
    this.setData({ favorites });
  },

  // 可选：点击收藏的笔记可以跳转到对应章节（需要实现章节定位，此处先给提示）
  goToChapter(e) {
    const chapterTitle = e.currentTarget.dataset.chapterTitle;
    wx.showToast({ title: `跳转到${chapterTitle}`, icon: 'none' });
    // 实际开发中可以跳转到 reading 页面并传递章节参数
  }
});