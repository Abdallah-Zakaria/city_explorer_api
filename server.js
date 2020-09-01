"use strict"

const express = require('express');
require('dotenv').config();
const cors = require("cors");
const superagent = require('superagent');
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new pg.Client(process.env.DATABASE_URL);

app.use(cors())

app.get("/", (req, res) => {
    res.status(200).send('you are doing great');
})

app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

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

async function locationHandler(request, response) {
    const city = request.query.city;
    let API_allowed = await checkDB(city);
    if (API_allowed === true) {
        await getLocation(city).then((data) => {
            saveLocDB(data).then((sData) => {
                response.status(200).json(sData);
            });
        });
    } else {
        delete API_allowed[0].id;
        response.status(200).json(API_allowed[0]);
    }
}

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

let cordinate = [];

function ObjectLocation(cityData, locData) {
    this.search_query = cityData
    this.formatted_query = locData[0].display_name
    this.latitude = locData[0].lat
    this.longitude = locData[0].lon
    cordinate.push(this.latitude, this.longitude)
}

function weatherHandler(request, response) {
    const search_query = request.query.search_query;
    getWeather(search_query)
        .then(dataWeather => response.status(200).json(dataWeather));
}

function getWeather(search_query) {
    let key = process.env.WEATHER_API_KEY;
    const url = `http://api.weatherbit.io/v2.0/forecast/daily?key=${key}&city=${search_query}&days=8`;

    return superagent.get(url)

        .then(data => {
            console.log(data.body)
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



function trailHandler(request, response) {
    getTrail(cordinate)
        .then(dataTrail => response.status(200).json(dataTrail));
}

function getTrail(cordinate) {
    let key = process.env.TRAIL_API_KEY;
    const url = `https://www.hikingproject.com/data/get-trails?lat=${cordinate[0]}&lon=${cordinate[1]}&maxResults=10&key=${key}`;
    console.log(cordinate)
    return superagent.get(url)

        .then(data => {
            console.log(data.body.trails)
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





function notFoundHandler(request, response) {
    response.status(404).send('huh?');
}

function errorHandler(error, request, response) {
    response.status(500).send(error);
}



client.connect()
    .then(() => {
        app.listen(PORT, () =>
            console.log(`listening on ${PORT}`)
        );
    })