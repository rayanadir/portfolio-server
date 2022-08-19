const { MongoClient } = require("mongodb");
const Db = process.env.ATLAS_URL;
const client = new MongoClient(Db);
const mongoose = require("mongoose");

mongoose.connect(Db).then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log("Failed to connect to MongoDB", err));
/* 
var _db;
 
module.exports = {
  connectToServer: function (callback) {
    client.connect(function (err, db) {
      // Verify we got a good "db" object
      if (db)
      { 
        _db = db.db("portfolio_project");
        console.log("Successfully connected to MongoDB."); 
      }
      return callback(err);
         });
  },
 
  getDb: function () {
    return _db;
  },
};*/