import User from '../../models/User.js';
import OTP from '../../models/Otp.js';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import {BadRequestError} from '../../errors/index.js';
import {generateOTP} from '../../services/mailsender.js';

const verifyOtp = async (req, res) => {
    const {email,otp,otp_type,data} = req.body;
    if(!email || !otp || !otp_type){
        throw new BadRequestError('Please provide all values');
    }else if(otp_type !== "email" && !data){
        throw new BadRequestError('Please provide all values');
    }

    const otpRecord = await OTP.findOne({email,otp_type}).sort({createdAt: -1}).limit(1);

    if(!otpRecord){
        throw new BadRequestError('Invalid OTP');
    }

    const isVerified = await otpRecord.compareOTP(otp);

    if(!isVerified){
        throw new BadRequestError('Invalid OTP');
    }

    await OTP.findbyIdAndDelete(otpRecord._id);

    switch(otp_type){
        case "phone":
            await User.findOneAndUpdate({email},{phone_number: data});
            break;
        case "email":
        break;
        case "reset_pin":
        if(!data || data.length !== 4){
            throw new BadRequestError('Please provide a valid pin');
        }
        await User.updatePIN(email,data);
        break;
        case "reset_password":
        await User.updatePassword(email,data);
        break;
        default:
            throw new BadRequestError('Invalid OTP type');
    }

    const user = await User.findOne({email});

    if(otp_type === "email" && !user ){
        const register_token = jwt.sign({email},process.env.REGISTER_TOKEN_SECRET,{
            expiresIn: process.env.REGISTER_TOKEN_SECRET_EXPIRES_IN
    });
    return res
    .status(StatusCodes.OK)
    .json({msg: 'Email verified successfully',register_token});
    }

    res.status(StatusCodes.OK).json({msg: 'OTP verified successfully'});
}


