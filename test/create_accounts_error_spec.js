TU1_FN = "Test";
TU1_LN = "User1";
TU1_EMAIL = "testuser1@example.com";
TU1_PW = "testUser123";
TU_EMAIL_REGEX = 'testuser*';
SP_APP_NAME = 'Reader Test';
<p>var frisby = require('frisby');
var tc = require('./config/test_config');


//Testing the enroll route

//test enrollment with missing first name
frisby.create('POST missing firstName')
    .post(tc.url + '/user/enroll',
          { 'lastName' : TU1_LN,
            'email' : TU1_EMAIL,
            'password' : TU1_PW })
    .expectStatus(400)
    .expectHeader('Content-Type', 'application/json; charset=utf-8')
    .expectJSON({'error' : 'Undefined First Name'})
    .toss()

// password missing lowercase
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
