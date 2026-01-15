import otp from 'otp-generator'; //otp generator module
import nodemailer from 'nodemailer'; //mail sending module
import fs from 'fs'; //file system module
import InlineCss from 'inline-css';  //inline css module
import { error } from 'console';

//export I can use this function in other files

//with async this function will return a promise

export const mailsender = async (email,otp,ot_type) => {
    let htmlcontent = fs.readFileSync('otp_template.html','utf-8'); //read html template file
    htmlcontent = htmlcontent.replace('TradingApp_otp',otp); //replace otp placeholder with actual otp
    htmlcontent = htmlcontent.replace('TradingApp_otp2',ot_type); //replace otp type placeholder with actual otp type

    const options = {
        url: ' ',
    }

    htmlcontent = await InlineCss(htmlcontent,options); //inline the css styles

    try{
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure:false,
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            },
    });

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: "OTP - Verfifcation for Trading App",
        html: htmlcontent,
    });
}
    catch{
        console.log("Error in sending mail");
        throw error;
    }
};


export const generateOTP = () => {
    const otpcode = otp.generate(6, {
         upperCaseAlphabets: false, 
         specialChars: false,
         lowerCaseAlphabets: false 
        });
    return otpcode;
}