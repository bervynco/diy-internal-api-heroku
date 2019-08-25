const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");


// var transporter = nodemailer.createTransport({
//     service: 'gmail',
//  auth: {
//         user: 'anne.develop@gmail.com',
//         pass: 'd3V3l0p3r'
//     }
//   });

// var transporter = nodemailer.createTransport({
//     host: 'smtp.gmail.com',
//     port: 465,
//     secure: true,
//     auth: {
//         type: 'OAuth2',
//         user: 'anne.develop@gmail.com',
//         accessToken: 'ya29.GltFB6ODBso6NeCPsoYw6Un2AEVAM7BjFaypZ9B36OhOlShBExbTfCVfQieRVSY9BNRK9RrZC31ZaKVb2QDBUNneK41oe5WsPLppGAWQ8qZPYyQZDc6a1YkriwcC'
//     }
// });

var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: 'anne.develop@gmail.com',
        clientId: '653983998335-g9dfp80e4sut49ukhbpm7ifbhiiiklj7.apps.googleusercontent.com',
        clientSecret: '5lR0T8EJbDZ0-8p0YURXx55C',
        refreshToken: '1/lrnfNJa68w0gSw1YYr_8ZAK806A6hyXDKPdmNPpSrDAEea3dbDEncgIIe7IXLT1c',
        accessToken: 'ya29.GltFB6ODBso6NeCPsoYw6Un2AEVAM7BjFaypZ9B36OhOlShBExbTfCVfQieRVSY9BNRK9RrZC31ZaKVb2QDBUNneK41oe5WsPLppGAWQ8qZPYyQZDc6a1YkriwcC',
        expires: 3600
    }
});
/**
 * Hash the plain text using the specified number of rounds
 *
 * @param {String}    text          the text to hash
 * @param {Integer}   rounds        the number of rounds
 */
function* hashString(text, rounds) {
    return yield bcrypt.hash(text, rounds, null);
}
function* compare(hashed, to) {
    return yield bcrypt.compare(hashed, to);
}

const email = function*(from, to, subject, body, attachment) {
    // var data = {
    //   Source: from,
    //   Destination: { ToAddresses: [to] },
    //   Message: {
    //     Subject: {
    //       Data: subject
    //     },
    //     Body: {
    //       Html: {
    //         Data: body,
    //         Charset: "UTF-8"
    //       }
    //     }
    //   }
    // };
    
  
    
    const mailOptions = {
            from: from,
            to: to,
            subject: subject,
            html: body
        };
    if (attachment) {
        mailOptions.attachments = [attachment];
    }
    transporter.sendMail(mailOptions, function(err, info) {
      if (err) {
          console.log("ERR", err)
          throw err;
      }
      console.log('Email sent: ' + info.response);
    });
};
  

module.exports = {
    hashString,
    compare,
    email
  };
