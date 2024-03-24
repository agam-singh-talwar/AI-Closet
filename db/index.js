//  This module connects to the databse

const mongoose = require('mongoose');

const path = require('path');
require('dotenv').config();
//connect to db & start the app
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Database connected successfully');
});