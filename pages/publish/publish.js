// pages/publish/publish.js
Page({
  data: {
    topics: [
      { id: 1, name: '读后感' },
      { id: 2, name: '科学家精神' },
      { id: 3, name: '健雄精神' },
      { id: 4, name: '活动打卡' }
    ],
    selectedTopicId: 1,
    content: '',
    images: []       // 暂不实现真实图片上传，仅占位
  },

  onTopicChange(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedTopicId: id });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  chooseImage() {
    wx.showToast({ title: '图片上传暂未开放', icon: 'none' });
  },

  publish() {
    const content = this.data.content.trim();
    if (!content) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    const app = getApp();
    const userInfo = app.getAuthState ? app.getAuthState().userInfo : null;
    const name = userInfo && userInfo.nickName ? userInfo.nickName : '我';
    const avatar = name.charAt(0);
    const topic = this.data.topics.find(t => t.id === this.data.selectedTopicId);
    const newPost = {
      id: Date.now(),
      avatar: avatar,
      name: name,
      time: '刚刚',
      topicId: this.data.selectedTopicId,
      tag: topic.name,
      content: content,
      images: [],     // 图片暂不实现
      likes: 0,
      commentsList: [],
      isLiked: false
    };

    // 读取现有帖子列表，添加后保存
    let allPosts = wx.getStorageSync('community_posts') || [];
    allPosts.unshift(newPost);
    wx.setStorageSync('community_posts', allPosts);

    wx.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
});