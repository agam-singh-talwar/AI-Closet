const { hashPassword, comparePasswords } = require("./db/authUtility");
const hbs = require('express-handlebars');
const sessions = require('client-sessions');
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require('fs');
const axios = require('axios');
const https = require('https');
require("dotenv").config();

// database setup
const db = require("./db/index");
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
  helpers: {
    select: function (selected, options) {
      return options.fn(this).replace(new RegExp(' value=\"' + selected + '\"'), '$& selected="selected"');
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, './views'));

// checks for user authentication
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

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

//app routes
var temp;

// home page
app.get("/", async (request, response) => {

  //renders home page with user if logged in
  if (request.session.user) {
    let outfits = getOutfits(request.session.user.clauset);
    if (outfits.casual.length == 0 && outfits.formal.length == 0 && outfits.party.length == 0 && outfits.sports.length == 0)
      outfits = undefined;

    response.status(200).render("home", {
      user: request.session.user,
      title: "Home",
      temp: temp,
      outfits: outfits
    });
  }
  // renders landing page if not logged in
  else
    response.status(200).render("index", {
      user: request.session.user,
      title: "AI Clauset"
    });
});

// need to implement with AI
app.post("/", ifAuthenticated, (request, response) => {
  // re-render home page with new outfits
  let outfits = getOutfits(request.session.user.clauset);
  if (outfits.casual.length == 0 && outfits.formal.length == 0 && outfits.party.length == 0 && outfits.sports.length == 0)
    outfits = undefined;

  response.status(200).render("home", {
    user: request.session.user,
    title: "Home",
    temp: temp,
    outfits: outfits
  });
});

// login page
app.get("/login", ifNotAuthenticated, (request, response) => {
  response.status(200).render("login", { title: "Login" });
});

// post request to login
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
        console.log(user)
        request.session.user = {
          name: user.name,
          email: user.email,
          clauset: user.clauset
        };

        if (user.location[0]) {
          request.session.user.latitude = user.location[0].latitude;
          request.session.user.longitude = user.location[0].longitude;
        }

        if (request.session.user.clauset == undefined)
          request.session.user.clauset = [];


        try {
          //get current weather
          const latitude = request.session.user.latitude;
          const longitude = request.session.user.longitude;
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
          const res = await fetch(url);
          const data = await res.json();
          temp = Math.round(data.main.temp);
        }
        catch (err) {
          console.log(err);
        }

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

// signup page
app.get("/signup", ifNotAuthenticated, (request, response) => {
  response.status(200).render("signup", { title: "Sign Up" });
});

// post request to create account
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
      latitude: user.location.latitude,
      longitude: user.location.longitude,
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

// account settings page
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
app.get("/account", ifAuthenticated, async (request, response) => {

  // detect location from latitute and longitude
  if (request.query.lat && request.query.lon) {
    const latitude = request.query.lat;
    const longitude = request.query.lon;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    try {
      const agent = new https.Agent({
        rejectUnauthorized: false
      });
      
      const res = await axios.get(url, { httpsAgent: agent });
      
      const data = res.data;
      temp = Math.round(data.main.temp);

      let modifiedUser = { ...request.session.user };  // clone original without link
      modifiedUser.name = request.query.name;
      modifiedUser.email = request.query.email;
      modifiedUser.location = data.name + ', ' + data.sys.country;
      modifiedUser.latitude = latitude;
      modifiedUser.longitude = longitude;


      response.status(200).render("account", {
        user: request.session.user,
        modifiedUser: modifiedUser,
        title: "My Account"
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

// update account information request
app.post("/account", ifAuthenticated, async (request, response) => {
  const { name, email, location, lat, lon, newPass, currentPass } = request.body;
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
          { $set: { "name": name, "email": email, "password": hashedpass, "location": [{ "location": location, "latitude": lat, "longitude": lon }] } }
        ).then(() => {

          request.session.user = {
            name: user.name,
            email: user.email,
            location: location,
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
          error: "Incorrect password."
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

// view all cloths in the virtual wardrobe
app.get("/wardrobe", ifAuthenticated, async (request, response) => {
  const { success, updated, deleted, error } = request.query;

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
      } else if (updated) {
        response.status(200).render("wardrobe", {
          user: request.session.user,
          title: "My Wardrobe",
          clauset: request.session.user.clauset,
          message: "Cloth updated successfully."
        });
      } else if (deleted) {
        response.status(200).render("wardrobe", {
          user: request.session.user,
          title: "My Wardrobe",
          clauset: request.session.user.clauset,
          message: "Cloth deleted successfully."
        });
      } else if (error) {
        response.status(500).render("wardrobe", {
          user: request.session.user,
          title: "My Wardrobe",
          clauset: request.session.user.clauset,
          error: "Ooops something is wrong."
        });
      }
      else {
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

// add cloth to the virtual wardrobe
app.post("/cloth/add", ifAuthenticated, async (request, response) => {

  try {

    // add cloth to the virtual wardrobe
    const { imageURL, name, color, type, occasion, temperature } = request.body;

    // Create a new cloth object
    const cloth = {
      imageURL,
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
      {
        $set: { "clauset": request.session.user.clauset }
      }).then(() => {
        response.status(201).redirect("/wardrobe?success=true");
      })
  } catch (error) {
    response.status(500).redirect("/wardrobe?error=true");
  }
});

// edit cloth in the virtual wardrobe
app.post("/cloth/edit/:id", ifAuthenticated, async (request, response) => {
  const { id } = request.params;
  const { name, color, type, occasion, temperature } = request.body;
  try {
    User.updateOne({ email: request.session.user.email, "clauset._id": id }, {
      $set: {
        "clauset.$.name": name,
        "clauset.$.color": color,
        "clauset.$.type": type,
        "clauset.$.occasion": occasion,
        "clauset.$.temperature": temperature
      }
    }).then(() => {
      response.status(200).redirect("/wardrobe?updated=true");
    });

  } catch (error) {
    response.status(500).redirect("/wardrobe?error=true");
  }
});

// delete cloth from the virtual wardrobe
app.post("/cloth/delete/:id", ifAuthenticated, async (request, response) => {
  const { id } = request.params;
  const { imageURL } = request.query;

  try {
    User.updateOne({ email: request.session.user.email }, { $pull: { clauset: { _id: id } } }).then(() => {
      response.status(201).redirect("/wardrobe?deleted=true");
    });
  } catch (error) {
    response.status(500).redirect("/wardrobe?error=true");
  }
});

// logout out of the session
app.get("/logout", (request, response) => {
  request.session.reset();
  response.redirect('/');
});

// invalid route
app.get("/*", (request, response) => {
  response.status(404).render("page404", { title: "Not Found" });
});

const getOutfits = (clauset) => {
  let CasualUpper = [], CasualLower = [], FormalUpper = [], FormalLower = [], PartyUpper = [], PartyLower = [], SportsUpper = [], SportsLower = [];
  let casual = [], formal = [], party = [], sports = [];

  clauset.forEach(cloth => {
    if (temp && temp >= parseInt(cloth.temperature) - 10 && temp <= parseInt(cloth.temperature) + 10) {
      if (cloth.occasion == "Casual") {
        if (cloth.type == "Top")
          CasualUpper.push(cloth);
        else if (cloth.type == "Bottom")
          CasualLower.push(cloth);
      }
      else if (cloth.occasion == "Formal") {
        if (cloth.type == "Top")
          FormalUpper.push(cloth);
        else if (cloth.type == "Bottom")
          FormalLower.push(cloth);
      }
      else if (cloth.occasion == "Party") {
        if (cloth.type == "Top")
          PartyUpper.push(cloth);
        else if (cloth.type == "Bottom")
          PartyLower.push(cloth);
      }
      else if (cloth.occasion == "Sports") {
        if (cloth.type == "Top")
          SportsUpper.push(cloth);
        else if (cloth.type == "Bottom")
          SportsLower.push(cloth);
      }
    } else if (temp == undefined) {
      if (cloth.occasion == "Casual") {
        if (cloth.type == "Top")
          CasualUpper.push(cloth);
        else if (cloth.type == "Bottom")
          CasualLower.push(cloth);
      }
      else if (cloth.occasion == "Formal") {
        if (cloth.type == "Top")
          FormalUpper.push(cloth);
        else if (cloth.type == "Bottom")
          FormalLower.push(cloth);
      }
      else if (cloth.occasion == "Party") {
        if (cloth.type == "Top")
          PartyUpper.push(cloth);
        else if (cloth.type == "Bottom")
          PartyLower.push(cloth);
      }
      else if (cloth.occasion == "Sports") {
        if (cloth.type == "Top")
          SportsUpper.push(cloth);
        else if (cloth.type == "Bottom")
          SportsLower.push(cloth);
      }
    }
  });

  // select random bottom and top for each occasion
  if (CasualUpper.length > 0 && CasualLower.length > 0)
    casual.push(CasualUpper[Math.floor(Math.random() * CasualUpper.length)], CasualLower[Math.floor(Math.random() * CasualLower.length)]);
  if (FormalUpper.length > 0 && FormalLower.length > 0)
    formal.push(FormalUpper[Math.floor(Math.random() * FormalUpper.length)], FormalLower[Math.floor(Math.random() * FormalLower.length)]);
  if (PartyUpper.length > 0 && PartyLower.length > 0)
    party.push(PartyUpper[Math.floor(Math.random() * PartyUpper.length)], PartyLower[Math.floor(Math.random() * PartyLower.length)]);
  if (SportsUpper.length > 0 && SportsLower.length > 0)
    sports.push(SportsUpper[Math.floor(Math.random() * SportsUpper.length)], SportsLower[Math.floor(Math.random() * SportsLower.length)]);

  return { casual, formal, party, sports };
}