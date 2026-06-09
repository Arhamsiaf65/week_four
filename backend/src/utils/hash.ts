import bcrypt, { hash }  from 'bcrypt';
import { AppError } from './apiError.js';


function hashPassword(password: string) : Promise<string> {
   try {
     const hashedPassword : Promise<string> = bcrypt.hash(password, 12);
    return hashedPassword; 
   } catch (error) {
    throw new AppError("failed to hash password", 500);
   }
}


function comparePassword(plainPassword : string, hashedPassword: string) : Promise<boolean>{
    try {
        return bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        throw new AppError("failed to validate pass", 500);
    }
}   

export  {hashPassword , comparePassword};