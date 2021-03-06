var express = require('express');
var router = express.Router();
var connect = require('../database/connect');
var nodemailer = require('nodemailer');
require('dotenv').config();

router.get('/', function(req, res, next) {

    var popularProducts = '';
    var recentProducts = '';

    connect(function(err, connection) {
        if (err) {
            console.log("Error connecting to the database");
            throw err;
        }
        else {
            console.log("Connected to the DB");

                connection.query('SELECT DISTINCT(d.productsId), d.stock, p.id, p.title, p.description, p.image1 FROM products p INNER JOIN product_details d ON p.id = d.productsId WHERE p.status = "active" ORDER BY d.stock',[],function(err, results, fields) {
                // console.log('Query returned ' + JSON.stringify(results));

                if(err) {
                    throw err;
                }
                // no products found
                else if (results.length === 0) {
                    console.log("No products found :(");
                }
                // products found
                else {
                    console.log("products found :)");
                    for (var i=0; i<results.length; i++) {
                        var excerptLength = 75;
                        var description = results[i].description;
                        var excerpt = "";

                        if (description.length > excerptLength) {
                            excerpt = description.substring(0,excerptLength).trim() + '...';
                        }
                        else {
                            excerpt = description;
                        }

                        results[i].excerpt = excerpt;
                    }

                    popularProducts = results.slice(0,4);
                }
            });

            connection.query('SELECT * FROM products WHERE status = "active" ORDER BY id DESC',[], function(err, results, fields) {
                // console.log('Query returned ' + JSON.stringify(results));

                if(err) {
                    throw err;
                }
                // no products found
                else if (results.length === 0) {
                    console.log("No products found :(");
                }
                // products found
                else {
                    console.log("Products found :)");

                    for (var i=0; i<results.length; i++) {
                        var excerptLength = 75;
                        var description = results[i].description;
                        var excerpt = "";

                        if (description.length > excerptLength) {
                            excerpt = description.substring(0,excerptLength).trim() + '...';
                        }
                        else {
                            excerpt = description;
                        }

                        results[i].excerpt = excerpt;
                    }

                    recentProducts = results.slice(0,4);
                }
            });
        }

        connection.commit(function(err) {
          connection.release();
          if (err) {
            connection.rollback(function() {
              throw err;
            });
          }
          else {
            res.render('index', {
                access: req.session.user,
                owner: req.session.admin,
                userId: req.session.userId,
                avatar: req.session.avatar,
                popularProducts: popularProducts,
                recentProducts: recentProducts
            });
          }
        });
    });
});


router.get('/about', function(req, res, next) {
    res.render('about', {
        access: req.session.user,
        owner: req.session.admin,
        userId: req.session.userId,
        avatar: req.session.avatar
    });
});


router.get('/confirmation', function(req, res, next) {

    var contact = req.session.contact ? req.session.contact : "";
    var ticketId = req.session.ticketId ? req.session.ticketId : "";

    req.session.contact = "";
    req.session.ticketId = "";

    if (contact) {

        res.render('confirmation', {
            contact: contact,
            ticketId: ticketId
        });

    } else {

        res.redirect('error');

    }

});


router.get('/products', function(req, res, next) {

    var products = '';

    connect(function(err, connection) {
        if (err) {
            console.log("Error connecting to the database");
            throw err;
        }
        else {
            console.log("Connected to the DB");
            connection.query('SELECT * FROM products where status = "active" ORDER BY id DESC',[], function(err, results, fields) {
                // console.log('Query returned ' + JSON.stringify(results));

                if(err) {
                  throw err;
                }
                // no products found
                else if (results.length === 0) {
                  console.log("no products found :(");
                }
                // products found
                else {
                    console.log("products found :)");

                    for (var i=0; i<results.length; i++) {
                        var excerptLength = 75;
                        var description = results[i].description;
                        var excerpt = "";

                        if (description.length > excerptLength) {
                          excerpt = description.substring(0,excerptLength).trim() + '...';
                        }
                        else {
                          excerpt = description;
                        }

                        results[i].excerpt = excerpt;
                    }

                    products = results;
                }
            });
        }

        connection.commit(function(err) {
            connection.release();
            if (err) {
                connection.rollback(function() {
                    throw err;
                });
            }
            else {
                res.render('products', {
                    access: req.session.user,
                    owner: req.session.admin,
                    userId: req.session.userId,
                    avatar: req.session.avatar,
                    products: products
                });
            }
        });
    });
});


router.get('/product/:id/:title', function(req, res, next) {

    var msg = req.session.msg ? req.session.msg : "";
    var successMsg = req.session.successMsg ? req.session.successMsg : "";
    var product = '';
    var details = '';
    var colors = true;
    var sizes = true;
    var popularProducts = '';
    var productId = req.session.productId = req.params.id;
    var title = req.session.title = req.params.title;

    if (req.params.id) {

        connect(function(err, connection) {
            if (err) {
                console.log("Error connecting to the database");
                throw err;
            }
            else {
                console.log("Connected to the DB");

                connection.query('SELECT * FROM products WHERE id=? ',[req.params.id],function(err, results, fields) {
                    // console.log('Query returned ' + JSON.stringify(results));

                    if(err) {
                        throw err;
                    }
                    // no products found
                    else if (results.length === 0) {
                        console.log("Product not found");
                    }
                    // products found
                    else {
                        console.log(results[0].title + " product found");

                        product = results;
                    }
                });
            }


            connection.query('SELECT * FROM product_details WHERE productsId=? AND status="active" ORDER BY price',[req.params.id],function(err, results, fields) {
                // console.log('Query returned ' + JSON.stringify(results));

                if(err) {
                    throw err;
                }
                // no products found
                else if (results.length === 0) {
                    console.log("Details not found");
                }
                // products found
                else {
                    console.log("Details product found");
                    details = results;
                    // console.log(results);

                    for (var i=0; i<results.length; i++) {
                        results[i].price = results[i].price.toFixed(2);
                    }

                    if ((results[0].color === null) || (results[0].color === "")) {
                        colors = false;
                    }
                    if ((results[0].size === null) || (results[0].size === "")) {
                        sizes = false;
                    }

                }
            });

            connection.query('SELECT DISTINCT d.productsId, d.stock, p.id, p.title, p.description, p.image1 FROM products p INNER JOIN product_details d ON p.id = d.productsId WHERE p.status = "active" ORDER BY d.stock',[],function(err, results, fields) {
                console.log('Query returned ' + JSON.stringify(results));

                if(err) {
                    throw err;
                }
                // no products found
                else if (results.length === 0) {
                    console.log("no products found :(");
                }
                // products found
                else {
                    console.log("products found :)");
                    for (var i=0; i<results.length; i++) {
                        var excerptLength = 75;
                        var description = results[i].description;
                        var excerpt = "";

                        if (description.length > excerptLength) {
                            excerpt = description.substring(0,excerptLength).trim() + '...';
                        }
                        else {
                            excerpt = description;
                        }

                        results[i].excerpt = excerpt;
                    }

                    popularProducts = results.slice(0,4);
                }
            });

            connection.commit(function(err) {
              connection.release();
              if (err) {
                connection.rollback(function() {
                    throw err;
                });
              }
                else {
                    res.render('product', {
                        errorMessage: msg,
                        successMessage: successMsg,
                        access: req.session.user,
                        owner: req.session.admin,
                        userId: req.session.userId,
                        avatar: req.session.avatar,
                        product: product,
                        details: details,
                        colors: colors,
                        sizes: sizes,
                        productId: req.session.productId,
                        title: req.session.title,
                        popularProducts: popularProducts
                    });
                }
            });
        });
    }
});


router.get('/contact', function(req, res, next) {

    res.render('contact', {
        access: req.session.user,
        owner: req.session.admin,
        userId: req.session.userId,
        avatar: req.session.avatar
    });
});


router.post('/contact', function(req, res, next) {

    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var email = req.body.email;
    var phoneNumber = req.body.phoneNumber;
    var message = req.body.message;
    var status = 'active';

    var themeSettings = req.session.themeSettings;

    req.session.contact = true;

    connect(function(err, connection) {
        if (err) {
            console.log("Error connecting to the database");
            throw err;
        }
        else {
            console.log("Connected to the DB - insert");

            connection.query('INSERT INTO tickets (firstName, lastName, email, phoneNumber, message, status) VALUES (?,?,?,?,?,?)',[firstName, lastName, email, phoneNumber, message, status], function(err, results, fields) {
                // connection.release();

                if (err) {
                    console.log("Error connecting to the database - tickets");
                    throw err;
                }
                else {
                    connection.query('SELECT id FROM tickets ORDER BY id DESC',[], function(err, results, fields) {
                        connection.release();

                        if (err) {
                        console.log("Error connecting to the database - tickets2");
                        throw err;
                        }
                        else {

                            req.session.ticketId = results[0].id;

                            // create reusable transporter object using the default SMTP transport
                            let transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: process.env.APPSETTING_GMAIL_EMAIL,
                                    pass: process.env.APPSETTING_GMAIL_PASSWORD
                                }
                            });

                            // setup email data with unicode symbols
                            let mailOptions = {
                                from: '"' + themeSettings.companyName + '" <' + themeSettings.contactEmail + '>', // sender address
                                to: '"' + firstName + ' ' + lastName + '" <' + email + '>', // list of receivers
                                bcc: '"' + themeSettings.companyName + '" <' + themeSettings.contactEmail + '>', // bcc jamjarink
                                subject: 'Your ticket for ' + themeSettings.companyName + ' [Ticket ID: ' + req.session.ticketId + '] was received.', // Subject line
                                text: 'Dear ' + firstName + ' ' + lastName + ', Thank you for contacting us, we have received the following message. ' + message + ' We will be in touch with you shortly. If you require anything further please make sure to respond to this email. Thank you, ' + themeSettings.contactName, // plain text body
                                html: '<p> Dear ' + firstName + ' ' + lastName + ',</p>' +
                                '<p>Thank you for contacting us, we have received the following message.</p>' +
                                '<p>' + message + '</p>' +
                                '<p>We will be in touch with you shortly. If you require anything further please make sure to respond to this email.</p>' +
                                '<p>Thank you, ' + themeSettings.contactName + '</p>'
                            };

                            // send mail with defined transport object
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    return console.log(error);
                                }
                                console.log('Message %s sent: %s', info.messageId, info.response);
                            });

                            res.redirect('confirmation');
                        }
                    });
                }
            });
        }

    });
});


router.post('/search', function(req, res, next) {

    var search = req.body.search;
    console.log(search);

    connect(function(err, connection) {
        if (err) {
            console.log("Error connecting to the database");
            throw err;
        }
        else {
            console.log("Connected to the DB");

            connection.query('SELECT * FROM products WHERE title LIKE "%' + search + '%" ORDER BY title',[], function(err, results, fields) {
                connection.release();
                console.log(results);

                for (var i=0; i<results.length; i++) {
                    var excerptLength = 75;
                    var description = results[i].description;
                    var excerpt = "";

                    if (description.length > excerptLength) {
                        excerpt = description.substring(0,excerptLength).trim() + '...';
                    }
                    else {
                        excerpt = description;
                    }

                    results[i].excerpt = excerpt;
                }

                req.session.searchResults = results;

                if(err) {
                    throw err;
                } else {
                    res.redirect('/search-results');
                }
            });
        }
    });
});


router.get('/search-results', function(req, res, next) {
    var searchResults = req.session.searchResults;

    res.render('search', {
        searchResults: searchResults
    });

});


router.get('/sign-out', function(req, res, next) {
    req.session.destroy();
    res.redirect('/');
});


router.get('/sign-in', function(req, res, next) {

    if (!req.session.user) {

        var msg = req.session.msg ? req.session.msg : "";
        var successMsg = req.session.successMsg ? req.session.successMsg : "";
        var email = req.session.email ? req.session.email : "";
        var user = req.session.user ? req.session.user : "";
        var firstname = req.session.firstname ? req.session.firstname : "";
        var lastname = req.session.lastname ? req.session.lastname : "";

        req.session.msg = "";
        req.session.successMsg = "";
        req.session.user = "";
        req.session.firstname = "";
        req.session.lastname = "";

        res.render('access', {
            errorMessage: msg,
            successMessage: successMsg,
            signIn: true,
            email: email,
            user: user,
            firstName: firstname,
            lastName: lastname
        });
    }
    else {
        res.redirect('/');
    }
});


// sign-in user
router.post('/sign-in', function(req, res, next) {
    // console.log("sign-in");

    // var msg = req.session.msg ? req.session.msg : "";
    // var successMsg = req.session.successMsg ? req.session.successMsg : "";
    //
    // req.session.msg = "";
    // req.session.successMsg = "";

    var msg = "";
    var successMsg = "";

    var email = req.body.email;
    var password = req.body.password;

  connect(function(err, connection) {
    if (err) {
      console.log("Error connecting to the database");
      throw err;
    }
    else {
      console.log("Connected to the DB");

      connection.query('SELECT * FROM users WHERE email=?',[email], function(err, results, fields) {
        connection.release();
        // console.log('Query returned ' + JSON.stringify(results));

        if(err) {
          throw err;
        }
        // fail login - email not entered
        else if (email.trim().length === 0) {
          console.log("No email entered.");
          req.session.msg = "Please enter email.";
          res.redirect('/sign-in');
        }
        // fail login - email not found
        else if (results.length === 0)  {
          console.log("Email not found.");
          req.session.msg = email + " does not exist. Please register.";
          res.redirect('/sign-in');
        }
        // fail login - password not entered
        else if (password.trim().length === 0) {
          console.log("No password entered.");
          req.session.msg = "Please enter password.";
          res.redirect('/sign-in');
        }
        // fail login - password does not match
        else if (password !== results[0].password) {
          console.log("Incorrect password.");
          req.session.msg = "Password incorrect.";
          res.redirect('/sign-in');
        }
        // successful login - id and password match
        // else if ((results.length !== 0) && (password === results[0].password)) {
        else {
            console.log("Login successful!" + email);

            req.session.user = email;

            if (results[0].userType === 'admin') {
                req.session.admin = 'admin';
            }

            res.redirect('/user-session');
        }
      });
    }
  });
});


// send password
router.post('/send-password', function(req, res, next) {
    console.log('** send-password');
    var msg = "";
    var successMsg = "";
    var email = req.body.email;

    var themeSettings = req.session.themeSettings;

    connect(function(err, connection) {
        if (err) {
            console.log("Error connecting to the database");
            throw err;
        }
        else {
            console.log("Connected to the DB");

            connection.query('SELECT * FROM users WHERE email=?',[email], function(err, results, fields) {
            connection.release();
            // console.log('Query returned ' + JSON.stringify(results));

            if(err) {
              throw err;
            }
            // fail - email does not exist
            else if (results.length === 0) {
                console.log("Email not found.");
                req.session.msg = "Email is not registered with Jam Jar. Please reigster.";
                res.redirect('/sign-in');
            }
            // success - email found
            else  {
                    console.log("Email found.");

                    // create reusable transporter object using the default SMTP transport
                    let transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.APPSETTING_GMAIL_EMAIL,
                            pass: process.env.APPSETTING_GMAIL_PASSWORD
                        }
                    });

                    // setup email data with unicode symbols
                    let mailOptions = {
                        from: '"' + themeSettings.companyName + '" <' + themeSettings.contactEmail + '>', // sender address
                        to: '"' + results[0].firstName + ' ' + results[0].lastName + '" <' + results[0].email + '>', // list of receivers
                        subject: 'Password request for ' + themeSettings.companyName + ' account', // Subject line
                        text: 'Dear ' + results[0].firstName + ' ' + results[0].lastName + ', Please find your account password listed below. Password: ' + results[0].password + ' If you require anything further please make sure to respond to this email. Thank you, ' + themeSettings.contactName, // plain text body
                        html: '<p> Dear ' + results[0].firstName + ' ' + results[0].lastName + ',</p>' +
                        '<p>Please find your account password listed below.</p>' +
                        '<p>Password: ' + results[0].password + '.</p>' +
                        '<p>If you require anything further please make sure to respond to this email.</p>' +
                        '<p>Thank you, ' + themeSettings.contactName + '</p>'
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            return console.log(error);
                        }
                        console.log('Message %s sent: %s', info.messageId, info.response);
                    });

                    req.session.successMsg = "Please check your inbox for your password.";
                    res.redirect('/sign-in');
                }
            });
        }
    });
});


// register user
router.post('/register', function(req, res, next) {

  // console.log("register");

  var email = req.body.email;
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var password1 = req.body.password1;
  var password2 = req.body.password2;

  connect(function(err, connection) {
    if (err) {
      console.log("Error connecting to the database - query");
      throw err;
    }
    else {
      console.log("Connected to the DB - query");

      connection.query('SELECT * FROM users WHERE email=?',[email], function(err, results, fields) {
        connection.release();
        // console.log('Query returned ' + JSON.stringify(results));

        if(err) {
          throw err;
        }
        // error - email exists
        else if (results.length !== 0) {
          console.log("Email already exists.");

          req.session.msg = email + " already in use.";
          req.session.email = '';
          req.session.firstname = firstName;
          req.session.lastname = lastName;
          res.redirect('/sign-in');
        }
        else if (results.length === 0) {
          // error - email not entered
          if (email.trim().length === 0) {
            console.log("Email field empty.");
            req.session.msg = "Please enter email.";
            req.session.firstname = firstName;
            req.session.lastname = lastName;
            res.redirect('/sign-in');
          }
          // error - firstName not entered
          else if (firstName.trim().length === 0) {
            console.log("firstName field empty.");
            req.session.msg = "Please enter firstname.";
            req.session.email = email;
            req.session.lastname = lastName;
            res.redirect('/sign-in');
          }
          // error - lastName not entered
          else if (lastName.trim().length === 0) {
            console.log("lastName field empty.");
            req.session.msg = "Please enter lastname.";
            req.session.email = email;
            req.session.firstname = firstName;
            res.redirect('/sign-in');
          }
          // error - password not entered
          else if (password1.trim().length === 0) {
            console.log("Password field empty.");
            req.session.msg = "Please enter password.";
            req.session.email = email;
            req.session.firstname = firstName;
            req.session.lastname = lastName;
            res.redirect('/sign-in');
          }
          // error - confirm password not entered
          else if (password2.trim().length === 0) {
            console.log("Re-enter password field empty.");
            req.session.msg = "Please re-enter password.";
            req.session.email = email;
            req.session.firstname = firstName;
            req.session.lastname = lastName;
            res.redirect('/sign-in');
          }
          // error - password and confirm password do not match
          else if (password1.trim() !== password2.trim()) {
            console.log("Confirm field empty.");
            req.session.msg = "Password fields do not match. Please try again.";
            req.session.email = email;
            req.session.firstname = firstName;
            req.session.lastname = lastName;
            res.redirect('/sign-in');
          }
          else {

            connect(function(err, connection) {
              if (err) {
                console.log("Error connecting to the database");
                throw err;
              }
              else {
                console.log("Connected to the DB - insert");

                connection.query('INSERT INTO users (firstName, lastName, email, password, userType) VALUES (?,?,?,?,?)',[firstName, lastName, email, password1, 'customer'], function(err, results, fields) {
                  connection.release();

                  if (err) {
                    console.log("Error connecting to the database - insert");
                    throw err;
                  }
                  else {
                    console.log("Register and login successful. " + email);
                    req.session.user = email;
                    res.redirect('/user-session');
                  }
                });
              }
            });
          }
        }
      });
    }
  });
});

router.get('/user-session', function(req, res, next) {
    connect(function(err, connection) {
        if (err) {
            console.log("Error connecting to the database");
            throw err;
        }
        else {
            console.log("Connected to the DB");

            connection.query('SELECT * FROM users WHERE email=?',[req.session.user],function(err, results, fields) {
                console.log('Query returned ' + JSON.stringify(results));

                if(err) {
                    throw err;
                }
                // no user found
                else if (results.length === 0) {
                    console.log("User not found");
                }
                // user found
                else {
                    console.log("User found");
                    console.log(results[0].firstName);

                    req.session.userId = results[0].id;
                    req.session.firstName = results[0].firstName;
                    req.session.lastName = results[0].lastName;
                    req.session.address1 = results[0].address1;
                    req.session.address2 = results[0].address2;
                    req.session.city = results[0].city;
                    req.session.province = results[0].province;
                    req.session.postalcode = results[0].postalcode;
                    req.session.country = results[0].country;
                    req.session.user = results[0].email;
                    req.session.phoneNumber = results[0].phoneNumber;
                    req.session.avatar = results[0].avatar;

                }
            });
            connection.commit(function(err) {
                connection.release();
                if (err) {
                    connection.rollback(function() {
                        throw err;
                    });
                }
                else {
                    res.redirect('/');

                }
            });

        }
    });
});

module.exports = router;
