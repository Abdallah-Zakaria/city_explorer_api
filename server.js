"use strict"

const express = require('express');
require('dotenv').config();
const cors = require("cors");
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())

app.get("/", (req, res) => {
    res.status(200).send('you are doing great');
})

app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

function locationHandler(request, response){
    const city = request.query.city;
    getLocation(city)
    .then(locationData => response.status(200).json(locationData)); 
}

function getLocation(city){
    let key = process.env.GEOCODE_API_KEY;
    const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;

    return superagent.get(url)
    .then(data =>{
        cordinate = [];
        const location = new ObjectLocation(city, data.body);
        return location;
    })
}




// app.get("/location", (req, res) => {
//     const locData = require("./data/location.json")

//     const cityData = req.query.city;
//     let location = new ObjectLocation(cityData, locData)

//     let display_nameArray = locData[0].display_name.split(", ")
//     display_nameArray.push(undefined)
//     console.log(display_nameArray)
//     let error = display_nameArray.includes(cityData)
//     if (error) {
//         res.send(location)
//     } else {
//         res.status(500).send("Sorry, something went wrong ");
//     }

// })


let cordinate = [];

function ObjectLocation(cityData, locData) {
    this.search_query = cityData
    this.formatted_query = locData[0].display_name
    this.latitude = locData[0].lat
    this.longitude = locData[0].lon
    cordinate.push(this.latitude, this.longitude)
}

function weatherHandler(request, response){
    const search_query = request.query.search_query;
    getWeather(search_query)
    .then(dataWeather => response.status(200).json(dataWeather)); 
}

function getWeather(search_query){
    let key = process.env.WEATHER_API_KEY;
    const url = `http://api.weatherbit.io/v2.0/forecast/daily?key=${key}&city=${search_query}&days=8`;

    return superagent.get(url)

    .then(data =>{
        console.log(data.body)
        let eightDays = data.body.data;
        let eightDaysMap = eightDays.map((item) =>{
            return new ObjectWeather(item);
        })
        return eightDaysMap;
    })
}

function ObjectWeather(weatherData) {
    this.forecast = weatherData.weather.description
    this.time = weatherData.datetime
}

// app.get('/weather', (req, res) => {
//     const wethData = require("./data/weather.json").data

//     let wethDataEachHour = []
//     wethData.forEach(item => {
//         let hours = new ObjectWeather(item);
//         wethDataEachHour.push(hours)
//     })
//     res.send(wethDataEachHour);
// })


function trailHandler(request, response){
    getTrail(cordinate)
    .then(dataTrail => response.status(200).json(dataTrail)); 
}

function getTrail(cordinate){
    let key = process.env.TRAIL_API_KEY;
    const url = `https://www.hikingproject.com/data/get-trails?lat=${cordinate[0]}&lon=${cordinate[1]}&maxResults=10&key=${key}`;
    console.log(cordinate)
    return superagent.get(url)

    .then(data =>{
        console.log(data.body.trails)
        let tenTrails = data.body.trails;
        let tenTrailsMap = tenTrails.map((item) =>{
            return new Trail(item);
        })
        return tenTrailsMap;
    })
}

function Trail (trailData) {
    this.name = trailData.name;
    this.location = trailData.location;
    this.length = trailData.length;
    this.stars = trailData.stars;
    this.star_votes = trailData.starVotes;
    this.summary = trailData.summary;
    this.trail_url = trailData.url;
    this.conditions = trailData.conditionDetails;
    this.condition_date = trailData.conditionDate.split(" ")[0];
    this.condition_time = trailData.conditionDate.split(" ")[1];
}





// app.use('*', (req, res) => {
//     res.status(404).send('NOT FOUND');
// })

function notFoundHandler(request, response) {
    response.status(404).send('huh?');
  }

// app.use((error, req, res) => {
//     res.status(500).send("Sorry, something went wrong");
// })

function errorHandler(error, request, response) {
    response.status(500).send(error);
  }

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
})