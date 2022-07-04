const mongoose = require("mongoose");
const { DB_URI } = require("./config");
// entrega
module.exports.startDb = () => {
  const mongoDB = DB_URI;
  mongoose
    .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("connected to mongoDB"))
    .catch((err) => console.log(err));
};
