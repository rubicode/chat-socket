const bcrypt = require('bcrypt');
const saltRounds = 10;
const secretKey = 'rubicamp'

var jwt = require('jsonwebtoken');

const helper = {
    hashPassword: function (password) {
        return bcrypt.hashSync(password, saltRounds);
    },
    comparePassword: function (password, hash) {
        return bcrypt.compareSync(password, hash);
    },
    generateToken: function (data) {
        return jwt.sign(data, secretKey);
    },
    decodeToken: function (token) {
        return jwt.verify(token, secretKey);
    },
    checkToken: function (req, res, next) {
        try {
            const bearerToken = req.header('Authorization')
            const token = bearerToken.slice(7)
            const data = helper.decodeToken(token)
            req.userId = data.userId
            next()
        } catch (error) {
            console.log(error)
            res.status(401).json({ message: "token invalid" })
        }
    }
}

module.exports = helper