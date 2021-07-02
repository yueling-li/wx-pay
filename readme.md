### 开发文档

**参考链接：**[微信小程序支付业务流程](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=7_4&index=3)
[auth.code2Session](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html)
[统一下单](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_1&index=1)


### 接口文档

#### POST [/order]
+ 参数
    * code: 登录时获取的 code
    * totalFee: 标价金额
	* spbillCreateIp: 终端IP 调用微信支付API的机器IPc
    * notifyUrl: 通知地址  异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数
+ 返回值 (application/json) (https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=7_7&index=3)

    ```js
    {
        "code":"0",
        "data":{
            "appId": "xxx", //微信分配的小程序ID
            "timeStamp": "xxx", //时间戳
            "nonceStr": "xxx", //随机串
            "signType": "MD5", //签名方式
            "package": "xxx", //数据包
            "paySign": "xxx" //签名
        }
    }
    ```