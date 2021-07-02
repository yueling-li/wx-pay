exports.success = function (res, obj) {
    var result = {};
    if (obj != null) {
        result.data = obj;
    }
    result.code = 200;
    res.status(200).header({'Content-Type': 'application/json'}).json(result);
}
exports.fail = function (res, obj) {
    var result = {code: 500};
    obj ? result.msg = obj : '';
    res.status(200).header({'Content-Type': 'application/json'}).json(result);
}