const express = require("express");
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// import db connection object
const db = require("./db/index")
// get the User Schema
const User = require('./db/model')
//set up application
const PORT = process.env.PORT || 8080;
const app = express();

//set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//app routes
app.get("/", (request, response) => {
    console.log("/")
    response.status(200).render("index", { title: "Not Found" });
});

app.get("/login", (request, response) => {
    // render login page
});

app.post("/login", async (request, response) => {
    // login 
    const {nam, pass}= request.body
    try{
        const usr = await User.find({name: nam}, {password: pass})
        if (usr == null ){
            response.status(201).send("logged IN")
        }
        else{
            response.status(401).send("not acount found!")
        }
    } catch (err){
        console.log(err);
        response.status(500).send(err)
    }
});

app.get("/signup", (request, response) => {
    // render signup page
    
});

app.post("/signup", async (request, response) => {
    // signup
    // Create a user
    console.log(request.body)
    const {name, email, password} = request.body;
    try{
        const user = new User({name, email, password});
        await user.save();
        // sending user only for testing, later it should redirect to a different page
        response.status(201).send(user);
    } catch (err){
        console.log(err);
        response.status(500).send(err)
    }

});

// the next several of routes require middleware to not allow outside access

// app.get("/home", checkAuthorization, (request, response) => {
//     // render (user) home page
// });

// app.put("/home", checkAuthorization, (request, response) => {
//     // update outfits on the (user) home page
// });

// app.get("/account", checkAuthorization, (request, response) => {
//     // render account page
// });

// app.put("/account", checkAuthorization, (request, response) => {
//     // update account
// });

// app.get("/wardrobe", checkAuthorization, (request, response) => {
//     // render virtual wardrobe page
// });

// CRUD operations for cloth routes

// Create a new cloth for a user
app.post("/users/:userId/cloths", async (req, res) => {
    const { userId } = req.params;
    const { name, color, type, occasion, temperature } = req.body;
    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        // Create a new cloth object
        const cloth = {
            name,
            color,
            type,
            occasion,
            temperature
        };
        // Add the new cloth to the user's cloth array
        user.clauset.push(cloth);
        // Save the updated user object
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Read all cloths of a user
app.get("/users/:userId/cloths", async (req, res) => {
    const { userId } = req.params;
    try {
        // Find the user by ID and return the cloths array
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.status(200).send(user.clauset);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Update a cloth of a user
app.put("/users/:userId/cloths/:clothId", async (req, res) => {
    const { userId, clothId } = req.params;
    const { name, color, type, occasion, temperature } = req.body;
    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        // Find the cloth by ID
        const cloth = user.clauset.id(clothId);
        if (!cloth) {
            return res.status(404).send("Cloth not found");
        }
        // Update cloth properties
        cloth.set({
            name,
            color,
            type,
            occasion,
            temperature
        });
        // Save the updated user object
        await user.save();
        res.status(200).send(user);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Delete a cloth of a user
app.delete("/users/:userId/cloths/:clothId", async (req, res) => {
    const { userId, clothId } = req.params;
    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        // Remove the cloth by ID
        user.clauset.id(clothId).remove();
        // Save the updated user object
        await user.save();
        res.status(200).send(user);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

app.get("/logout", (request, response) => {
    // reset session and redirect to the main home page
});
app.get("/*", (request, response) => {
    // render page 404
});

app.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`);
})