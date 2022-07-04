const express = require('express');
const https = require('node:https');
const router = express.Router();
const blogController = require("../controllers/blogController");
const Transcript = require('../models/transcript');
let x = require("dotenv").config();
console.log("x")
console.log(x)
console.log(process.env.MY_VAR)
console.log(process.env.NUMBER)
console.log(process.env.ASSEMBLYAI_API_KEY)

// router.get('/all-blogs', blogController.blog_get_all)
// router.get('/blogs/create', blogController.blog_create_get )
// router.get('/blogs/:id', blogController.blog_details )
// router.get('/blogs', blogController.blog_index)
// router.post('/blogs', blogController.blog_create_post)

// https://api.assemblyai.com/v2/transcript/ouo2d25wgl-86ae-413c-93e0-ee50863c5545/sentences

// router.get('/transcript/:id/sentence', (req, res) => {
function handleIdResponse(data) {

}   

router.get('/transcript/:id', (req, res) => {
    const id = req.params.id
    const aiUrl = "https://api.assemblyai.com/v2/transcript/" + id;
    Transcript.find({"id": id}).then( result =>  {
        console.log(result)
        if (result && result > 0) {
            console.log("RESULT NOT NULL")
        }
        else {
            console.log("RESULT NOT FOUND IN DB")
            const options = { 
              headers: {
                Authorization: process.env.ASSEMBLYAI_API_KEY
              }
            }
            // let request = https.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', options, (response) => {
            let request = https.get(aiUrl, options, (response) => {
                console.log('statusCode:', response.statusCode);
                // console.log('headers:', response.headers);
                let data = ''
                response.on('data', function (chunk) {
                    console.log("chunk")
                    console.log(chunk)
                    data += chunk;
                });
            
                response.on('end', function () {
                    data = JSON.parse(data)
                    let d = delete data.words
                    console.log("data");
                    console.log(data)
                    console.log('deleted?', d);
                    if (response.statusCode >= 200 && response.statusCode < 300 && data.status == "completed") {
                        console.log("trying to save....")
                        const transcript = new Transcript(data);
                        transcript.save().then( (result) => {
                            res.send(result)
                            console.log("save success!.")
                        })
                        .catch( err => {
                            console.log("(My error) Error occured", err)
                            res.statusCode = 500
                            res.json({
                                error: "Saving data :(",
                                data: data
                            })
                        })
                    } 
                    else if (response.statusCode >= 400 || response.statusCode < 500) {
                        console.log("(400) bad request, status code: ", response.statusCode)
                        res.statusCode = 400
                        res.json({
                            error: "Bad request :( ...Likely wrong ID ",
                            data: data
                        })
                    }
                    else if (response.statusCode > 500) {
                        console.log("(500) Assembly AI server error, status code: ", response.statusCode)
                        res.statusCode = 500
                        res.json({
                            error: "Assembly AI broke :(",
                            data: data
                        })
                    }
                    // res.send(JSON.parse(data))
                });
            }).on('error', (e) => {
                console.error(e);
                res.statusCode = 404
                res.json({error: "errorx"})
                // res.end('{error: "error"}')
                // res.end(JSON.stringify({error: "error"}))
            });
        }
      // res.send(result)
    })

  // https://api.assemblyai.com/v2/transcript/ouo2d25wgl-86ae-413c-93e0-ee50863c5545/sentences
})

router.get('/test-transcript', (req, res) => {

    // const transcript = new Transcript( {
    //   "gender": "male",
    //   "name": {
    //     "title": "mr",
    //     "first": "brad",
    //     "last": "gibson"
    //   },
    //   "location": {
    //     "street": "9278 new road",
    //     "city": "kilcoole",
    //     "state": "waterford",
    //     "postcode": "93027",
    //     "coordinates": {
    //       "latitude": "20.9267",
    //       "longitude": "-7.9310"
    //     },
    //     "timezone": {
    //       "offset": "-3:30",
    //       "description": "Newfoundland"
    //     }
    //   },
    //   "email": "brad.gibson@example.com",
    //   "login": {
    //     "uuid": "155e77ee-ba6d-486f-95ce-0e0c0fb4b919",
    //     "username": "silverswan131",
    //     "password": "firewall",
    //     "salt": "TQA1Gz7x",
    //     "md5": "dc523cb313b63dfe5be2140b0c05b3bc",
    //     "sha1": "7a4aa07d1bedcc6bcf4b7f8856643492c191540d",
    //     "sha256": "74364e96174afa7d17ee52dd2c9c7a4651fe1254f471a78bda0190135dcd3480"
    //   },
    //   "dob": {
    //     "date": "1993-07-20T09:44:18.674Z",
    //     "age": 26
    //   },
    //   "registered": {
    //     "date": "2002-05-21T10:59:49.966Z",
    //     "age": 17
    //   },
    //   "phone": "011-962-7516",
    //   "cell": "081-454-0666",
    //   "id": {
    //     "name": "PPS",
    //     "value": "0390511T"
    //   },
    //   "picture": {
    //     "large": "https://randomuser.me/api/portraits/men/75.jpg",
    //     "medium": "https://randomuser.me/api/portraits/med/men/75.jpg",
    //     "thumbnail": "https://randomuser.me/api/portraits/thumb/men/75.jpg"
    //   },
    //   "nat": "IE"
    // })

    // const transcript2 = new Transcript( {
    // "gender": "female",
    // "name": {
    //     "title": "mrs",
    //     "first": "bradina",
    //     "last": "gibson"
    // },
    // "location": {
    //     "street": "X9278 new road",
    //     "city": "Xkilcoole",
    //     "state": "Xwaterford",
    //     "postcode": "X93027",
    //     "coordinates": {
    //     "latitude": "20.9267",
    //     "longitude": "-7.9310"
    //     },
    //     "timezone": {
    //     "offset": "-3:30",
    //     "description": "Newfoundland"
    //     }
    // },
    // "email": "XXbrad.gibson@example.com",
    // "login": {
    //     "uuid": "155e77ee-ba6d-486f-95ce-0e0c0fb4b919",
    //     "username": "XXsilverswan131",
    //     "password": "XXfirewall",
    //     "salt": "TQA1Gz7x",
    //     "md5": "dc523cb313b63dfe5be2140b0c05b3bc",
    //     "sha1": "7a4aa07d1bedcc6bcf4b7f8856643492c191540d",
    //     "sha256": "74364e96174afa7d17ee52dd2c9c7a4651fe1254f471a78bda0190135dcd3480"
    // },
    // "dob": {
    //     "date": "1993-07-20T09:44:18.674Z",
    //     "age": 26
    // },
    // "registered": {
    //     "date": "2002-05-21T10:59:49.966Z",
    //     "age": 17
    // },
    // "phone": "011-962-7516",
    // "cell": "081-454-0666",
    // "id": {
    //     "name": "PPS",
    //     "value": "0390511T"
    // },
    // "picture": {
    //     "large": "https://randomuser.me/api/portraits/men/75.jpg",
    //     "medium": "https://randomuser.me/api/portraits/med/men/75.jpg",
    //     "thumbnail": "https://randomuser.me/api/portraits/thumb/men/75.jpg"
    // },
    // "nat": "IE"
    // })

    const transcript3 = new Transcript( {
        bang: 'sixty nine!!',
    })
    transcript3.save().then( (result) => {
        res.send(result)
    })
    .catch( err => {
        console.log("error occured", err)
    })
})

router.get('/find-transcript', (req, res) => {
    // Transcript.find({"gender": "female"}).then( result =>  {
    // Transcript.findById("62c2e247216d43017babdb67").then( result =>  {
    Transcript.find({"id": 420}).then( result =>  {
        console.log(result)
        res.send(result)
    })
})

router.get('/null-transcript', (req, res) => {
    Transcript.find({"gender": "femaleZZZ"}).then( result =>  {
        console.log(result)
        if (result) {
            console.log("not null")
        }
        console.log(result.length)
        res.send(result)
    })
})

module.exports = router;