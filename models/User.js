import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "google-auth-library";

import { CustomAPIError, BadRequestError, NotFoundError, UnauthenticatedError  } from "../errors/index.js";

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        match : [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address"
        ]
    },
    password:{
        type:String,
    },
    name:{
        type:String,
        maxLength:50,
        minLength:3
    },
    login_pin:{
        type:String,
        minLength:4,
        maxLength:4
    },
    phonenumber:{
        type:String,
        match : [
            /^[0-9]{10}$/,
            "Please fill a valid phone number"
        ],
        unique:true,
        required:true
    },
    date_of_birth:  Date,
    biometricKey: String,
    gender:{
        type:String,
        enum:['Male','Female','Other']
    },
    worngpin:{
        type:Number,
        default:0
    },
    blocked_until_pin:{
        type:Date,
        default:null
    },
    balance:{
        type:Number,
        default:50000
    }


},
{timestamps:true}
);


userSchema.pre("save", async function(){
    if(!this.isModified("password")){
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password,salt);
    }
})


userSchema.pre("save", async function(){
    if(!this.isModified("login_pin")){
        const salt = await bcrypt.genSalt(10);
        this.login_pin = await bcrypt.hash(this.login_pin,salt);

    }
})

userSchema.static.updatePin = async function(email,newPin){
    try{

        const user = await this.findOne({email});

        if(!user){
            throw new NotFoundError("User not found");
        }

        const isSamePin = await bcrypt.compare(newPin,user.login_pin);
        if(isSamePin){
            throw new BadRequestError("New PIN cannot be same as old PIN");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(newPin,salt);

        await this.findOneAndUpdate({email},{login_pin : hashedPin, wrongpin:0, blocked_until_pin:null});

        return {success:true,message:"PIN updated successfully"};
    }
    catch(err){
        throw err;
    }
}

userSchema.static.updatePassword = async function(email,newPassword){
    try{
        const user = await this.findOne({email});

        if(!user){
            throw new NotFoundError("User not found");
        }

        const isSamePassword = await bcrypt.compare(newPassword,user.password);
        if(isSamePassword){
            throw new BadRequestError("New password cannot be same as old password");
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword,salt);

        await this.findOneAndUpdate({email},{password : hashedPassword, wrongpin:0, blocked_until_password:null});
    }
    catch(err){
        throw err;
    }
};

userSchema.methods.comparePassword = async function(candidatePassword){
    if(this.blocked_until_password  && this.blocked_until_password > Date.now()){
        throw new UnauthenticatedError(`Invalid Login Attempts. Try again after 30minutes`);
    }
    const isMatch = await bcrypt.compare(candidatePassword,this.password);
    if(!isMatch){
        this.wrong_password_attempt +=1;
        if(this.wrong_password_attempt >=3){
            this.blocked_until_password = new Date(Date.now() + 30*60*1000); //block for 30 minutes
            this.wrong_password_attempt =0;
    }
    await this.save();
}
else{
    this.wrong_password_attempt =0;
    this.blocked_until_password = null;
    await this.save();
}
return isMatch;
}

userSchema.methods.comparePin = async function comparePin(candidatePin){
    if(this.blocked_until_pin  && this.blocked_until_pin > Date.now()){
        throw new UnauthenticatedError(`Invalid PIN Attempts. Try again after 30 minutes`);
    }

    const hashedPin = this.login_pin;
    const isMatch = await bcrypt.compare(candidatePin,hashedPin);
    if(!isMatch){
        this.wrong_pin_attempt +=1;
        if(this.wrong_pin_attempt >=3){
            this.blocked_until_pin = new Date(Date.now() + 30*60*1000); //block for 30 minutes
            this.wrong_pin_attempt =0;
        }
        await this.save();
    }
    else{
        this.wrong_pin_attempt =0;
        this.blocked_until_pin = null;
        await this.save();
    }
    return isMatch;
}

userSchema.methods.createAccessToken = function(){
    return jwt.sign(
        {userId:this._id,email:this.email},
        process.env.JWT_SECRET,
        {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.createRefreshToken = function(){
    return jwt.sign(
        {userId:this._id,email:this.email},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
    )
}





const User = mongoose.model("User",userSchema);
export default User;