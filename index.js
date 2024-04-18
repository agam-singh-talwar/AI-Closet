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

var temp;   // global variable to store weather for the session

//app routes

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
    // basic check for user authenitity
    const user = await User.findOne({ email: request.body.email });
    if (!user) {
      response.status(401).render("login", {
        title: "Login",
        error: "No account found."
      });
    } else {

      // check if entered and db existant passwords match
      const isPasswordMatch = await comparePasswords(
        request.body.password,
        user.password
      );

      if (isPasswordMatch) {

        // constructing user object
        request.session.user = {
          name: user.name,
          email: user.email,
          clauset: user.clauset
        };
        if (user.location[0]) {
          request.session.user.location = user.location[0].location;
          request.session.user.latitude = user.location[0].latitude;
          request.session.user.longitude = user.location[0].longitude;
        }
        if (request.session.user.clauset == undefined)
          request.session.user.clauset = [];


        try {
          const latitude = request.session.user.latitude;
          const longitude = request.session.user.longitude;

          //get current weather
          const data = await fetchWeather(latitude, longitude);
          if (data == undefined)
            throw new Error("Couldn't detect location.");
          temp = Math.round(data.main.temp);

          //get AI suggestion for current weather conditions
          const suggestion = await fetchAISuggestion(data);
          request.session.user.weather = data;
          request.session.user.suggestion = suggestion;
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

    //password hashing
    const hashedpass = await hashPassword(request.body.password);

    // constructing user object
    const user = new User({
      name: request.body.name,
      password: hashedpass,
      email: request.body.email
    });

    // storing in db
    await user.save();

    // constructing session object
    request.session.user = {
      name: user.name,
      email: user.email,
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
app.get("/account", ifAuthenticated, async (request, response) => {

  // detect location from latitute and longitude
  if (request.query.lat && request.query.lon) {
    const latitude = request.query.lat;
    const longitude = request.query.lon;

    try {

      // fetching to get location (city name and country code) from latitude and longitude
      const data = await fetchWeather(latitude, longitude);
      if (data == undefined)
        throw new Error("Couldn't detect location.");
      temp = Math.round(data.main.temp);

      //constructing modified user object
      let modifiedUser = {
        ...request.session.user,  // clone original without link
        name: request.query.name,
        email: request.query.email,
        location: data.name + ', ' + data.sys.country,
        latitude: latitude,
        longitude: longitude
      };

      // render account page with updated location
      response.status(200).render("account", {
        user: request.session.user,
        modifiedUser: modifiedUser,
        title: "My Account"
      });
    } catch (err) {
      console.log(err);

      // render account page with error message
      response.status(500).render("account", {
        user: request.session.user,
        modifiedUser: request.session.user,
        title: "My Account",
        error: "Couldn't detect location."
      });
    }
  }

  // render account page with current user information
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
    // basic check for user authenitity
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

        // database update
        await User.updateOne(
          { email: request.session.user.email },
          { $set: { "name": name, "email": email, "password": hashedpass, "location": [{ "location": location, "latitude": lat, "longitude": lon }] } }
        );

        // fetching to get current weather
        const data = await fetchWeather(lat, lon);
        if (data == undefined)
          throw new Error("Couldn't get weather.");
        temp = Math.round(data.main.temp);

        // fetching to get AI suggestion for current weather conditions
        const suggestion = await fetchAISuggestion(data);

        // constructing session user object with updated information
        request.session.user = {
          name: user.name,
          email: user.email,
          location: location,
          latitude: lat,
          longitude: lon,
          clauset: user.clauset,
          suggestion: suggestion,
          weather: data
        };
        if (request.session.user.clauset == undefined)
          request.session.user.clauset = [];

        // final response after account update
        response.status(200).render("account", {
          title: "My Account",
          user: request.session.user,
          message: "Account updated successfully."
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
    console.log(err)
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
    // basic check for user authenitity
    const user = await User.findOne({ email: request.session.user.email }).lean();
    if (user) {
      request.session.user.clauset = user.clauset;

      //construction special message based on query
      let statusCode, message;
      if (success) {
        statusCode = 201;
        message = "Cloth added successfully.";
      } else if (updated) {
        statusCode = 200;
        message = "Cloth updated successfully.";
      } else if (deleted) {
        statusCode = 200;
        message = "Cloth deleted successfully.";
      } else if (error)
        throw new Error("Something wrong.");

      // some operation was successful - sending message to the user
      if (message != undefined) {
        response.status(statusCode).render("wardrobe", {
          user: request.session.user,
          title: "My Wardrobe",
          clauset: request.session.user.clauset,
          message: message
        });
      }

      // simply displaying user's virtual wardrobe
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

  //grabbing data
  const { id } = request.params;
  const { name, color, type, occasion, temperature } = request.body;

  try {
    // db update
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

  //grabbing data
  const { id } = request.params;
  const { imageURL } = request.query;

  try {
    // db update
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


// extra functions
const getOutfits = (clauset, temp) => {
  const occasions = {
    Casual: { Top: [], Bottom: [] },
    Formal: { Top: [], Bottom: [] },
    Party: { Top: [], Bottom: [] },
    Sports: { Top: [], Bottom: [] }
  };

  // categorize clothes based on type, occasion & weather
  clauset.forEach(cloth => {
    if ((!temp || (temp >= parseInt(cloth.temperature) - 10 && temp <= parseInt(cloth.temperature) + 10)) &&
      ['Casual', 'Formal', 'Party', 'Sports'].includes(cloth.occasion)) {
      occasions[cloth.occasion][cloth.type].push(cloth);
    }
  });

  // randomly construct outfits from tops and bottoms for particular occasion
  const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const outfits = {
    casual: occasions.Casual.Top.length > 0 && occasions.Casual.Bottom.length > 0 ?
      [getRandomItem(occasions.Casual.Top), getRandomItem(occasions.Casual.Bottom)] : [],
    formal: occasions.Formal.Top.length > 0 && occasions.Formal.Bottom.length > 0 ?
      [getRandomItem(occasions.Formal.Top), getRandomItem(occasions.Formal.Bottom)] : [],
    party: occasions.Party.Top.length > 0 && occasions.Party.Bottom.length > 0 ?
      [getRandomItem(occasions.Party.Top), getRandomItem(occasions.Party.Bottom)] : [],
    sports: occasions.Sports.Top.length > 0 && occasions.Sports.Bottom.length > 0 ?
      [getRandomItem(occasions.Sports.Top), getRandomItem(occasions.Sports.Bottom)] : []
  };

  return outfits;
};

const fetchWeather = async (latitude, longitude) => {
  // fetch setup
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
  const weather_url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  try {
    //getting weather data
    const res = await axios.get(weather_url, { httpsAgent: agent });
    return res.data;
  } catch (err) {
    console.log(err);
    return undefined;
  }
}

const fetchAISuggestion = async (data) => {
  // extract weather data for AI suggestion
  let sunny, cloudy, rainy, snowy, layer_required, rain_or_snow;
  data.weather[0].main == 'Clear' ? sunny = 1 : sunny = 0;
  data.weather[0].main == 'Clouds' ? cloudy = 1 : cloudy = 0;
  data.weather[0].main == 'Thunderstorm'
    || data.weather[0].main == 'Drizzle'
    || data.weather[0].main == 'Rain' ? rainy = 1 : rainy = 0;
  data.weather[0].main == 'Snow' ? snowy = 1 : snowy = 0;
  data.main.feels_like <= 8 ? layer_required = true : layer_required = false;
  rainy || snowy ? rain_or_snow = true : rain_or_snow = false;

  // fetching to get AI prediction for current weather conditions
  let api_key = 'PrGoTPV5igPgSPlcRmytxfmw0vMoPREa'      // primary PrGoTPV5igPgSPlcRmytxfmw0vMoPREa         secondary l00DET0B3K3Or6CvTpdwNU8TWbWjXEX9
  let suggestion = await fetch('http://24834815-abfe-4114-9cb3-c71ca29da722.canadacentral.azurecontainer.io/score', {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': ('Bearer ' + api_key)
    },
    'body': JSON.stringify({
      "Inputs": {
        "data": [
          {
            "temperature": data.main.temp,
            "humidity": data.main.humidity,
            "wind_speed": data.wind.speed,
            "sunny": sunny,
            "cloudy": cloudy,
            "rainy": rainy,
            "snowy": snowy,
            "layer_required": layer_required,
            "rain_or_snow": rain_or_snow
          }
        ]
      },
      "GlobalParameters": {
        "method": "predict"
      }
    })
  });
  suggestion = await suggestion.json();
  return suggestion.Results[0];
}