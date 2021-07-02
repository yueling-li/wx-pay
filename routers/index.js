let express = require('express');
let router = express.Router();
let wxPayController = require('../controllers/pay')

router.post('/order', wxPayController.order);

module.exports = router;