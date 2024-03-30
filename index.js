const { hashPassword, comparePasswords } = require("./db/authUtility");
const hbs = require('express-handlebars');
const sessions = require('client-sessions');
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// import db connection object
const db = require("./db/index");
// get the User Schema
const User = require("./db/model");
//set up application
const PORT = process.env.PORT || 8080;
const app = express();

//set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(sessions({
  cookieName: "session",
  secret: "ai-clauset",
  duration: 24 * 60 * 60 * 1000,
  activeDuration: 1000 * 60 * 5
}));
app.use((request, response, next) => {
  response.locals.session = request.session;
  next();
});

app.engine("hbs", hbs.engine({
  extname: "hbs",
  defaultLayout: 'main',
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, './views'));

const ifNotAuthenticated = (request, response, next) => {
  if (request.session.user)
    response.redirect("/");
  else
    next();
}

//app routes
app.get("/", async (request, response) => {
  response.status(200).render("index", {
    user: request.session.user,
    title: "AI Clauset"
  });
});
// /testing route
// app.get("/test",async(req,res)=>{
//     //
//     const user = new User({"name": "agam" , "email": "agam@agam.com", "password":"password"});
//      const u = await user.save();
//     const u = await User.find({"name":"agam"});
//     res.status(201).send(u)
// })
app.get("/login", ifNotAuthenticated, (request, response) => {
  response.status(200).render("login", { title: "Login" });
});

app.post("/login", ifNotAuthenticated, async (request, response) => {
  try {
    const hashedPassword = await hashPassword(request.body.password);
    const user = await User.findOne({ email: request.body.email });

    if (!user) {
      response.status(401).render("login", { 
        title: "Login",
        error: "No account found."
      });
    } else {
      const isPasswordMatch = await comparePasswords(
        request.body.password,
        user.password
      );

      if (isPasswordMatch) {
        request.session.user = { name: user.name };
        response.status(200).render("index", { 
          title: "Home",
          user: request.session.user 
        });
      } else {
        response.status(401).render("login", { 
          title: "Login",
          error: "Incorrect credentials."
        });
      }
    }
  } catch (err) {
    console.log(err);
    response.status(500).render("login", { 
      title: "Login",
      error: "Ooops something is wrong."
    });
  }
});

app.get("/signup", ifNotAuthenticated, (request, response) => {
  response.status(200).render("signup", { title: "Sign Up" });
});

app.post("/signup", ifNotAuthenticated, async (request, response) => {
  try {
    const hashedpass = await hashPassword(request.body.password);
    const user = new User({
      name: request.body.name,
      password: hashedpass,
      email: request.body.email,
      location: request.body.location,
    });
    await user.save();

    request.session.user = { name: user.name };
    response.status(201).render("index", { 
      title: "Home",
      user: request.session.user 
    });
  } catch (err) {
    console.log(err);
    response.status(501).render("signup", { 
      title: "Sign Up",
      error: "Ooops something is wrong."
    });
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

// app.put("/account", checkAuthorization, async (request, response) => {
//   // update account
//   const id = request.params;
//   const { nam, eml, loc } = request.body;
//   try {
//     const usr = await User.findOneAndUpdate(
//       { _id: id },
//       { name: nam, eml: email, locaiton: loc }
//     );
//     if (usr != null) {
//       response.status(201).send(usr);
//     }
//   } catch (err) {
//     if (usr == null) {
//       response.status(501).send("Unable to update the account!");
//     }
//   }
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
      temperature,
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
      temperature,
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
  request.session.reset();
  response.redirect('/');
});
app.get("/*", (request, response) => {
  response.status(404).render("page404", { title: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
