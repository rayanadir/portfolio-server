const nodemailer = require('nodemailer');

module.exports.sendEmail = async (email,username,subject,url) => {
    try{
        const transporter = nodemailer.createTransport({
            host:process.env.HOST,
            service:process.env.SERVICE,
            port:Number(process.env.EMAIL_PORT),
            secure: Boolean(process.env.SECURE),
            auth:{
                user:process.env.USER,
                pass:process.env.PASS
            },
            tls:{
                rejectUnauthorized:false,
            }
        })
        await transporter.sendMail({
            from:process.env.USER,
            to:email,
            subject,
            text:"test",
            html:
            `
            <div>
                <h1>Bonjour, Hello ${username} !</h1>
                <br>
                <h2>FR</h2>
                <p>Vous avez demandé à réinitialiser votre mot de passe, veuillez cliquer sur le lien ci-dessous. Si vous n'êtes pas à l'origine de cette action, ignorez ce mail.</p>
                <br>
                <h2>EN</h2>
                <p>You have requested to reset your password, please click on the link below. If you did not initiate this action, ignore this email.</p>

                <a href=${url}>${url}</a>
            </div>
            `,
        });
        console.log("email sent successfully");
    }catch(err){
        console.log("Email not sent");
        console.log(err)
    }
}