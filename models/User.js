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

    }
    catch(err){
        throw err;
    }
}


const User = mongoose.model("User",userSchema);
export default User;