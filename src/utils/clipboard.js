export default {
  getData () {
    return new Promise((resolve, reject) => {
      wx.getClipboardData({
        success: res => resolve(String(res.data)),
        fail: reject
      })
    })
  },
  setData (data) {
    return new Promise((resolve, reject) => {
      wx.setClipboardData({
        data,
        success: resolve,
        fail: reject
      })
    })
  }
}
