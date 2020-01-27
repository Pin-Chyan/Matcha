const router = require('express').Router();
let UserModels = require('../models/user.models.js');
const verifyToken = require('../auth/auth.middleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const md5 = require('md5');
const test_data = require('../test_data/default.json');
const mongoose = require('mongoose');
require('dotenv').config();

///////////////////////////////////////////////////////////////////////////////////////////////////
//
//                  <<<< Email Routes >>>>
//
const mailData = { email: 'marvan.matcha.testservice@gmail.com', password: 'Noticeme'}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mailData.email,
        pass: mailData.password
    }
});

router.route('/sendResetLink').post((req, res) => {
    const { email } = req.body;

    UserModels.find({"email": email}, "vKey").exec().then(docs => {
        let mailOptions = {
            from: mailData.email,
            to: email,
            subject: 'Password Reset',
            //TODO: Change to goto reset password page
            html: `<h2>Please click <a href="http://localhost:3000/resetPass/${docs[0].vKey}"> here </a> to reset your password.</h2><p>`
        };
        
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                return res.status(400).send(error);
            }
        });
        return res.send('email sent');
    }).catch(() => {
        res.sendStatus(404);
    })
});

router.route('/emailVerify/:vkey').post((req, res) => {
    const { vkey } = req.params;

    UserModels.find({ "vKey": vkey }).exec().then(docs => {
        if (docs[0].verified === true) {
            res.json({status: "already used"});
        } else if (docs[0].verified === false) {
            docs[0].verified = true;
            docs[0].save();
            res.json({ status: "activated"});
        } else {
            res.json({ status: "something went wrong"});
        }
    }).catch(err => {
        res.json({ status: "not found"});
    })
});

router.post('/getEmail', verifyToken, (req, res) => {
    if (!req.token) {
        res.sendStatus(403);
    }
    jwt.verify(req.token, process.env.SECRET, (err, decoded) => {
        if (err) {
            res.sendStatus(403);
        } else {
            UserModels.find({ "email": decoded.email}).exec().then(docs => {
                if (!docs[0]) {
                    res.sendStatus(404);
                }
                res.json({ email: docs[0].email });
            })
        }
    })
});

router.route('/email').post( (req, res) => {
    UserModels.find({ "email": req.body.email}).exec().then(docs => {
        res.json({'present' : docs.length});
    }).catch(err => {res.status(500).send(err)});
})


///////////////////////////////////////////////////////////////////////////////////////////////////
//
//                      <<<< User Routes >>>>
//



router.route('/add').post( (req, res) => {
    const name = req.body.name;
    const last = req.body.last;
    const password = req.body.password;
    const gender = req.body.gender;
    const age = req.body.age;
    const email = req.body.email;
    const sexual_pref = req.body.sexual_pref;
    const vKey = md5(email+Date.now());
    const verified = false;
    const location = req.body.location

    const newUser = new UserModels({
        name,
        last,
        password,
        gender,
        age,
        email,
        verified,
        sexual_pref,
        vKey,
        location
    });

    let mailOptions = {
        from: mailData.email,
        to: newUser.email,
        subject: 'Account Verification',
        html: `<h2>Please click <a href="http://localhost:3000/verify/${vKey}"> here </a> to verify your account</h2><p>`
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            res.status(400).send(error);
        }
    });

    bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
        if(err) throw err;
        newUser.password = hash;
        newUser.save().then( () => res.json('User added') )
        .catch( err => res.status(400).json('Error: ' + err));
    }));
});

router.route('/verifyKey/:vkey').get((req, res) => {
    const { vkey } = req.params;

    UserModels.find({ "vKey": vkey }).exec().then(docs => {
        res.json({ validKey: true, email: docs[0].email });
    }).catch(() => {
        res.json({ validKey: false, email: "" });
    })
});

router.route('/resetPassword/:vKey').post((req, res) => {
    const { email, newPassword } = req.body;
    const { vKey } = req.params;

    UserModels.find({ "email": email }).exec().then(docs => {
        if (docs[0].vKey === vKey) {
            bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newPassword, salt, (err, hash) => {
                if(err) throw err;
                docs[0].password = hash;
                docs[0].save();
            }));
            return res.json({ updated: true });
        } else {
            return res.json({ updated: false });
        }
    }).catch(() => {
        res.json({ updated: false });
    })
});

router.route('/emailVerify/:vkey').post((req, res) => {
    const { vkey } = req.params;

    UserModels.find({ "vKey": vkey }).exec().then(docs => {
        if (docs[0].verified === true) {
            res.json({status: "already used"});
        } else if (docs[0].verified === false) {
            docs[0].verified = true;
            docs[0].save();
            res.json({ status: "activated"});
        } else {
            res.json({ status: "something went wrong"});
        }
    }).catch(err => {
        res.json({ status: "not found"});
    })
});

// router.route('/like').post( (req, res) => {
//     if (!req.body.token && !req.body.email && !req.body.target)
//         req.json("error");
//     UserModels.find({"email": req.body.target}, "_id").exec().then(docs => {
//             UserModels.findOne({"email": req.body.email}, "likes").exec().then(docs2 => {
//                 if (!docs2.likes.includes(docs._id)){
//                     var like = docs2.likes;
//                     like.push(docs._id);
//                     docs2.likes = like;
//                     console.log('like added');
//                     docs2.save().then(r => {res.json("liked")}).catch(err => {res.json(err)});
//                 }
//                 else
//                     res.json("Already Liked!");
//             })
//     }).catch(err => {res.json(err)})
// })

// router.route('/Del_like').post( (req, res) => {
//     if (!req.body.token || !req.body.target || !req.body.email)
//         req.json("error");
//     UserModels.find({"email": req.body.target}, "_id").exec().then(docs => {
//             UserModels.findOne({"email": req.body.email}, "likes").exec().then(docs2 => {
//                 if (docs2.likes.includes(docs._id)){
//                     var index = docs2.likes.findIndex(function (ret){return ret === docs._id});
//                     docs2.likes.splice(index,1);
//                     docs2.save().then(r => {res.json("Like removed")}).catch(err => {res.json(err)});
//                 }
//                 else
//                 res.json("Not Liked");
//             })
//     }).catch(err => {res.json(err)})
// })

router.post('/get_spec', (req, res) => {
    if (!req.body.token || !req.body.target || !req.body.email)    
        res.status(403).send('empty fields');
    UserModels.find({ "email": req.body.email},req.body.target + " token").exec().then(docs => {
        if ((req.body.token === docs[0].token) || (req.body.token === "admin")){
            // console.log(docs);
            res.json(docs);
        }
        else
            res.status(400).send('Forbbiden');
    }).catch(err => { res.status(500).send(err) });
})

router.post('/get_soft', (req, res) => {
    if (!req.body.token || !req.body.target || !req.body.email || !req.body.target_email)    
        res.status(403).send('empty fields');
    else if (req.body.target.includes('password'))
        res.status(400).send('Forbbidden');
    else{
        UserModels.find({ "email": req.body.email},req.body.target + " token").exec().then(docs => {
            if ((req.body.token === docs[0].token) || (req.body.token === "admin")){
                UserModels.find({"email":req.body.target_email},req.body.target).then(soft_data => {
                    console.log(req.body.target_email);
                    console.log(soft_data);
                    res.json(soft_data[0]);
                })
            }
            else
                res.status(400).send('Forbbiden');
        }).catch(err => { res.status(500).send(err) });
    }
})

router.post('/get_soft_by_id', verifyToken, (req, res) => {
  if (!req.token || !req.body.id || !req.body.target) {
    return res.status(400).send('Missing Fields')
  }
  if (req.body.target.includes('password')) {
    return res.sendStatus(403)
  }
  if (req.token !== 'admin') {
    jwt.verify(req.token, process.env.SECRET, (err, decoded) => {
      if (err) {
        return res.sendStatus(403)
      }
    })
  }
  UserModels.findById(req.body.id, req.body.target).exec().then(userData => {
    console.log(userData)
    return res.json(userData)
  }).catch(err => { res.status(500).send(err) })
})

router.route('/edit_spec').post( (req, res) => {
    if (req.body.token){
        UserModels.find({'email':req.body.email}).exec().then(doc => {
            if ((req.body.token == doc[0].token || req.body.token == "admin") && (req.body.token != "")) {
                UserModels.findOne({'email':req.body.email}).exec().then(doc => {
                    if (req.body.name)
                        doc.name = req.body.name;
                    if (req.body.last)
                        doc.last = req.body.last;
                    if (req.body.msg)
                        doc.msg = req.body.msg;
                    if (req.body.password)
                        doc.password = req.body.password;
                    if (req.body.gender)
                        doc.gender = req.body.gender;
                    if (req.body.age)
                        doc.age = req.body.age;
                    if (req.body.new_email)
                        doc.email = req.body.new_email;
                    if (req.body.sexual_pref !== undefined)
                        doc.sexual_pref = req.body.sexual_pref;
                    if (req.body.tag)
                        doc.tag = req.body.tag;
                    if (req.body.bio)
                        doc.bio = req.body.bio;
                    if (req.body.img){
                        if (req.body.img.img1)
                            doc.img.img1 = req.body.img.img1;
                        if (req.body.img.img2)
                            doc.img.img2 = req.body.img.img2;
                        if (req.body.img.img3)
                            doc.img.img3 = req.body.img.img3;
                        if (req.body.img.img4)
                            doc.img.img4 = req.body.img.img4;
                        if (req.body.img.img5)
                            doc.img.img5 = req.body.img.img5;
                    }
                    doc.save().then(r => {res.status(200).send("saved")}).catch(err => {res.status(500).send(err)});
                })
            }
            else 
                res.status(403).send("Invalid Token");
        })
    }
    else
        res.status(400).send("no Token Present");
})

router.route('/email').post( (req, res) => {
    UserModels.find({ "email": req.body.email}).exec().then(docs => {
        return res.json({'present' : docs.length});
    })
})

router.route('/get_next').post( (req, res) => {
    if (req.body.token)
            UserModels.find({ "email": req.body.email},req.body.target + " token").exec().then(docs => {
                if ((req.body.token == docs[0].token) || (req.body.token == "admin")){
                    UserModels.find({},"img email name tag like last bio").exec().then(doc2 => {
                        var data = {};
                        data.max = doc2.length;
                        var pos = req.body.position;
                        if (doc2.find(function (res){return res.email == req.body.email;}))
                            data.max--;
                        if (doc2[pos].email == req.body.email){
                            if (pos + 1 > data.max)
                                res.status(204).send("end");
                            else
                                pos++;
                        }
                        data.ret = doc2[pos];
                        res.json(data);
                    }).catch(err => {console.log(err)})
                }
                else
                    res.status(403).send("invalid token");
            }).catch(err => {res.status(500).send(err)})
        else
            res.status(400).send("no target");
})

router.route('/load_data').post( (req, res) => {
    // res.json(test_data);
    var dlen = test_data.length;
    console.log(dlen);
    var i = 0;
    for (i  = 0; i < dlen; i++){
        var new_user = test_data[i];
        if (new_user.age < 18)
            new_user.age = 18;
        let user = new UserModels(new_user);
        console.log(test_data[i].name)
        bcrypt.genSalt(10, (err, salt) => bcrypt.hash(user.password, salt, (err, hash) => {
            if(err) throw err;
            user.password = hash;
            user.save().then(() => {console.log('added')}).catch(err => {console.log(err)});
        }));
    }
    res.json("done");
})

router.route('/purge').post( (req, res) => {
    if (req.body.token === "admin"){
    mongoose.connect(process.env.ATLAS_URI,function(){
        mongoose.connection.db.dropDatabase();
        res.json('purged');
    }).catch(err => { res.stats(500).send("mongoose not present")});
    } else {
        res.status(403).send("Forbbiden");
    }
})

///////////////////////////////////////////////////////////////////////////////////////////////////
//
//                      <<<< Like Routes >>>>
//

function fame_handle(req, fame){
    UserModels.findOne({"email": req.body.target}, "fame").exec().then(docs => {
        if (fame === "decrease"){
            docs.fame--;
            docs.save().catch(err => {console.log(err)});
        }
        else if (fame === "increase"){
            docs.fame++;
            docs.save().catch(err => {console.log(err)});
        }
        else
            throw err;
    }).catch(err => {console.log(err)})
}

function liked_handle(req, _id, check){
    UserModels.findOne({"email": req.body.target}, "_id liked").exec().then(docs => {
        console.log(docs);
        if (check === "add"){
            var array = docs.liked;
            array.push(_id);
            docs.liked = array;
            docs.save().catch(err => {console.log(err)});
        }
        else if (check === "remove"){
            var array = docs.liked;
            var pos = array.indexOf(_id);
            if (pos === -1)
                console.log("did not find position in liked array");
            else
                array.splice(pos, 1);
            docs.liked = array;
            docs.save().catch(err => {console.log(err)});
        }
        else 
            throw err;
    }).catch(err => {console.log(err)})
}

function notification_handle(req, check, sender){
    UserModels.findOne({"email": req.body.target}).exec().then(docs => {
        if(check === "like"){
            var user = docs;
            const msg = sender+" has liked your profile!";
            const NewNotify = { message: msg, viewed: false }
            user.notifications.push(NewNotify);
            docs = user;
            docs.save().catch(err => {console.log(err)});
        }
        else if (check === "match"){
            var user = docs;
            const msg = "You have matched with "+sender+"! Don't be shy to message first!";
            const NewNotify = { message: msg, viewed: false }
            user.notifications.push(NewNotify);
            docs = user;
            docs.save().catch(err => {console.log(err)});
        }
        else
            console.log("error");
    }).catch(err => {console.log(err)})
}

function match_handle(req, target_id, sender, reciever){
    UserModels.findOne({"email": req.body.email}).exec().then(docs => {
        var liked_array = docs.liked;
        if (liked_array.includes(target_id)){
            notification_handle(req, "match", sender);
            var user = docs;
            const msg = "You have matched with "+reciever+"! Don't be shy to message first!";
            const NewNotify = { message: msg, viewed: false }
            user.notifications.push(NewNotify);
            docs = user;
            docs.save().catch(err => {console.log(err)});
        }
        else
            notification_handle(req, "like", sender);
    }).catch(err => {console.log(err)})
}

router.route('/like').post( (req, res) => {
    if (!req.body.token && !req.body.email && !req.body.target)
        req.json("error");
    UserModels.find({"email": req.body.target}, "_id liked name last").exec().then(docs => {
        UserModels.findOne({"email": req.body.email}, "_id likes name last").exec().then(docs2 => {
            if (!docs2.likes.includes(docs[0]._id)){
                var sender = docs2.name+" "+docs2.last;
                var reciever = docs[0].name+" "+docs[0].last;
                fame_handle(req, "increase");
                liked_handle(req, docs2._id,"add");
                match_handle(req,docs[0]._id, sender, reciever);
                var like = docs2.likes;
                like.push(docs[0]._id);
                docs2.likes = like;
                docs2.save().then(r => {res.json("liked")}).catch(err => {res.json(err)});
            }
            else
            res.json("Already Liked!");
        })
    }).catch(err => {res.json(err)})
})

router.route('/Del_like').post( (req, res) => {
    if (!req.body.token || !req.body.target || !req.body.email)
        req.json("error");
    UserModels.find({"email": req.body.target}, "_id").exec().then(docs => {
        console.log(docs[0]);
            UserModels.findOne({"email": req.body.email}, "likes").exec().then(docs2 => {
                if (docs2.likes.includes(docs[0]._id)){
                    fame_handle(req, "decrease");
                    liked_handle(req, docs2._id,"remove");
                    var index = docs2.likes.findIndex(function (ret){return ret === docs[0]._id});
                    docs2.likes.splice(index,1);
                    docs2.save().then(r => {res.json("Like removed")}).catch(err => {res.json(err)});
                }
                else
                res.json("Not Liked");
            })
    }).catch(err => {res.json(err)})
})


module.exports = router;
