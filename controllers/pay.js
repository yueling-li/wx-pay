
const crypto = require('crypto');
const util = require('../lib/httpret');
const moment = require('moment');
const { wx: { appid, secret, mchId, key } } = require('../config/index');
const { get, post } = require('../lib/request')
const JSCODE2SESSIONURL = 'https://api.weixin.qq.com/sns/jscode2session';
const UNIFIEDORDERURL = 'https://api.mch.weixin.qq.com/pay/unifiedorder'


/**
 * order
 * @param {String} code 登录时获取的 code
 * @param {Number} totalFee 标价金额
 * @param {String} spbillCreateIp 终端IP 调用微信支付API的机器IP
 * @param {String} notifyUrl 通知地址  异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数
 */
exports.order = async (req, res, next) => {
    try {
        let {code, totalFee, spbillCreateIp = '127.0.0.1', notifyUrl} = req.body || {};
        let bookingNo = moment().format('YYYYMMDDHHmmss') + parseInt(Math.random() * 1000000);
        let url = `${JSCODE2SESSIONURL}?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
        let resData = await get(url);
        resData = JSON.parse(resData);
        if (resData.errcode !== 0) {
            return util.fail(res, {code: resData.errcode, msg: resData.errmsg})
        }
        let { openid } = resData;
        let wxPay = new WxPay({appid, mchId, key, notifyUrl});
        let data = wxPay.order({attach: '测试', body: '测试', openid, bookingNo, totalFee, ip: spbillCreateIp});
        if (data) {
            return util.success(res, data)
        }
        return util.fail(res, { msg: '下单失败' });
    } catch (err) {
        console.log(err)
    }
}

/* 支付流程 */
class WxPay {
    /**
     * @param {Object} opts 
     *  appid {String} 小程序ID
     *  mchId {String} 商户号
     *  key {String} key为商户平台设置的密钥key
     *  notifyUrl 通知地址
     */
    constructor (opts) {
        this.opts = opts || {};
        this.appid = this.opts.appid || "";
        this.mchId = this.opts.mchId || "";
        this.key = this.opts.key || "";
        this.notifyUrl = this.opts.notifyUrl || ""; 
    }
    /**
     * 下单支付
     * @param {*} attach 附加数据
     * @param {String(128)} body 商品描述
     * @param {String(128)} openid 用户标识
     * @param {String(32)} bookingNo 商户订单号
     * @param {Number} totalFee 标价金额
     * @param {*} ip 终端IP
     */
    async order (attach, body, openid, bookingNo, totalFee, ip)  {
        let self = this;
        let noncestr = self._createNonceStr();
        let timeStamp = self._createTimeStamp();
        let formData = `<xml> 
                        <appid>${self.appid}</appid>
                        <attach>${attach}</attach>
                        <body>${body}<body>
                        <mch_id>${self.mchId}</mch_id>
                        <nonce_str>${noncestr}</nonce_str>
                        <notify_url>${self.notifyUrl}</notify_url>
                        <openid>${openid}</openid>
                        <out_trade_no>${bookingNo}</out_trade_no>
                        <spbill_create_ip>${ip}</spbill_create_ip>
                        <total_fee>${totalFee}</total_fee>
                        <trade_type>JSAPI</trade_type>
                        <sign>${self._jsApiSign(attach, body, openid, bookingNo, ip, totalFee, 'JSAPI')}</sign>
                        </xml>
                        `
        let resData = await post(UNIFIEDORDERURL, formData);
        if (resData.statusCode === 'SUCCESS') {
            let body = resData.body;
            let prepay_id = self._getXMLNodeValue('prepay_id', body.toString("utf-8"));
            let tmp = prepay_id.split('[');
            let tmp1 = tmp[2].split(']');
            //签名
            let paySignjs = self._paysignjs('prepay_id=' + tmp1[0], 'MD5');
            let args = {
                appId: self.appid,
                timeStamp: timeStamp,
                nonceStr: noncestr,
                signType: "MD5",
                package: tmp1[0],
                paySign: paySignjs
            };
            return args;   
        }
        return false;
    };
    //解析xml
    _getXMLNodeValue (node_name, xml) {
        let tmp = xml.split("<" + node_name + ">");
        let _tmp = tmp[1].split("</" + node_name + ">");
        return _tmp[0];
    }
    //微信排序算法
    _raw (args) {
        let keys = Object.keys(args);
        keys = keys.sort();
        let newArgs = {};
        keys.forEach((key) =>{
            newArgs[key] = args[key];
        });
        let string = '';
        for (let k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    }
    //随机字符串
    _createNonceStr () {
        return Math.random().toString(36).substr(2, 15);
    }
    //时间戳
    _createTimeStamp () {
        return parseInt(new Date().getTime() / 1000) + '';
    }
    //支付签名
    _paysignjs (_package, signType) {
        let self = this;
        let ret = {
            appId: self.appid,
            nonceStr: self._createNonceStr(),
            package: _package,
            signType: signType,
            timeStamp: self._createTimeStamp()
        };
        let string = self._raw(ret);
        string = string + '&key=' + self.key;
        let sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        return sign.toUpperCase();
    };
    //jsapi签名
    _jsApiSign (attach, body, openid, outTradeNo, spbillCreateIp, totalFee, tradeType) {
        let self = this;
        let ret = {
            appid: self.appid,
            attach: attach,
            body: body,
            mch_id: self.mchId,
            nonce_str: self._createNonceStr(),
            notify_url: self.notifyUrl,
            openid: openid,
            out_trade_no: outTradeNo,
            spbill_create_ip: spbillCreateIp,
            total_fee: totalFee,
            trade_type: tradeType
        };
        let string = self._raw(ret);
        string = string + '&key=' + self.key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
        let sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        return sign.toUpperCase();
    };
};
