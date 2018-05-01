import qs from 'qs'

export default (options = {}) => {
  return new Promise((resolve, reject) => {
    options.header = options.header || {}
    if (options.method === 'POST' && !('content-type' in options.header)) {
      options.header['content-type'] = 'application/x-www-form-urlencoded'
    }
    options.data = qs.stringify(options.data)
    options.success = res => resolve(res.data || {})
    options.fail = reject
    wx.request(options)
  })
}
