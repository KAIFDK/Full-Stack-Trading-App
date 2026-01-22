import user from  '../../models/user.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError, UnauthenticatedError  }  from '../../errors/index.js';
import jwt from 'jsonwebtoken';

const register = async (req,res) => {
    const {email, password, register_token} = req.body;

    if(!email || !password || !register_token){
        throw new BadRequestError('Please provide all values');
    }

    const user = await user.findOne({email});
    if(user){
        throw new BadRequestError('Email already in use');
    }

    try{
    const payLoad = jwt.verify(register_token, process.env.JWT_SECRET);

    if(payLoad.email !== email){
        throw new BadRequestError('Invalid register token');
    }

    const newUser = await user.create({email, password});

    const access_token = newUser.creatAccessToken();
    const refresh_token = newUser.createRefreshToken();
    res.status(StatusCodes.CREATED).json({user: {email: newUser.email , userId: newUser.id},tokens : {access_token, refresh_token}});

}
    catch (error) {
        console.error(error);
        throw new BadRequestError('Error during registration');
    }
}

const login = async (req,res) => {
    const {email, password} = req.body;
    if(!email || !password){
        throw new BadRequestError('Please provide all values');
    }

    const user = await user.findOne({email});
    if(!user){
        throw new BadRequestError('Invalid Credentials');
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if(!isPasswordCorrect){
        let message;

        if(user.blocked_until_password && user.blocked_until_password > Date.now()){
            const remainingTime = Math.ceil((user.blocked_until_password - Date.now()) / (60 * 1000));
            message = `Invalid Login Attempts. Try again after ${remaingTime} minutes`;
    }
    else{
        const attemptsRemaing = 3 - user.wrong_password_attempt;
        message = 
        attemptsRemaing > 0
        ? `Invalid Credentials. You have ${attemptsRemaing} more attempt(s) `
        : "Invalid login attempts. Try after 30 minutes";
    }
        throw new UnauthenticatedError(message);
}

const access_token = user.createAccessToken();
const refresh_token = user.createRefreshToken();

let phone_exsit = false;
let login_pin_exsit = false;
if(user.phone_number){
    phone_exsit = true;
}
if(user.login_pin){
    login_pin_exsit = true;
}

res.status(StatusCodes.OK).json({user: {name : user.name ,email: user.email , userId: user.id, phone_exsit, login_pin_exsit},tokens : {access_token, refresh_token}});
}

const refresh_token = async (req,res) => {

}

async function generateRefreshToken(
    token,
    refresh_secret,
    refresh_expiry,
    access_secret,
    access_expiry
){ try{
    const payLoad = jwt.verify(token, refresh_secret);
    const user = await User.findById(payLoad.userId);
    if(!user){
        throw new NotFoundError('User not found');
    }
    const access_token = jwt.sign(
        {userId:user.payLoad.userId},
        access_secret,
        {expiresIn:access_expiry}
    );
    const newRefresh_token = jwt.sign(
        {userId:user.payLoad.userId},
        refresh_secret,
        {expiresIn:refresh_expiry}
    );
    return {access_token, newRefresh_token};
}
catch(error){
    console.error(error);
    throw new UnauthenticatedError('Invalid refresh token');    
}

}
export {register, login};