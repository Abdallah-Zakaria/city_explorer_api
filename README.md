# city_explorer_api


**Author**: Abdallah Zakaria
**Version**: 1.0.0 

## Overview
<!-- Provide a high level overview of what this application is and why you are building it, beyond the fact that it's an assignment for this class. (i.e. What's your problem domain?) -->
This app give the user the location and map of a specific country and the weather of it.

## Getting Started
<!-- What are the steps that a user must take in order to build this app on their own machine and get it running? -->
They type on the url ether a location and can search the country as (location?city="what user search for") and can search about the weather.

## Architecture
<!-- Provide a detailed description of the application design. What technologies (languages, libraries, etc) you're using, and any other relevant design information. -->

We have 2 route first one to response to the user the location using the location.json file to get the data and pass it on the constructor, here if the user type location will give him the all data, if he request any string related to the city inside the loaction file will apper the data, but if hhis search doen't match any of result will respones form him a error 500, we use split to make search eazy , ND WE PUSH UNDIFIND for the array to make it by default work,
same work for the weather but there is no a query from the user. 

we use node.js express and javaScript JSON data files , we add .gitignore and .eslintrc.json.


## Change Log
<!-- Use this area to document the iterative changes made to your application as each feature is successfully implemented. Use time stamps. Here's an examples:

01-01-2001 4:59pm - Application now has a fully-functional express server, with a GET route for the location resource.

## Credits and Collaborations
<!-- Give credit (and a link) to other people or resources that helped you build this application. -->
pair programming with abdulhakim zatar
-->

