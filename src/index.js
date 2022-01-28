const express = require('express');
const bodyParser = require('body-parser');
const { auth } = require('express-openid-connect');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const {startDatabase} = require('./database/mongo');
const {insertAd, getAds, deleteAd, updateAd} = require('./database/ads');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// defining the Express app
const app = express();


// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));


const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://localhost:3001',
  clientID: 'j76RbbMD2XDogXACgAv3ZMUoEwba0zbC',
  issuerBaseURL: 'https://dev-eo3ov8rm.us.auth0.com'
};

app.use(auth(config));


// ... leave the app definition and the middleware config untouched ...

// replace the endpoint responsible for the GET requests
app.get('/', async (req, res) => {
  res.send(await getAds());
});


app.post('/', async (req, res) => {
  const newAd = req.body;
  if(req.oidc.isAuthenticated()){
    await insertAd(newAd);
    res.send({ message: 'New ad inserted.' });
  } else {
    res.send({ message: 'You dont have permission' });
  }
});

app.delete('/:id', async (req, res) => {
  if(req.oidc.isAuthenticated()){
    await deleteAd(req.params.id);
    res.send({ message: 'Ad removed.' });
  } else {
    res.send({ message: 'You dont have permission' });
  }
});

// endpoint to update an ad
app.put('/:id', async (req, res) => {
  if(req.oidc.isAuthenticated()){
    const updatedAd = req.body;
    console.log('ID ->', req.params.id);
    await updateAd(req.params.id, updatedAd);
    res.send({ message: 'Ad updated.' });
  } else {
    res.send({ message: 'You dont have permission' });
  }
});

// start the in-memory MongoDB instance
startDatabase().then(async () => {
  await insertAd({title: 'Hello, now from the in-memory database!'});

  // start the server
  app.listen(3001, async () => {
    console.log('listening on port 3001');
  });
});
