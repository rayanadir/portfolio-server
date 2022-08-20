const { MongoClient } = require("mongodb");
const Db = process.env.MONGO_URL;
const client = new MongoClient(Db);
const mongoose = require("mongoose");

mongoose.connect(Db).then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log("Failed to connect to MongoDB", err));
