const express = require('express')
const app = express()
const bodyParser = require('body-parser');

app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));
app.use(require('./routers/index'));
app.listen(3008, () => console.log(`Example app listening on port ${3008}!`))