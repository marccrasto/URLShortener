require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose');
let bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true});

const urlSchema = new mongoose.Schema({
  id: Number,
  name: String 
});

let Url = mongoose.model("Url", urlSchema);

let count = 0;
Url.count({}, function(err,data) {
  if(err) {
    console.log("Error counting documents");
  }
  count = data;
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
//  IF VALID URL:
  try {
    const url = new URL(req.body.url);

    if(url.protocol != 'http:' && url.protocol != 'https:') {
      res.json({ error: 'invalid url' });
    }
  //  IF URL IS IN DATABASE:
      Url.findOne({name: req.body.url}, function(err, data) {
        if(err) {
          console.log(err);
          res.json({ error: "Failed" });
        }
        if(data) {
    //      THEN:
    //        Retrieve short url from id and res.json(shorturl: shorturl)
          const shorturl = data.id;
          res.json({ original_url : req.body.url, short_url : shorturl});
        }
        //ELSE:
        //  Add new URL to database along with autoincremented id
        //  Retrieve short url from id and res.json(shorturl: shorturl)
        else {
          let newUrl = new Url({
            id: count,
            name: req.body.url
          });
          count++;
          newUrl.save(function(err,data) {
            if(err) {
              console.log(err);
              res.json({ error: "Failed" });
            }
            res.json({ original_url : data.name, short_url : data.id });
          });
        }
      })
  }
  catch (err) {
  //  Return error in json
    res.json({ error: 'invalid url' });
  }
})

app.get("/api/shorturl/:num", function(req,res) {
  const shortUrl = Number(req.params.num);
  Url.findOne({id: shortUrl}, function(err,data) {
    if(err) {
      res.json({ error: 'Could not find page with given short url' });
    }
    const urlName = data.name;
    res.redirect(urlName);
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
