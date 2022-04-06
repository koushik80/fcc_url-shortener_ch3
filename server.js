'use strict';

const dotenv = require("dotenv");
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require('body-parser');

dotenv.config();

//DB connection
mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB");
  });

//middleware
app.use(cors());
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let urlSchema = new mongoose.Schema({
  original : {type: String, required: true},
  short: Number
})

let Url = mongoose.model('Url', urlSchema)

let responseObject = {}
app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let inputUrl = req.body['url']

  let urlRegex = new RegExp(/http[s]?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)

  if (!inputUrl.match(urlRegex)) {
    res.json({ error: 'invalid url' })
    return
  }
  responseObject['original_url'] = inputUrl

  let inputShort = 1

  Url.findOne({})
    .sort({ short: 'desc' })
    .exec((error, result) => {
      if (!error && result != undefined) {
        inputShort = result.short + 1
      }
      if (!error) {
        Url.findOneAndUpdate(
          { original: inputUrl },
          { original: inputUrl, short: inputShort },
          { new: true, upsert: true },
          (error, savedUrl) => {
            if (!error) {
              responseObject['short_url'] = savedUrl.short
              res.json(responseObject)
            }
          }
        )
      }
    })
})

app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input

  Url.findOne({short: input}, (error, result) => {
    if(!error && result != undefined){
      res.redirect(result.original)
    }else{
      res.json('URL not Found')
    }
  })
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log("Backend server is running!")
})
