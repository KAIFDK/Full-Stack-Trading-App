import user from  '../../models/user.js';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, UnauthenticatedError  }  from '../../errors/index.js';
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