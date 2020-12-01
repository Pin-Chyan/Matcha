require('dotenv').config();
const router = require('express').Router();

const db = require('../database/db');
const connection = new db.dbConn();

router.route('/testroute').get( (req, res) => {
    connection.get('users', req.body.id).then((request) => {
        res.json(request.data);
    })
})

module.exports = router;