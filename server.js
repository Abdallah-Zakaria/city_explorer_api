"use strict"
// dependency 
/* ------------------------------------------------------------------------------------------------------*/
const express = require('express');
require('dotenv').config();
const cors = require("cors");
const superagent = require('superagent');
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new pg.Client(process.env.DATABASE_URL);

app.use(cors())

let cordinate = [];
let areaName;

// default page
app.get("/", (req, res) => {
    res.status(200).send('you are doing great');
})

// main routes
/* ------------------------------------------------------------------------------------------------------*/
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailHandler);
app.get('/movies', movieHandler);
app.get('/yelp', yelpHandler); 
app.use('*', notFoundHandler); // for any route doesn't existing
app.use(errorHandler); 

// functions for the locations 
/* ------------------------------------------------------------------------------------------------------*/
async function locationHandler(request, response) {
    const city = request.query.city;
    let API_allowed = await checkDB(city); // #1
    if (API_allowed === true) {
        await getLocation(city, areaName).then((data) => { // #2 
            saveLocDB(data, areaName).then((sData) => { // #3
                response.status(200).json(sData);
            });
        });
    } else {
        await getLocation(city, areaName).then(data => { // #2 
            delete API_allowed[0].id;
            response.status(200).json(API_allowed[0]);
        })
    }
}


// #1
function checkDB(city) {
    let SQL = `SELECT * FROM locations WHERE search_query=$1;`;
    let values = [city];

    return client.query(SQL, values)
        .then(results => {
            if (results.rows.length == 0) {
                return true;
            } else {
                return results.rows;
            }
        })
}

// #2 
function getLocation(city) {
    let key = process.env.GEOCODE_API_KEY;
    const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;

    return superagent.get(url)
        .then(data => {
            cordinate = [];
            const location = new ObjectLocation(city, data.body);
            return location;
        })
}

function ObjectLocation(cityData, locData) {
    this.search_query = cityData
    this.formatted_query = locData[0].display_name
    this.latitude = locData[0].lat
    this.longitude = locData[0].lon
    cordinate.push(this.latitude, this.longitude)
    let lengthFQ = this.formatted_query.split(', ')
    console.log(lengthFQ)

    if (lengthFQ.length == 1) {
        areaName = lengthFQ[0];
    } else {
        areaName = lengthFQ[lengthFQ.length - 1];
    }
}

// #3
function saveLocDB(data) {
    let SQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4);`;
    let values = [data.search_query, data.formatted_query, data.latitude, data.longitude,];
    return client.query(SQL, values)
        .then((result) => {
            return data;
        })
        .catch((err) => {
            console.log("Error", err);
        });
}


// functions for the weather 
/* ------------------------------------------------------------------------------------------------------*/
function weatherHandler(request, response) {
    const search_query = request.query.search_query;
    getWeather(search_query)// #1
        .then(dataWeather => response.status(200).json(dataWeather));
}

// #1
function getWeather(search_query) {
    let key = process.env.WEATHER_API_KEY;
    const url = `http://api.weatherbit.io/v2.0/forecast/daily?key=${key}&city=${search_query}&days=8`;

    return superagent.get(url)

        .then(data => {
            let eightDays = data.body.data;
            let eightDaysMap = eightDays.map((item) => {
                return new ObjectWeather(item);
            })
            return eightDaysMap;
        })
}

function ObjectWeather(weatherData) {
    this.forecast = weatherData.weather.description
    this.time = weatherData.datetime
}

// functions for the trail 
/* ------------------------------------------------------------------------------------------------------*/
function trailHandler(request, response) {
    getTrail(cordinate) // #1
        .then(dataTrail => response.status(200).json(dataTrail));
}

// #1
function getTrail(cordinate) {
    let key = process.env.TRAIL_API_KEY;
    const url = `https://www.hikingproject.com/data/get-trails?lat=${cordinate[0]}&lon=${cordinate[1]}&maxResults=10&key=${key}`;
    return superagent.get(url)

        .then(data => {
            let tenTrails = data.body.trails;
            let tenTrailsMap = tenTrails.map((item) => {
                return new Trail(item);
            })
            return tenTrailsMap;
        })
}

function Trail(trailData) {
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

// functions for the movie 
/* ------------------------------------------------------------------------------------------------------*/
function movieHandler(request, response) {
    getMovie(areaName) // #1
        .then(dataMovie => response.status(200).json(dataMovie));
}

// #1
async function getMovie(areaName) {
    let key = process.env.MOVIE_API_KEY;
    const areaURL = `https://api.themoviedb.org/3/configuration/countries?api_key=${key}`;
    let x;
    let isoName;
    await superagent.get(areaURL).then(data => {
        let isoArr = data.body;

        isoArr.forEach((item, index) => {
            if (item.english_name == areaName ) {
                x = index;
            }else if(areaName == "USA"){
                x = 226;
            }

        })
        isoName = isoArr[x].iso_3166_1;
    })

    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&region=${isoName}&sort_by=popularity.desc`;

    return superagent.get(url)
    .then(data =>{
        let twnMovies = data.body.results;
        let twnMoviesMap = twnMovies.map((item) =>{
            return new Movie(item);
        })
        return twnMoviesMap;
    })
    .catch((err) => {
        console.log("Error", err);
    });
}

function Movie(movieData) {
    this.title = movieData.title;
    this.overview = movieData.overview;
    this.average_votes = movieData.average_votes;
    this.total_votes = movieData.total_votes;
    this.image_url = movieData.image_url;
    this.popularity = movieData.popularity;
    this.released_on = movieData.released_on;
}

// functions for the yelp 
/* ------------------------------------------------------------------------------------------------------*/
function yelpHandler(request, response) {
    getYelp(cordinate) // #1
        .then(dataYelp => response.status(200).json(dataYelp));
}

// #1
function getYelp(cordinate) {
    let key = process.env.YELP_API_KEY;
    const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${cordinate[0]}&longitude=${cordinate[1]}`;

    //set the Authorization HTTP header value as Bearer API_KEY 
    return superagent.get(url).set("Authorization", `Bearer ${key}`)
    .then(data =>{
        let twnRestaurants = data.body.businesses;
        let twnRestaurantsMap = twnRestaurants.map((item) =>{
            return new Yelp(item);
        })
        return twnRestaurantsMap;
    })
    .catch((err) => {
        console.log("Error", err);
    });
}

function Yelp(yelpData) {
    this.name = yelpData.name;
    this.image_url = yelpData.image_url;
    this.price = yelpData.price;
    this.rating = yelpData.rating;
    this.url = yelpData.url;
}




// functions for the error and wrong route
/* ------------------------------------------------------------------------------------------------------*/
function notFoundHandler(request, response) {
    response.status(404).send('huh?');
}

function errorHandler(error, request, response) {
    response.status(500).send(error);
}


// function to make sure to link data before start 
/* ------------------------------------------------------------------------------------------------------*/
client.connect()
    .then(() => {
        app.listen(PORT, () =>
            console.log(`listening on ${PORT}`)
        );
    })