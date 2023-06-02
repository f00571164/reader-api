function connectDB(callback) {
    mongoClient.connect(dbConfig.testDBURL, function(err, db) {
        assert.equal(null, err);
        reader_test_db = db;
        console.log("Connected correctly to server");
        callback(0);
    });
}

// drop the user collection to start from a known state
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
      
   // drop user feed entry collection
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


//connect to Stormpath and delete all users in the test app
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


// then close the database 
function closeDB(callback) {
    reader_test_db.close();
}
async.series([connectDB, dropUserCollection, dropUserFeedEntryCollection, dropUserFeedEntryCollection, getApplication, deleteTestAccounts, closeDB]);


