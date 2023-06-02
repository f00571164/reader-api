var userSchema = new mongoose.Schema({
         active: Boolean,
         email: { type: String, trim: true, lowercase: true },
         firstName: { type: String, trim: true },
         lastName: { type: String, trim: true },
         sp_api_key_id: { type: String, trim: true },
         sp_api_key_secret: { type: String, trim: true },
         subs: { type: [mongoose.Schema.Types.ObjectId], default: [] },
         created: { type: Date, default: Date.now },
         lastLogin: { type: Date, default: Date.now },
     },
     { collection: 'user' }
);

userSchema.index({email : 1}, {unique:true});
userSchema.index({sp_api_key_id : 1}, {unique:true});

var UserModel = mongoose.model( 'User', userSchema );
<p>var feedSchema = new mongoose.Schema({
feedURL: { type: String, trim:true },
link: { type: String, trim:true },
description: { type: String, trim:true },
state: { type: String, trim:true, lowercase:true, default: 'new' },
createdDate: { type: Date, default: Date.now },
modifiedDate: { type: Date, default: Date.now },
},
{ collection: 'feed' }
);</p>
<p>feedSchema.index({feedURL : 1}, {unique:true});
feedSchema.index({link : 1}, {unique:true, sparse:true});</p>
<p>var FeedModel = mongoose.model( 'Feed', feedSchema );</p>
<p>var feedEntrySchema = new mongoose.Schema({
description: { type: String, trim:true },
title: { type: String, trim:true },
summary: { type: String, trim:true },
entryID: { type: String, trim:true },
publishedDate: { type: Date },
link: { type: String, trim:true  },
feedID: { type: mongoose.Schema.Types.ObjectId },
state: { type: String, trim:true, lowercase:true, default: 'new' },
created: { type: Date, default: Date.now },
},
{ collection: 'feedEntry' }
);</p>
<p>feedEntrySchema.index({entryID : 1});
feedEntrySchema.index({feedID : 1});</p>
<p>var FeedEntryModel = mongoose.model( 'FeedEntry', feedEntrySchema );</p>
<p>var userFeedEntrySchema = new mongoose.Schema({
userID: { type: mongoose.Schema.Types.ObjectId },
feedEntryID: { type: mongoose.Schema.Types.ObjectId },
feedID: { type: mongoose.Schema.Types.ObjectId },
read : { type: Boolean, default: false },
},
{ collection: 'userFeedEntry' }
);

userFeedEntrySchema.index({userID : 1, feedID : 1, feedEntryID : 1, read : 1});
<p>var UserFeedEntryModel = mongoose.model('UserFeedEntry', userFeedEntrySchema );

Norberto Leite
April 16, 2015 | Updated: May 2, 2018
#Technical

Updated March 2017 Since this post, other MEAN & MERN stack posts have been written: The Modern Application Stack by Andrew Morgan.

In the first part of this blog series, we covered the basic mechanics of our application and undertook some data modeling. In this second part, we will create tests that validate the behavior of our application and then describe how to set-up and run the application.
Write the tests first

Let’s begin by defining some small configuration libraries.

file name: test/config/test_config.js

module.exports = {
    url : 'http://localhost:8000/api/v1.0'
}

Our server will be running on port 8000 on localhost. This will be fine for initial testing purposes. Later, if we change the location or port number for a production system, it would be very easy to just edit this file.

To prepare for our test cases, we need to ensure that we have a good test environment. The following code achieves this for us. First, we connect to the database.

file name: test/setup_tests.js

function connectDB(callback) {
    mongoClient.connect(dbConfig.testDBURL, function(err, db) {
        assert.equal(null, err);
        reader_test_db = db;
        console.log("Connected correctly to server");
        callback(0);
    });
}

Next, we drop the user collection. This ensures that our database is in a known starting state.

function dropUserCollection(callback) {
        console.log("dropUserCollection");
        user = reader_test_db.collection('user');
        if (undefined != user) {
            user.drop(function(err, reply) {
                console.log('user collection dropped');
                callback(0);
            });
        } else {
            callback(0);
        }
    },

Next, we will drop the user feed entry collection.

    function dropUserFeedEntryCollection(callback) {
        console.log("dropUserFeedEntryCollection");
        user_feed_entry = reader_test_db.collection('user_feed_entry');
        if (undefined != user_feed_entry) {
            user_feed_entry.drop(function(err, reply) {
                console.log('user_feed_entry collection dropped');
                callback(0);
            });
        } else {
            callback(0);
        }
    }

Next, we will connect to Stormpath and delete all the users in our test application.

function getApplication(callback) {
        console.log("getApplication");
        client.getApplications({
            name: SP_APP_NAME
        }, function(err, applications) {
            console.log(applications);
            if (err) {
                log("Error in getApplications");
                throw err;
            }
            app = applications.items[0];
            callback(0);
        });
    },
    function deleteTestAccounts(callback) {
        app.getAccounts({
            email: TU_EMAIL_REGEX
        }, function(err, accounts) {
            if (err) throw err;
            accounts.items.forEach(function deleteAccount(account) {
                account.delete(function deleteError(err) {
                    if (err) throw err;
                });
            });
            callback(0);
        });
    }

Next, we close the database.

function closeDB(callback) {
    reader_test_db.close();
}

Finally, we call async.series to ensure that all the functions run in the correct order.

async.series([connectDB, dropUserCollection, dropUserFeedEntryCollection, dropUserFeedEntryCollection, getApplication, deleteTestAccounts, closeDB]);

Frisby was briefly mentioned earlier. We will use this to define our test cases, as follows.

file name: test/create_accounts_error_spec.js

TU1_FN = "Test";
TU1_LN = "User1";
TU1_EMAIL = "testuser1@example.com";
TU1_PW = "testUser123";
TU_EMAIL_REGEX = 'testuser*';
SP_APP_NAME = 'Reader Test';
<p>var frisby = require('frisby');
var tc = require('./config/test_config');

We will start with the enroll route in the following code. In this case we are deliberately missing the first name field, so we expect a status reply of 400 with a JSON error that we forgot to define the first name. Let’s “toss that frisby”:

frisby.create('POST missing firstName')
    .post(tc.url + '/user/enroll',
          { 'lastName' : TU1_LN,
            'email' : TU1_EMAIL,
            'password' : TU1_PW })
    .expectStatus(400)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSON({'error' : 'Undefined First Name'})
    .toss()

In the following example, we are testing a password that does not have any lower-case letters. This would actually result in an error being returned by Stormpath, and we would expect a status reply of 400.

frisby.create('POST password missing lowercase')
    .post(tc.url + '/user/enroll',
          { 'firstName' : TU1_FN,
            'lastName' : TU1_LN,
            'email' : TU1_EMAIL,
            'password' : 'TESTUSER123' })
    .expectStatus(400)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSONTypes({'error' : String})
    .toss()

In the following example, we are testing an invalid email address. So, we can see that there is no @ sign and no domain name in the email address we are passing, and we would expect a status reply of 400.

frisby.create('POST invalid email address')
    .post(tc.url + '/user/enroll',
          { 'firstName' : TU1_FN,
            'lastName' : TU1_LN,
            'email' : "invalid.email",
            'password' : 'testUser' })
    .expectStatus(400)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSONTypes({'error' : String})
    .toss()

Now, let’s look at some examples of test cases that should work. Let’s start by defining 3 users.

file name: test/create_accounts_spec.js

TEST_USERS = [{'fn' : 'Test', 'ln' : 'User1',
               'email' : 'testuser1@example.com', 'pwd' : 'testUser123'},
              {'fn' : 'Test', 'ln' : 'User2',
               'email' : 'testuser2@example.com', 'pwd' : 'testUser123'},
              {'fn' : 'Test', 'ln' : 'User3',
               'email' : 'testuser3@example.com', 'pwd' : 'testUser123'}]
<p>SP_APP_NAME = 'Reader Test';</p>
<p>var frisby = require('frisby');
var tc = require('./config/test_config');

In the following example, we are sending the array of the 3 users we defined above and are expecting a success status of 201. The JSON document returned would show the user object created, so we can verify that what was created matched our test data.

TEST_USERS.forEach(function createUser(user, index, array) {
    frisby.create('POST enroll user ' + user.email)
        .post(tc.url + '/user/enroll',
              { 'firstName' : user.fn,
                'lastName' : user.ln,
                'email' : user.email,
                'password' : user.pwd })
        .expectStatus(201)
        .expectHeader('Content-Type', 'application/json; charset=utf-8')
        .expectJSON({ 'firstName' : user.fn,
                      'lastName' : user.ln,
                      'email' : user.email })
        .toss()
});

Next, we will test for a duplicate user. In the following example, we will try to create a user where the email address already exists.

frisby.create('POST enroll duplicate user ')
    .post(tc.url + '/user/enroll',
          { 'firstName' : TEST_USERS[0].fn,
            'lastName' : TEST_USERS[0].ln,
            'email' : TEST_USERS[0].email,
            'password' : TEST_USERS[0].pwd })
    .expectStatus(400)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSON({'error' : 'Account with that email already exists.  Please choose another email.'})
    .toss()

One important issue is that we don’t know what API key will be returned by Stormpath a priori. So, we need to create a file dynamically that looks like the following. We can then use this file to define test cases that require us to authenticate a user.

file name: /tmp/readerTestCreds.js

TEST_USERS = 
[{	"_id":"54ad6c3ae764de42070b27b1",
	"email":"testuser1@example.com",
	"firstName":"Test",
	"lastName":"User1",
	"sp_api_key_id":”<API KEY ID>",
	"sp_api_key_secret":”<API KEY SECRET>”
},
{	"_id":"54ad6c3be764de42070b27b2”,
	"email":"testuser2@example.com",
	"firstName":"Test",
	"lastName":"User2”,
	"sp_api_key_id":”<API KEY ID>",
	"sp_api_key_secret":”<API KEY SECRET>”
}];
module.exports = TEST_USERS;

In order to create the temporary file above, we need to connect to MongoDB and retrieve user information. This is achieved by the following code.

file name: tests/writeCreds.js

TU_EMAIL_REGEX = new RegExp('^testuser*');
SP_APP_NAME = 'Reader Test';
TEST_CREDS_TMP_FILE = '/tmp/readerTestCreds.js';
<p>var async = require('async');
var dbConfig = require('./config/db.js');
var mongodb = require('mongodb');
assert = require('assert');</p>
<p>var mongoClient = mongodb.MongoClient
var reader_test_db = null;
var users_array = null;</p>
<p>function connectDB(callback) {
mongoClient.connect(dbConfig.testDBURL, function(err, db) {
assert.equal(null, err);
reader_test_db = db;
callback(null);
});
}</p>
<p>function lookupUserKeys(callback) {
console.log("lookupUserKeys");
user_coll = reader_test_db.collection('user');
user_coll.find({email : TU_EMAIL_REGEX}).toArray(function(err, users) {
users_array = users;
callback(null);
});
}</p>
<p>function writeCreds(callback) {
var fs = require('fs');
fs.writeFileSync(TEST_CREDS_TMP_FILE, 'TEST_USERS = ');
fs.appendFileSync(TEST_CREDS_TMP_FILE, JSON.stringify(users_array));
fs.appendFileSync(TEST_CREDS_TMP_FILE, '; module.exports = TEST_USERS;');
callback(0);
}</p>
<p>function closeDB(callback) {
reader_test_db.close();
}</p>
<p>async.series([connectDB, lookupUserKeys, writeCreds, closeDB]);

In the following code, we can see that the first line uses the temporary file that we created with the user information. We have also defined several feeds, such as Dilbert and the Eater Blog.

file name: tests/feed_spec.js


TEST_USERS = require('/tmp/readerTestCreds.js');
<p>var frisby = require('frisby');
var tc = require('./config/test_config');
var async = require('async');
var dbConfig = require('./config/db.js');</p>
<p>var dilbertFeedURL = 'http://feeds.feedburner.com/DilbertDailyStrip';
var nycEaterFeedURL = 'http://feeds.feedburner.com/eater/nyc';

Previously, we defined some users but none of them had subscribed to any feeds. In the following code we test feed subscription. Note that authentication is required now and this is achieved using .auth with the Stormpath API keys. Our first test is to check for an empty feed list.

function addEmptyFeedListTest(callback) {
 	var user = TEST_USERS[0];
 	frisby.create('GET empty feed list for user ' + user.email)
             .get(tc.url + '/feeds')
             .auth(user.sp_api_key_id, user.sp_api_key_secret)
             .expectStatus(200)
             .expectHeader('Content-Type', 'application/json; charset=utf-8')
             .expectJSON({feeds : []})
             .toss()
             callback(null);
}

In our next test case, we will subscribe our first test user to the Dilbert feed.

function subOneFeed(callback) {
 	var user = TEST_USERS[0];
 	frisby.create('PUT Add feed sub for user ' + user.email)
             .put(tc.url + '/feeds/subscribe', {'feedURL' : dilbertFeedURL})
             .auth(user.sp_api_key_id, user.sp_api_key_secret)
             .expectStatus(201)
             .expectHeader('Content-Type', 'application/json; charset=utf-8')
             .expectJSONLength('user.subs', 1)
             .toss()
             callback(null);
}

In our next test case, we will try to subscribe our first test user to a feed that they are already subscribed-to.

function subDuplicateFeed(callback) {
 	var user = TEST_USERS[0];
 	frisby.create('PUT Add duplicate feed sub for user ' + user.email)
             .put(tc.url + '/feeds/subscribe',
                  {'feedURL' : dilbertFeedURL})
             .auth(user.sp_api_key_id, user.sp_api_key_secret)
             .expectStatus(201)
             .expectHeader('Content-Type', 'application/json; charset=utf-8')
             .expectJSONLength('user.subs', 1)
             .toss()
 	callback(null);
}

Next, we will subscribe our test user to a new feed. The result returned should confirm that the user is subscribed now to 2 feeds.

function subSecondFeed(callback) {
 	var user = TEST_USERS[0];
 	frisby.create('PUT Add second feed sub for user ' + user.email)
             .put(tc.url + '/feeds/subscribe',
                  {'feedURL' : nycEaterFeedURL})
             .auth(user.sp_api_key_id, user.sp_api_key_secret)
             .expectStatus(201)
             .expectHeader('Content-Type', 'application/json; charset=utf-8')
             .expectJSONLength('user.subs', 2)
             .toss()
 	callback(null);
 }

Next, we will use our second test user to subscribe to a feed.

function subOneFeedSecondUser(callback) {
 	var user = TEST_USERS[1];
 	frisby.create('PUT Add one feed sub for second user ' + user.email)
             .put(tc.url + '/feeds/subscribe',
                  {'feedURL' : nycEaterFeedURL})
             .auth(user.sp_api_key_id, user.sp_api_key_secret)
             .expectStatus(201)
             .expectHeader('Content-Type', 'application/json; charset=utf-8')
             .expectJSONLength('user.subs', 1)
             .toss()
 	callback(null);
}
<p>async.series([addEmptyFeedListTest, subOneFeed, subDuplicateFeed, subSecondFeed, subOneFeedSecondUser]);

The REST API

Before we begin writing our REST API code, we need to define some utility libraries. First, we need to define how our application will connect to the database. Putting this information into a file gives us the flexibility to add different database URLs for development or production systems.

file name: config/db.js

module.exports = {
     url : 'mongodb://localhost/reader_test'
 }

If we wanted to turn on database authentication we could put that information in a file, as shown below. This file should not be checked into source code control for obvious reasons.

file name: config/security.js

module.exports = {
     stormpath_secret_key : ‘YOUR STORMPATH APPLICATION KEY’;
}

We can keep Stormpath API and Secret keys in a properties file, as follows, and need to carefully manage this file as well.

file name: config/stormpath_apikey.properties

apiKey.id = YOUR STORMPATH API KEY ID
apiKey.secret = YOUR STORMPATH API KEY SECRET

Express.js overview

In Express.js, we create an “application” (app). This application listens on a particular port for HTTP requests to come in. When requests come in, they pass through a middleware chain. Each link in the middleware chain is given a req (request) object and a res (results) object to store the results. Each link can choose to do work, or pass it to the next link. We add new middleware via app.use(). The main middleware is called our “router”, which looks at the URL and routes each different URL/verb combination to a specific handler function.
Creating our application

Now we can finally see our application code, which is quite small since we can embed handlers for various routes into separate files.

file name: server.js

var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var stormpath = require('express-stormpath');
var routes = require("./app/routes");
var db	 = require('./config/db');
var security = require('./config/security');
<p>var app = express();
var morgan = require('morgan’);
app.use(morgan);
app.use(stormpath.init(app, {
apiKeyFile: './config/stormpath_apikey.properties',
application: ‘YOUR SP APPLICATION URL',
secretKey: security.stormpath_secret_key
}));
var port = 8000;
mongoose.connect(db.url);</p>
<p>app.use(bodyParser.urlencoded({ extended: true }));</p>
<p>routes.addAPIRouter(app, mongoose, stormpath);

We define our own middleware at the end of the chain to handle bad URLs.

app.use(function(req, res, next){
   res.status(404);
   res.json({ error: 'Invalid URL' });
});

Now our server application is listening on port 8000.

app.listen(port);

Let’s print a message on the console to the user.

console.log('Magic happens on port ' + port);
<p>exports = module.exports = app;

Defining our Mongoose data models

We use Mongoose to map objects on the Node.js side to documents inside MongoDB. Recall that earlier, we defined 4 collections:

    Feed collection.
    Feed entry collection.
    User collection.
    User feed-entry-mapping collection.

So we will now define schemas for these 4 collections. Let’s begin with the user schema. Notice that we can also format the data, such as converting strings to lowercase, and remove leading or trailing whitespace using trim.

file name: app/routes.js

var userSchema = new mongoose.Schema({
         active: Boolean,
         email: { type: String, trim: true, lowercase: true },
         firstName: { type: String, trim: true },
         lastName: { type: String, trim: true },
         sp_api_key_id: { type: String, trim: true },
         sp_api_key_secret: { type: String, trim: true },
         subs: { type: [mongoose.Schema.Types.ObjectId], default: [] },
         created: { type: Date, default: Date.now },
         lastLogin: { type: Date, default: Date.now },
     },
     { collection: 'user' }
);

In the following code, we can also tell Mongoose what indexes need to exist. Mongoose will also ensure that these indexes are created if they do not already exist in our MongoDB database. The unique constraint ensures that duplicates are not allowed. The “email : 1” maintains email addresses in ascending order. If we used “email : -1” it would be in descending order.

userSchema.index({email : 1}, {unique:true});
userSchema.index({sp_api_key_id : 1}, {unique:true});

We repeat the process for the other 3 collections.

var UserModel = mongoose.model( 'User', userSchema );
<p>var feedSchema = new mongoose.Schema({
feedURL: { type: String, trim:true },
link: { type: String, trim:true },
description: { type: String, trim:true },
state: { type: String, trim:true, lowercase:true, default: 'new' },
createdDate: { type: Date, default: Date.now },
modifiedDate: { type: Date, default: Date.now },
},
{ collection: 'feed' }
);</p>
<p>feedSchema.index({feedURL : 1}, {unique:true});
feedSchema.index({link : 1}, {unique:true, sparse:true});</p>
<p>var FeedModel = mongoose.model( 'Feed', feedSchema );</p>
<p>var feedEntrySchema = new mongoose.Schema({
description: { type: String, trim:true },
title: { type: String, trim:true },
summary: { type: String, trim:true },
entryID: { type: String, trim:true },
publishedDate: { type: Date },
link: { type: String, trim:true  },
feedID: { type: mongoose.Schema.Types.ObjectId },
state: { type: String, trim:true, lowercase:true, default: 'new' },
created: { type: Date, default: Date.now },
},
{ collection: 'feedEntry' }
);</p>
<p>feedEntrySchema.index({entryID : 1});
feedEntrySchema.index({feedID : 1});</p>
<p>var FeedEntryModel = mongoose.model( 'FeedEntry', feedEntrySchema );</p>
<p>var userFeedEntrySchema = new mongoose.Schema({
userID: { type: mongoose.Schema.Types.ObjectId },
feedEntryID: { type: mongoose.Schema.Types.ObjectId },
feedID: { type: mongoose.Schema.Types.ObjectId },
read : { type: Boolean, default: false },
},
{ collection: 'userFeedEntry' }
);

The following is an example of a compound index on 4 fields. Each index is maintained in ascending order.

userFeedEntrySchema.index({userID : 1, feedID : 1, feedEntryID : 1, read : 1});
<p>var UserFeedEntryModel = mongoose.model('UserFeedEntry', userFeedEntrySchema );

Every route that comes in for GET, POST, PUT and DELETE needs to have the correct content type, which is application/json. Then the next link in the chain is called.

exports.addAPIRouter = function(app, mongoose, stormpath) {
<pre><code>app.get('/*', function(req, res, next) {
	res.contentType('application/json');
	next();
});
app.post('/*', function(req, res, next) {
	res.contentType('application/json');
	next();
});
app.put('/*', function(req, res, next) {
	res.contentType('application/json');
	next();
});
app.delete('/*', function(req, res, next) {
	res.contentType('application/json');
	next();
});</code></pre>

var router = express.Router();
<pre><code>router.post('/user/enroll', function(req, res) {
	logger.debug('Router for /user/enroll');
	…
}
router.get('/feeds', stormpath.apiAuthenticationRequired, function(req, res) {
	logger.debug('Router for /feeds');
	…
}
router.put('/feeds/subscribe', 
		  stormpath.apiAuthenticationRequired, function(req, res) {
	logger.debug('Router for /feeds');
	…
}
app.use('/api/v1.0', router);
