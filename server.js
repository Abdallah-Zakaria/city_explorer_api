"use strict"

const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();

// the defualt route
app.get("/", (req, res) => {
    res.status(200).send('you are doing great');
})


app.get("/location", (req, res) => {
    const locData = require("./data/location.json")

    const cityData = req.query.city;

    let location = new ObjectLocation(cityData, locData)
    res.send(location);
})

function ObjectLocation(cityData, locData){
    this.search_query = cityData
    this.formatted_query = locData[0].display_name
    this.latitude = locData[0].lat
    this.longitude = locData[0].lon
}


app.get('/weather' ,(req, res)=>{
    const wethData = require("./data/weather.json").data
    
    let wethDataEachHour =[]
    wethData.forEach(item => {
        let hours = new ObjectWeather(item);
        wethDataEachHour.push(hours)
    })
    res.send(wethDataEachHour);
})

function ObjectWeather(item){
    this.forecast =  item.weather.description
    this.time = item.datetime
}

app.use('*', (req, res) => {
    res.status(404).send('NOT FOUND');
})

app.use(("/location", req, res) => {
    res.status(500).send("Sorry, something went wrong");
})

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
})