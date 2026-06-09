import { createUser, getUserByEmail, storeRefreshToken } from "../../db/queryFunctions.js"
import { AppError } from "../../utils/apiError.js";
import {hashPassword, comparePassword} from "../../utils/hash.js";
import {generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken} from "../../utils/jwt.js"

const registerUserService=async (
    name: string,
    email: string,
    password: string,
    role: string
) => {

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
        throw new AppError("User already exists", 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await createUser(
        name,
        email,
        hashedPassword,
        role
    );

    const accessToken = generateAccessToken(user.id, user.role);

    const refreshToken = generateRefreshToken();

    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    await storeRefreshToken(user.id, refreshToken, expires_at);

    return {
        accessToken,
        refreshToken
    };
};


const loginUserService = async (
    email: string,
    password: string
) => {

    const user = await getUserByEmail(email);

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await comparePassword(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }

    const accessToken = generateAccessToken(user.id, user.role);

    const refreshToken = generateRefreshToken();

    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    await storeRefreshToken(user.id, refreshToken, expires_at);

    return {
        accessToken,
        refreshToken
    };
};


export {registerUserService,loginUserService};



