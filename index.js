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

const ifAuthenticated = (request, response, next) => {
  if (!request.session.user)
    response.redirect("/login");
  else
    next();
}

//app routes
app.get("/", async (request, response) => {

  if (request.session.user)
    response.status(200).render("home", {
      user: request.session.user,
      title: "Home"
    });
  else
    response.status(200).render("index", {
      user: request.session.user,
      title: "AI Clauset"
    });
});

app.post("/", ifAuthenticated, (request, response) => {
  // re-render home page with new outfits
});

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
        request.session.user = {
          name: user.name,
          email: user.email,
          latitude: user.latitude,
          longitude: user.longitude,
          clauset: user.clauset
        };
        if (request.session.user.clauset == undefined)
          request.session.user.clauset = [];
        response.status(200).redirect("/");
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

    request.session.user = {
      name: user.name,
      email: user.email,
      latitude: user.latitude,
      longitude: user.longitude,
      clauset: []
    };
    response.status(201).redirect("/");
  } catch (err) {
    console.log(err);
    response.status(501).render("signup", {
      title: "Sign Up",
      error: "Ooops something is wrong."
    });
  }
});

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
app.get("/account", ifAuthenticated, async (request, response) => {

  // detect location from latitute and longitude
  if (request.query.lat && request.query.lon) {
    const latitude = request.query.lat;
    const longitude = request.query.lon;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();

      let modifiedUser = { ...request.session.user };  // clone original without link
      modifiedUser.name = request.query.name;
      modifiedUser.email = request.query.email;
      modifiedUser.latitude = latitude;
      modifiedUser.longitude = longitude;

      response.status(200).render("account", {
        user: request.session.user,
        modifiedUser: modifiedUser,
        title: "My Account",
        location: data.name + ', ' + data.sys.country
      });
    } catch (err) {
      console.log(err);
      response.status(500).render("account", {
        user: request.session.user,
        modifiedUser: request.session.user,
        title: "My Account",
        error: "Couldn't detect location."
      });
    }
  }
  else
    response.status(200).render("account", {
      user: request.session.user,
      modifiedUser: request.session.user,
      title: "My Account"
    });
});

app.post("/account", ifAuthenticated, async (request, response) => {
  const { name, email, lat, lon, newPass, currentPass } = request.body;
  try {
    const user = await User.findOne({ email: request.session.user.email });

    if (user != null) {
      const isPasswordMatch = await comparePasswords(
        currentPass,
        user.password
      );

      if (isPasswordMatch) {
        let hashedpass;
        if (newPass != "")
          hashedpass = await hashPassword(newPass);
        else
          hashedpass = user.password;

        User.updateOne(
          { email: request.session.user.email },
          { $set: { "name": name, "email": email, "password": hashedpass, "location": [{ "latitude": lat, "longitude": lon }] } }
        ).then(() => {

          request.session.user = {
            name: user.name,
            email: user.email,
            latitude: lat,
            longitude: lon,
            clauset: user.clauset
          };
          if (request.session.user.clauset == undefined)
            request.session.user.clauset = [];

          response.status(200).render("account", {
            title: "My Account",
            user: request.session.user,
            message: "Account updated successfully."
          });
        });
      } else {
        response.status(401).render("account", {
          user: request.session.user,
          modifiedUser: request.session.user,
          title: "My Account",
          message: "Incorrect password."
        });
      }
    }
  } catch (err) {
    response.status(501).render("account", {
      user: request.session.user,
      modifiedUser: request.session.user,
      title: "My Account",
      error: "Unable to update the account."
    });
  }
});

app.get("/wardrobe", ifAuthenticated, async (request, response) => {

  const { success, error } = request.query;

  try {
    const user = await User.findOne({ email: request.session.user.email }).lean();
    if (user) {
      request.session.user.clauset = user.clauset;

      if (success) {
        response.status(201).render("wardrobe", {
          user: request.session.user,
          title: "My Wardrobe",
          clauset: request.session.user.clauset,
          message: "Cloth added successfully."
        });
      } else if (error) {
        response.status(500).render("wardrobe", {
          user: request.session.user,
          title: "My Wardrobe",
          clauset: request.session.user.clauset,
          error: "Ooops something is wrong."
        });
      } else {
        response.status(200).render("wardrobe", {
          user: request.session.user,
          title: "My Wardrobe",
          clauset: request.session.user.clauset
        });
      }
    }
  } catch (error) {
    response.status(500).render("wardrobe", {
      title: "My Wardrobe",
      error: "Ooops something is wrong."
    });
  }
});

app.post("/addcloth", ifAuthenticated, async (request, response) => {
  const { name, color, type, occasion, temperature } = request.body;
  try {
    const user = await User.findOne({ email: request.session.user.email });
    if (user) {
      // Create a new cloth object
      const cloth = {
        name,
        color,
        type,
        occasion,
        temperature,
      };

      // Add the cloth object to the session user's cloths array
      request.session.user.clauset.push(cloth);

      // Update DB
      User.updateOne(
        { email: request.session.user.email },
        { $set: { "clauset": request.session.user.clauset } }
      ).then(() => {
        response.status(201).redirect("/wardrobe?success=true");
      });
    } else {
      response.status(401).redirect("/wardrobe?error=true");
    }
  } catch (error) {
    response.status(500).redirect("/wardrobe?error=true");
  }
});

app.post("/cloth/edit/:id", async (req, res) => {
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

app.post("/cloth/delete/:id", ifAuthenticated, async (request, response) => {
  const { id } = request.params;

  try {
    const user = await User.findOne({ email: request.session.user.email });
    if (user) {

      User.updateOne({ email: request.session.user.email }, { $pull: { clauset: { _id: id } } }).then(() => {
        request.session.user.clauset = user.clauset;
        response.status(201).redirect("/wardrobe");
      });
      
    } else {
      response.status(404).redirect("/wardrobe?error=true");
    }
  } catch (error) {
    response.status(500).redirect("/wardrobe?error=true");
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
