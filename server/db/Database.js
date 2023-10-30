const mongoose = require('mongoose');
const colors = require("colors");
const connectDatabase = async () => {
    try {
      const conn = await mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
  
      console.log(`Database connection established successfully, server is up and running at: ${conn.connection.host}`.cyan.underline);
    } catch (error) {
      console.error(`Error: ${error.message}`.red.bold);
      process.exit(1); // Exit with a non-zero status code to indicate an error
    }
  };
module.exports = connectDatabase;