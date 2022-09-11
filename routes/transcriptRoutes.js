const express = require('express');
// const https = require('node:https');
const https = require('https');
const router = express.Router();
const blogController = require("../controllers/blogController");

const { Captions } = require('../models/captions');
const { Clip } = require('../models/captions');
const common = require('../controllers/common.js');
require("dotenv").config();
const allVids = require("../models/allVids");
const parseString = require('xml2js').parseString;
const VidData = require('../models/VidData');
const { S3_vid_path } = require('../models/Constantz.js');

const csv = require("csvtojson");
const { parseStringPromise } = require('xml2js');

var ObjectId = require('mongoose').Types.ObjectId; 

// https://api.assemblyai.com/v2/transcript/ouo2d25wgl-86ae-413c-93e0-ee50863c5545/sentences

router.get("/search", async (req, res) => {
    console.log("__dirname", __dirname)
    console.log("__dirname", __dirname)
    res.render("transcripts/search")
})

// Returns the Vod and just the single clip
router.get("/vods/all", async (req, res) => {

    let vods = await Captions.find( {}, {
            _id: 1,
            title: 1,
            csvPath: 1,
            vidPath: 1,
            vidTitle: 1,
        }
    ).then( result => {
        return result
    })
    res.render("./transcripts/allVods", {vods})
})

router.get("/vods/:id", async (req, res) => {
    console.log('/vods/:id - req.params', req.params)
    const id = req.params.id

    let vod = await Captions.findById(id)
        .then( result => {
            console.log("result", result)
            return result
    })

    res.render("./transcripts/searchResults", {
        h2: "Vod id: " + id,
        search: id, 
        results: [vod]
    })
})

router.get("/clips/:id", async (req, res) => {
    console.log('req.params', req.params)
    const id = req.params.id
    let clip = await Captions.find( 
        {"clips._id" : ObjectId(id) },
        {
              title: 1,
              csvPath: 1,
              vidPath: 1,
              vidTitle: 1,
              clips: {
                $filter: {  
                  input: "$clips",
                  as: "theclips",
                  cond: {
                    "$eq": ["$$theclips._id", ObjectId(id) ]
                  },
                }
              }
          }
    ).then( result => {
        console.log("clip result", result)
        return result
    })
    .catch(err => {
        res.status(404).redirect('/404.html')
    })

    res.render("./transcripts/searchResults", {
        h2: "Clip id: " + id,
        search: id, 
        results: clip 
    })
})
router.get("/api/search", async (req, res) => {
    console.log("got this req.query", req.query);

    let search = common.processQuery(req.query.search);
    // processQuery("big nasty string");
    console.log("QUERY SEARCH FINAL =", search);
    let searchResults = await Captions.aggregate([
        { $limit: 100 },
        {
            $project: {
              _id: 1,
              title: 1,
              csvPath: 1,
              vidPath: 1,
              vidTitle: 1,
            //   queriedCaptions: {
              clips: {
                $filter: {  
                  input: "$clips",
                  as: "theclips",
                  cond: {
                    "$regexMatch": {
                      "input": "$$theclips.Transcript",
                      // "regex": "trump|New York",
                      "regex": search,
                      "options": "i"
                    }
                  },
                //   $limit: 2, AVAILABLE IN MONGO VERISON 6 (have to pay :(  
                }
              }
            }
          }    
    ]).then( rez => {
        var replace = `\\b${search}s?\\b`;
        var re = new RegExp(replace,"gmi");
        rez.forEach( vodAndClips => {
            vodAndClips.clips.forEach( (clip, i, ownArr) => {
            clip.Transcript = clip.Transcript.replaceAll(re, `<span class="highlight">${search}</span>`) // syntax stuff for "OR"
            })
        })
        return rez
    })
    console.log("searchResults", searchResults)
    // console.debug("%o",searchResults)
    console.log("****")

    res.render("./transcripts/searchResults", {
        search: search, 
        results: searchResults 
    })
})

    // not working http://localhost:3000/vods/631b1e9ad0f891998d449c7b
    // not working http://localhost:3000/vods/631b297e4cfec30d539ae367

    // Fake chall
    // ObjectId("631b1e98d0f891998d43963b
    // ObjectId("631b29784cfec30d539a5d0f
    // ObjectId("631b297a4cfec30d539aa3a5
    // ObjectId("631b297e4cfec30d539ad804
    // ObjectId("631b297e4cfec30d539ae07a 
    // ObjectId("631b297f4cfec30d539aeafc
    // ObjectId("631b297e4cfec30d539ae0a0
    // ObjectId("631b297f4cfec30d539aeafd
    // ObjectId("631b297f4cfec30d539aeb75
    // ObjectId("631b297e4cfec30d539ae3f7
    // ObjectId("631b297e4cfec30d539ae478
    // ObjectId("631b29774cfec30d539a5a73 ???
    // ObjectId("631b297d4cfec30d539acc8a
    // ObjectId("631b29774cfec30d539a2b96
    // ObjectId("631b297a4cfec30d539aa6e8
    // ObjectId("631b297a4cfec30d539aa6fc
    // ObjectId("631b29774cfec30d539a39f5 macro easy
    // ObjectId("631b29774cfec30d539a2eb4
    // ObjectId("6319d32fdea50b763ba2534a



    // 1st humble ever
    // ObjectId("631b29794cfec30d539a7f2d

    // honorabl mention (i have no life)


    // NOT CHALL ANY MORE - season 9
    // ObjectId("631b297d4cfec30d539ad15e
    // ObjectId("631b297e4cfec30d539ad714
    // ObjectId("631b297a4cfec30d539aa56b
    // ObjectId("631b297a4cfec30d539aa6fc
    // ObjectId("631b297a4cfec30d539aa714
    // ObjectId("631b297a4cfec30d539aa277
    // ObjectId("631b1e9ad0f891998d4471bf
    // ObjectId("631b1e99d0f891998d43df07

router.get("/editors-choice", async (req, res) => {
    let choices = [
                    ObjectId("631b297e4cfec30d539ae088"),
                    ObjectId("631b297c4cfec30d539ac4f3"), // this
                    ObjectId("631b297c4cfec30d539ab317"),
                    ObjectId("631b29774cfec30d539a0c32"),
                    ObjectId("631b297e4cfec30d539ad741"),
                    ObjectId("631b29794cfec30d539a7ffa"),
                    ObjectId("631b29774cfec30d539a27ee"),
                    ObjectId("631b29774cfec30d539a27e5"),
                    ObjectId("631b29774cfec30d539a0bc1"),  
                    ObjectId("6316dd815f6a34df594b9fad"),
                    ObjectId("631b1e9ad0f891998d444d7d"), // coaching a chall            
                
                    ObjectId("631b29784cfec30d539a6afd"),
                    ObjectId("631b297a4cfec30d539a9ae1"),
                    ObjectId("631b297a4cfec30d539a9ae2"),
                    ObjectId("631b297a4cfec30d539a9d81"),
                    ObjectId("631b297c4cfec30d539aaed5"),
                    ObjectId("631b297c4cfec30d539ab00c"), // chall level knowledge
                    ObjectId("631b297c4cfec30d539ac39d"),
                    ObjectId("631b297c4cfec30d539ac4ab"), // diamond harder than chall
                    ObjectId("631b297a4cfec30d539aa3ca"),
                    
                    ObjectId("631b29774cfec30d539a2b36"),
                    ObjectId("631b29774cfec30d539a51cf"),
                    ObjectId("631b29784cfec30d539a7ae4"),
                    ObjectId("631b29774cfec30d539a1bb9"),
                    ObjectId("631b1e99d0f891998d43c6df"),
                    ObjectId("631b1e99d0f891998d443485"),
                    ObjectId("631b1e9ad0f891998d4471a9"),
                    ObjectId("6319d32fdea50b763ba255f6"),
                    ObjectId("631b1e98d0f891998d4395a0"),
                  ];
    let search = "challenger";


    let clip = await Captions.find( 
        {"clips._id" : { "$in" : choices }},
        {
              title: 1,
              csvPath: 1,
              vidPath: 1,
              vidTitle: 1,
              clips: {
                $filter: {  
                  input: "$clips",
                  as: "theclips",
                  cond: {
                    "$in": ["$$theclips._id", choices ]
                  },
                }
              }
          }
    ).then( rez => {
        let search = "challenger"
        var replace = `\\b${search}s?\\b`;
        var re = new RegExp(replace,"gmi");
        rez.forEach( vodAndClips => {
            vodAndClips.clips.forEach( (clip, i, ownArr) => {
            clip.Transcript = clip.Transcript.replaceAll(re, `<span class="highlight">${search}</span>`) // syntax stuff for "OR"
            })
        })
        return rez
    })
    .catch(err => {
        res.status(404).redirect('/404.html')
    })
    // console.log("clip", clip)
    console.debug("CLIP!")
    console.debug("%o",clip)
    console.log("*******")
    // let geraWantsFull = clip.map( c => {
    //     return { 
    //             "path": process.env.CDN_DOMAIN + '/' + c.vidPath?.replaceAll(" ", "+").replaceAll("#", "%23"),
    //             "time": c.clips.map( actual_clip => actual_clip['Start Time'])
    //         };
    // })
    // console.log(geraWantsFull)
    res.render("./transcripts/searchResults", {
        h1: "Editor's Choice",
        search: search, 
        results: clip 
    })

})

// code could be improved.
router.get("/honorable-mentions", async (req, res) => {
    let choices = [
                    ObjectId("631b297a4cfec30d539a99eb"),
                    ObjectId("631b29774cfec30d539a0c33"), // (i dont care about getting chall)
                    ObjectId("631b1e98d0f891998d43960b"), // havnt been chall since season 3
                  ];

    let search = "challenger";
    let clip = await Captions.find( 
        {"clips._id" : { "$in" : choices }},
        {
              title: 1,
              csvPath: 1,
              vidPath: 1,
              vidTitle: 1,
              clips: {
                $filter: {  
                  input: "$clips",
                  as: "theclips",
                  cond: {
                    "$in": ["$$theclips._id", choices ]
                  },
                }
              }
          }
    ).then( rez => {
        let search = "challenger"
        var replace = `\\b${search}s?\\b`;
        var re = new RegExp(replace,"gmi");
        rez.forEach( vodAndClips => {
            vodAndClips.clips.forEach( (clip, i, ownArr) => {
            clip.Transcript = clip.Transcript.replaceAll(re, `<span class="highlight">${search}</span>`) // syntax stuff for "OR"
            })
        })
        return rez
    })
    .catch(err => {
        res.status(404).redirect('/404.html')
    })
    res.render("./transcripts/searchResults", {
        h1: "Honorable Mention",
        search: search, 
        results: clip 
    })

})


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//////////////    SAVE VIDS MONGODB      ////////////////
//////////////    SAVE VIDS MONGODB      ////////////////
//////////////    SAVE VIDS MONGODB      ////////////////
//////////////    SAVE VIDS MONGODB      ////////////////
//////////////    SAVE VIDS MONGODB      ////////////////
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////

const saveCaptionsInDbAux = async (vidData) => {
    let csvUrl = process.env.CDN_DOMAIN + "/" + vidData.csvPath;
    console.log("saveCaptionsInDbAux - csvUrl=", csvUrl)

    let response = await common.makeHttpRequest(csvUrl)
    console.log('saveCaptionsInDbAux - CSV below')
    console.log('saveCaptionsInDbAux - CSV below')
    if (response?.data == null) {
        console.log("saveCaptionsInDbAux - Something wrong with CSV")
        return 
    }
    let clips = []
    let captions = await csv() //csvtojson library
    .fromString(response.data)
    .subscribe(async (csvObj)=>{ 
        csvObj.Transcript = csvObj.Transcript?.replace("\r", " ");
        if (csvObj["Speaker Name"]) {
            delete csvObj["Speaker Name"]
        }
        let clip = new Clip (csvObj)
        clips.push(clip);

        // if (csvObj['Start Time']) {
        //     csvObj['Start'] = csvObj['Start Time']
        //     delete csvObj['Start Time']
        // }
    })
    console.log("######################")
    console.log("saveCaptionsInDbAux - DONE!", csvUrl)
    // console.log("saveCaptionsInDbAux - DONE! - viddata %o", vidData )
    // HERE
    const captionsMongoose = new Captions({
        ...vidData,
        clips
        // captions,
    });
    
    captionsMongoose.save().then( (result) => {
        console.log("saveCaptionsInDbAux - save success!.")
    })
    .catch( err => {
        console.log("(My error csv) Error occured", err)
    })
    // console.log("%o", captionsMongoose)
    return true;

}
// vidDatas = [ {
//     csvPath: 'vids/66/Sequence 01.csv',
//     vidPath: 'vids/66/Plat 4 Start _ Level 1 to Challenger in 45 Days! _ Day 8 _ MENTAL GOD TIER WE CLIMB TODAY (full).mp4',
//     vidTitle: 'Plat 4 Start _ Level 1 to Challenger in 45 Days! _ Day 8 _ MENTAL GOD TIER WE CLIMB TODAY (full)'
//   }]
const saveCaptionsInDb = async (vidDatas) => {
    let count = 0;
    for (let i=0; i< vidDatas.length; i++) {
        console.log(`saveCaptionsInDb - ${i} csv`,  vidDatas[i].csvPath)
        console.log("saveCaptionsInDb - count=", count)
        count++;
        let result = await Captions.findOne({"csvPath": vidDatas[i].csvPath}).then( result =>  {
            console.log("saveCaptionsInDb - Checking captions")
            console.log("saveCaptionsInDb result - " , result?._id)
            console.log("saveCaptionsInDb result - " , result?.id)
            console.log("saveCaptionsInDb result - " , result?.csvPath)
            console.log("saveCaptionsInDb result - " , result?.vidPath)
            console.log("saveCaptionsInDb result - " , result?.vidTitle)
            console.log("saveCaptionsInDb result - " , result?.captions?.length)
            // Check if in my Database
            if (result == null) {
                saveCaptionsInDbAux(vidDatas[i])
            } else {
                console.log("saveCaptionsInDb -Not saving")
            }
        })
    } 
}




// everyFolderConts =  [
//    VidData { 
//       csvPath: 'vids/maherTest/maherecsv.csv',
//       vidPath: 'vids/maherTest/Real Time With Bill Maher Season 20 Episode 22 HBO Bill Maher Aug 5, 2022 FULL 720p.mp4',
//       vidTitle: 'Real Time With Bill Maher Season 20 Episode 22 HBO Bill Maher Aug 5, 2022 FULL 720p'
//    },
//      ...
//      ...
// ]    
const updateDbWithS3 = () => {

    return new Promise( async (resolve, reject) => {

        let url = "https://d2h6hz1aakujaj.cloudfront.net";
        let request = https.get(url, {headers: "application/xml"} , (response) => {
            let data = ''
            response.on('data', function (chunk) {
                data += chunk;
            });
        
            response.on('end', async function () {
                if (response.statusCode >= 200 && response.statusCode < 300 ) {
                    let result = await parseStringPromise(data)  // xml2js
                       .then( dt => { return dt })
                       .catch(err => { return err })
                   let everyVidDatas = getEveryVidDatas(result) // list of vid with my custom fields. (vidPath, vidTittle, vidCsv)
                   console.log("everyVidDatas")
                   console.log("(OMITED)")
                   console.log(everyVidDatas)
                // HERE
                // HERE
                // HERE
                // HERE we want to seperate this save function
                   let isRecentUpdated = saveCaptionsInDb(everyVidDatas)
                   resolve(200);
                }
            }).on('error', (e) => {
                console.error(e);
                reject(400);
            });
        });    
    })

}

router.get("/cdn/allvids", async (req, res) => {
    // console.log(allVids)
    console.log("req.headers");
    console.log("req.headers");
    console.log("req.headers");
    console.log("req.headers");
    console.log("req.headers");
    console.log(req.headers);
    // let url = "https://d2h6hz1aakujaj.cloudfront.net/bifrost3d_clothed.png"
    console.log("START gonna do stuff")
    console.log("req.headers.x-bski-lazyauth", req.headers['x-bski-lazyauth'])
    if (req.headers['x-bski-lazyauth'] == process.env.LAZYAUTH) {
        console.log("DOES EQUAL!!!!!!")
    }
    // res.send("done")
    // return
    let x = await updateDbWithS3()
    console.log("END  do stuff")
    console.log("END  x", x)
    if (x == 200 ) {
        res.send("Complete")
    }
    else {
        res.statusCode = 400;
        res.send("Error :(")
    }
     
})




/* --------------------------------- */
/* --------------------------------- */
/*     FOLDER STRUCTURE OF 'vid/'    */
/* --------------------------------- */
/* --------------------------------- */
// vid/ ┐ 
//      ┣ <folder-name> ┐
//      ┃               ┣ transcript>.csv
//      ┃               ┖ <vid-name>.mp4
//      ┣ 123-a7x9-019  ┐
//      ┃               ┣ transcript_XYZ.csv
//      ┃               ┖ vid.mp4
//      ┣ gera-short-stream ┐
//      ┃                   ┣ transcript_000.csv
//      ┃                   ┖ gera-short-stream.mp4


// vids/283498290/someVid.mp4
// vids/283498290/someCsv.mp4
// vids/maherTest/Real Time With Bill Maher Season 20 Episode 22 HBO Bill Maher Aug 5, 2022 FULL 720p.mp4
// vids/maherTest/maherecsv.csv


const convertToVidDatas = (allFolderNames, allItemsS3) => {
    
    let vidDataList = allFolderNames.map (folderName => { 
        console.log("name -------------", folderName, "-------------" )
        let filt = allItemsS3.filter( s3Item => {
            // console.log("s3Item ===>", s3Item)
            return s3Item.includes(folderName)
        })
        let vidData = new VidData()
        filt.forEach( x => {
            if (x.endsWith('.csv')) {
                vidData.csvPath = x;
            }
            if (x.endsWith('.mp4')) {
                vidData.vidPath = x;
                vidData.vidTitle = x.split('/').slice(-1)[0].replace('.mp4', '');
            }
        })
        return vidData;
    })
    return vidDataList
    
}

const getAllVidFolderNamesHack = (allItemsS3) => {
    console.log("+ + + + + + + + + + + + + + + + + + + + + ")
    console.log("+ + + + + + + + + + + + + + + + + + + + + ")
    console.log("+ + + + + + + + + + + + + + + + + + + + + ")
    console.log("+ + + + + + + + + + + + + + + + + + + + + ")
    console.log(S3_vid_path)
    console.log(S3_vid_path)
    console.log(S3_vid_path)
    console.log(S3_vid_path)
    let vidsFolder = []
    allItemsS3.forEach( itemPath => { 
        if ( !itemPath.startsWith(S3_vid_path)) {
            return;
        }
        let x = itemPath.split('/');
        let folderPath = x[0] + '/' + x[1] + '/'
        vidsFolder.push(folderPath);
    })

    
    console.log("+ + + + + + + + + + + + + + + + + + + + + ")
    console.log("+ + + + + + + + + + + + + + + + + + + + + ")
    vidsFolder = [...new Set(vidsFolder)]
    console.log(vidsFolder)
    return vidsFolder
    // let allFolderNames = allItemsS3.map( itemPath => { 
    //     console.log("------", itemPath) 
    //     const S3_vid_path = S3VideoRootFolder;
    //     if ( !itemPath.startsWith(S3_vid_path)) {
    //         return;
    //     }
    //     let split = itemPath.split("/")
    //     let half_1st = split[0];
    //     let folderName = split[1];
    //     let half_3rd = split.slice(2).join('/');
    //     // console.log("folderName - half 1st", half_1st)
    //     // console.log("folderName - half 2nd", folderName)
    //     // console.log("folderName - half 3rd", half_3rd)
    //     return folderName
    // })
    // allFolderNames = allFolderNames.filter(folder => { return folder != null })
    // allFolderNames = [...new Set(allFolderNames)]
    // return allFolderNames
}
//  All s3 items should be formated as <id>_ID_<name>
const parseIdFromName_OLDASSEBMLY = (s3Name) => {
    let idx = s3Name.toUpperCase().indexOf("_ID_");
    if (idx == -1) {
        return {id: null, name: s3Name }
    }
    let name = s3Name.substring(idx+4);
    let id = s3Name.substring(0,idx);
    return {id, name}

}

const getEveryVidDatas = (result) => {
    // 1. only grab items, not folders (folders end in '/')  
    let allItemsS3 = result?.ListBucketResult?.Contents?.filter( item => { 
        return (item.Key[0].slice(-1) != "/") 
    })
    console.log(1)
    console.log("1 allItemsS3")
    console.log(allItemsS3)
    // 2. item.Key is an array for some reason. Fix that.
    // allItemsS3 = [ 'some-folder/deep-folder/95024051_p0.jpg', 
    //                'some-folder/deep-folder/TncMx-morgan-hultgren-51.jpg',                                                                                        'vids/maherTest/Real Time With Bill Maher Season 20 Episode 22 HBO Bill Maher Aug 5, 2022 FULL 720p.mp4',                                      'vids/maherTest/maherecsv.csv',
    //                'vids/maherTest/mahertxt.txt' 
    //                'vids/maherTest/maherecsv.csv',
    //                'vids/maherTest/mahertxt.txt'    ]  
    allItemsS3 = allItemsS3.map( item => {  return (item.Key[0] );  })
    
    console.log(2)
    console.log("2 allItemsS3")
    console.log(allItemsS3)
    
    
    console.log(3)
    let allFolderNames = getAllVidFolderNamesHack(allItemsS3) // Actually get everythign in "vids/"

    console.log(3)
    console.log(allFolderNames)
    let vidDatas = convertToVidDatas(allFolderNames, allItemsS3) // We find the intersection of the two
    console.log(4)
    console.log("4 vidDatas")
    console.log(vidDatas)
    return vidDatas;
}

module.exports = router;

