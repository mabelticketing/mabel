/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

// imports
var config = require('./config.js');
var passport = require('passport');
var connection = require("./api/connection.js");
var LocalStrategy = require('passport-local').Strategy;
var RavenStrategy = require('passport-raven').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt = require("jwt-simple");
var Q = require('q');
var http = require('http');
var crypto = require('crypto');

var secret = config.jwt_secret;

module.exports = {
    // TODO: this isn't a very tidy place for this
    register: register
};

// TODO: Maybe one day - a load of the stuff here should probably go via API for consistency

// configure passport auth strategies

// mabel email + password login
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, LocalStrategyCallback));

// raven login
passport.use(new RavenStrategy({
    // NB I don't know what audience is actually for. It seems to just work like a base url
    audience: config.base_url,
    desc: 'Mabel Ticketing System', // TODO: Parameterise this
    msg: 'Mabel Ticketing System needs to check you are a current member of the university',
    // use demonstration raven server in development
    debug: false
}, RavenStrategyCallback));

// token auth (for access to the api)
passport.use(new BearerStrategy(BearerStrategyCallback));

// I don't know why we need (de)serialization functions but things get unhappy
// if they don't exist

function BearerStrategyCallback(token, done) {
    try {
        var decoded = jwt.decode(token, secret);
        if (decoded.authenticated === true) {
            return done(null, {
                id: decoded.id,
                groups: decoded.groups,
                token: token
            }, null);
        } else {
            return done(null, false);
        }
    } catch (e) {
        var err = new Error("Invalid token");
        err.code = 401;
        return done(err);
    }
}

function RavenStrategyCallback(crsid, params, done) {

    // try to find user in db with crsid
    connection.runSql("SELECT * FROM user WHERE crsid=?", [crsid])
        .then(function(rows) {
            var tokenPromise;

            if (rows.length < 1) {
                // if user not in table then put them in
                tokenPromise = register({
                    // TODO: et a better name than this?
                    name: "",
                    email: crsid + "@cam.ac.uk",
                    crsid: crsid,
                    is_verified: 1
                }).then(function(user) {
                    return getToken(user.id);
                });

            } else {
                // the user is in the table, so just get his user id to encode as the token
                tokenPromise = getToken(rows[0].id);
            }

            tokenPromise.then(function(token) {
                done(null, {
                    token: token,
                });
            }, function(err) {
                done(err);
            });
        }, function(err) {
            done(err);
        });

}

function LocalStrategyCallback(email, password, done) {
    var count = (email.match(/@/g) || []).length;
    if (count !== 1) {
        return done(null, false, {
            message: "Invalid email address"
        });
    }
    // try to find user in db with crsid
    connection.runSql("SELECT * FROM user WHERE email=?", [email])
        .then(function(values) {
            if (values.length < 1) {
                // user not registered
                throw {
                    // deliberately not saying whether it's email or password that was wrong
                    message: "Invalid credentials"
                };
            } else if (values.length > 1) {
                throw {
                    message: "Unexpectedly found many users :("
                };
            } else {
                var user = values[0];
                if (user.is_verified === 0) {
                    // user is not verified
                    throw {
                        message: "This email address has not been verified. <a href='/confirm/resend/" + user.email + "'>Click here</a> to resend the verification code."
                    };
                } else {
                    var hash = crypto.createHash('md5');
                    hash.update(password);
                    var md5_pass = hash.digest('hex');
                    if (md5_pass === user.password_md5) {
                        return getToken(user.id);
                    } else {
                        throw {
                            message: "Invalid credentials"
                        };
                    }
                }
            }
            console.log(values);
        })
        .then(function(token) {
            return done(null, {
                token: token,
            });
        }, function(err) {
            console.log(err);
            return done(null, false, err);
        });
}

// returns a promise which is resolved with the new user
function register(user) {

    // before the user insert stuff happens, retrieve the group stuff
    // TODO: parameterise event id
    return connection.runSql("SELECT * FROM event WHERE id=1")
        .then(function(eventDetails) {
            if (eventDetails.length !== 1) throw {
                error: "unexpected number of events"
            };
            var crsid, email, url = eventDetails[0].group_assignment_url;
            if (user.crsid !== undefined) {
                crsid = user.crsid;
            }
            if (user.email !== undefined) {
                email = user.email;
            }
            url = url.replace(/\{!crsid!\}/, crsid);
            url = url.replace(/\{!email!\}/, email);

            // http.request doesn't do promises, so we make one ourselves
            var deferred = Q.defer();

            http.get(url, function(res) {
                res.on("data", function(chunk) {
                    try {
                        deferred.resolve(JSON.parse(chunk));
                    } catch (err) {
                        deferred.reject(err);
                    }
                });
            }).on('error', function(e) {
                deferred.reject(new Error(e));
            });
            return deferred.promise;
        })
        .then(function(result) {
            var groups = result.groups;
            if (user.name === undefined || user.name === null || user.name.length < 1 || user.name === "Mabel User") user.name = result.name;
            if (user.password !== undefined) {
                var hash = crypto.createHash('md5');
                hash.update(user.password);
                user.password_md5 = hash.digest('hex');
                delete user.password;
            }
            return connection.runSql("INSERT INTO user SET ?, registration_time=UNIX_TIMESTAMP()", [user])
                .then(function(result) {
                    return [groups, result.insertId];
                });
        })
        .then(function(results) {
            var groups = results[0];
            var userId = results[1];
            var promises = [];
            promises.push(getUser(userId));
            for (var i = 0; i < groups.length; i++) {
                promises.push(
                    connection.runSql("insert into user_group_membership (user_id, group_id) VALUES (?, ?)", [userId, groups[i]])
                );
            }
            return Q.all(promises).then(function(insertResult) {
                // the first promise result is the result of getUser
                var newUser = insertResult[0];
                newUser.groups = groups;
                return newUser;
            });
        });
}

function getUser(userId) {
    return connection.runSql("SELECT * FROM user WHERE id = ?", [userId])
        .then(function(results) {
            if (results.length !== 1) {
                throw {
                    error: "Unexpected user length"
                };
            }
            return results[0];
        });
}