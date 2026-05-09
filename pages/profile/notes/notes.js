const { profileAPI } = require('../../../services/api')
const { isUserLogin } = require('../../../utils/util')

Page({
  data: {
    defaultNotes: [
      {
        id: 1,
        avatar: '张',
        name: '张同学',
        time: '今天 12:30',
        content: '读到这里很触动，吴健雄先生在那个年代作为女性从事物理研究，需要多大的勇气和毅力。',
        likes: 12
      },
      {
        id: 2,
        avatar: '李',
        name: '李同学',
        time: '今天 10:15',
        content: '作为理科生，感觉实验的严谨性和美感在先生身上得到了完美体现。',
        likes: 8
      },
      {
        id: 3,
        avatar: '王',
        name: '王同学',
        time: '昨天 22:40',
        content: '先生的家国情怀令人敬佩，学术无国界，但学者有祖国。',
        likes: 24
      }
    ],
    notes: []
  },

  async onShow() {
    if (isUserLogin()) {
      try {
        const data = await profileAPI.getData()
        this.setData({ notes: (data.notes && data.notes.length > 0) ? data.notes : this.data.defaultNotes })
        return
      } catch (err) {
        // fallthrough to local storage fallback
      }
    }

    const savedNotes = wx.getStorageSync('myNotes')
    const notes = savedNotes && savedNotes.length > 0 ? savedNotes : this.data.defaultNotes

    this.setData({ notes })
  }
})
