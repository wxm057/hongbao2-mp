export default {
  getData (key) {
    return new Promise((resolve, reject) => {
      wx.getStorage({
        key,
        success: res => resolve(String(res.data)),
        fail: reject
      })
    })
  },
  setData (key, data) {
    return new Promise((resolve, reject) => {
      wx.setStorage({
        key,
        data,
        success: resolve,
        fail: reject
      })
    })
  }
}
