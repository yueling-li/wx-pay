const rp = require('request-promise');

exports.get = async (url) => {
    try {
        return resData = await rp(url);
    } catch(err) {
        console.log(err)
    }
}
exports.post = async (url, param) => {
    try {
        let options = {
            method: 'POST',
            uri: url,
            body: param,
            json: true
        }
        return await rp(options);
    } catch(err) {
        console.log(err)
    }
}