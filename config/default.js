'use strict';

module.exports = {
    express: {
        protocol: "https",
        host: "diy-platform-backend.herokuapp.com",
        port: 3494
    },
    db: {
        url: {
            dev: 'mysql://root@127.0.0.1:3306/diy_platform',
            uat: 'mysql://bb1a8cf4ff3627:603e2009@eu-cdbr-west-02.cleardb.net/heroku_22e036f0223b41a'
        },
        logging: console.log,
    },
    roles: {
        SUPER_ADMIN: 'super-admin',
        ADMIN: 'admin',
        STANDARD_USER: 'su',
    },
    jwt: {
        SECRET: 'shhhhh',
        //EXPIRATION_TIME: 7 * 24 * 60 * 60
        // EXPIRATION_TIME: 1000 * 60 * 15
        EXPIRATION_TIME: 900
    },
    email: {
        FROM: 'anne.develop@gmail.com',
        subjects: {
            'REGISTRATION': 'New Account Confirmation',
            'FORGOT_PASSWORD': 'Reset Your DIY Password'
        },
        bodies: {
            'REGISTRATION': "<span style='font-family=Verdana;color=black'><p>Congratulations!</p><p><span>You’ve successfully registered at DIY Philippines!</span></p><p><span>Your Login ID is: %s</span></p><p style='margin-bottom:0'><span><span>To activate your account click on the following link or copy-paste it in your browser:</span></span></p><p style='margin-top:0'><span><span>https://diy-platform-backend.herokuapp.com/api/v1/users/verify?token=%s</span></span></p><p></p><p></p><p style='margin-bottom:0'>Thank you!</p><p style='margin-top:0'>DIY Team</p></span>",
            'FORGOT_PASSWORD': "<span style='font-family:verdana;color: black'><p>Hi, <b>%s</b>!</p><p><span>We received a request to reset your DIY account password.</span></p><p style='margin-bottom:0'><span><span>Please change your password directly through this link: </span></span></p><p style='margin-top:0'><span><span>https://diy-platform-backend.herokuapp.com/api/v1/users/%s</span></span></p><p></p><p></p><p style='margin-bottom:0'>Thank you!</p><p style='margin-top:0'>DIY Team</p></span>"
        },
        footer: ""
    }
}