const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));


// **** Using Routes ****
app.use("/api/user", userRoutes);
// config
if(process.env.NODE_ENV !== 'PRODUCTION'){
    require("dotenv").config({
        path: "config/.env",
    })
}


// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);


// it's for ErrorHandling
// app.use(ErrorHandler);

module.exports = app;