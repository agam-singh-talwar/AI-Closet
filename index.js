const express = require("express");
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

//set up application
const PORT = process.env.PORT || 8080;
const app = express();

//set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//connect to db & start the app
const uri = process.env.MONGODB_URI;

const connectToDB = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(uri)
            .then(() => {
                console.log("Database connection established.");
                resolve();
            })
            .catch((error) => {
                reject("Can't connect to the database. " + error);
            });
    });
};

connectToDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Application is listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("App failed to start. " + error);
    });


//app routes
app.get("/", (request, response) => {
    response.status(200).render("index", { title: "Not Found" });
});

app.get("/login", (request, response) => {
    // render login page
});

app.post("/login", (request, response) => {
    // login
});

app.get("/signup", (request, response) => {
    // render signup page
});

app.post("/signup", (request, response) => {
    // signup
});

// the next couple of routes require middleware to not allow outside access

// app.get("/account", checkAuthorization, (request, response) => {
//     // render account page, etc...
// });

// app.post("/account", checkAuthorization, (request, response) => {
//     // update account
// });

app.get("/logout", (request, response) => {
    // reset session and redirect to the main home page
});
app.get("/*", (request, response) => {
    // render page 404
});