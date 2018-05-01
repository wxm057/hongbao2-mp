export default (options = {}) => {
  return new Promise((resolve, reject) => {
    options.success = resolve
    options.fail = reject
    wx.scanCode(options)
  })
}
