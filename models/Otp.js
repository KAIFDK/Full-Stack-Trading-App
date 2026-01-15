import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {mailSender} from "../utils/mailsender.js";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp:{
        type: String,
        required: true,
    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires:300 // 5 minutes
    },
    otpType:{
        type:String,
        enum:['EMAIL_VERIFICATION','PASSWORD_RESET'],
        required:true
    }
});


otpSchema.pre("save", async function(next){  // hash otp before saving to db
    if(this.isNew){
        const salt = await bcrypt.genSalt(10);
        await sendVeri(this.email,this.otp);
        this.otp = await bcrypt.hash(this.otp,salt);
    }
    next();
});

otpSchema.methods.compareOtp = async function(enteredOtp){  // compare entered otp with hashed otp in db
    return await bcrypt.compare(enteredOtp,this.otp);
};

async function sendVeri(email,otp,otp_type){
    try{
        const mailResponse = await mailSender(email,otp,otp_type);
    }
    catch(error){
        console.log(error);
        throw error;

    }
}