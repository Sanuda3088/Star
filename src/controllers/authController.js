import {
  loginValidation,
  registerValidation,
} from "../validations/authValidation.js";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/responseUtil.js";
import {
  comparePassword, compareRefreshToken,
  hashPassword,
  hashRefreshToken,
} from "../utils/authUtils.js";
import {
  generateAccessToken,
  generateRefreshToken, verifyRefreshToken,
} from "../utils/tokenUtils.js";
import UserModel from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();
//register user
export const register = async (req, res) => {
  try {
    const validationErrors = registerValidation(req.body);

    if (Object.keys(validationErrors).length > 0)
      return sendErrorResponse(res, 400, "Validation failed", validationErrors);

    if (await UserModel.findOne({ email: req.body.email }))
      return sendErrorResponse(res, 409, "User already exists");

    const hashedPassword = await hashPassword(req.body.password);

    await UserModel.create({
      userName: req.body.userName,
      email: req.body.email,
      password: hashedPassword,
    });

    return sendSuccessResponse(res, 201, "User created successfully");
  } catch (err) {
    return sendErrorResponse(res, 500, "Internal server error", err);
  }
};

//user login API
export const login = async (req, res) => {
  try {
    const validationErrors = loginValidation(req.body);

    if (Object.keys(validationErrors).length > 0)
      return sendErrorResponse(res, 400, "validation error", validationErrors);
    const user = await UserModel.findOne({
      email: req.body.email,
    });

    if (!user) {
      return sendErrorResponse(res, 404, "User does not exist");
    }
    const isMatch = await comparePassword(req.body.password, user.password);
    if (!isMatch) {
      return sendErrorResponse(res, 400, "Invalid credentials");
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const hashedRefreshToken = await hashRefreshToken(refreshToken);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return sendSuccessResponse(res, 200, "Login successful", {
      accessToken,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Internal server error", err);
  }
};

//logout API
export const logout = async (req, res) => {
  try {
    const { userId } = req.user; // Assuming you have userId in req.user

    const user = await UserModel.findById(userId);
    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    // Add the access token to the blacklist
    const token = req.headers.authorization?.split(" ")[1];

    user.refreshToken = null;
    await user.save();
    res.clearCookie("refreshToken");
    return sendSuccessResponse(res, 200, "Logout successful");
  } catch (err) {
    return sendErrorResponse(res, 500, "Internal server error ", err);
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return sendErrorResponse(res, 401, "No refresh token provided");
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.refreshToken) {
      return sendErrorResponse(res, 403, "Refresh token invalid or user not found");
    }

    const isMatch = await compareRefreshToken(refreshToken, user.refreshToken);
    if (!isMatch) {
      return sendErrorResponse(res, 403, "Refresh token does not match");
    }

    const newAccessToken = generateAccessToken(user._id);
    return sendSuccessResponse(res, 200, "New access token issued", {
      accessToken: newAccessToken,
    });
  } catch (err) {
    return sendErrorResponse(res, 401, "Invalid or expired refresh token", err);
  }
};

//User API
export const user = async (req, res) => {
  try {
    const { userId } = req.user; // Assuming you have userId in req.user

    const user = await UserModel.findById(userId);
    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const response = {
      id: user._id,
      userName: user.userName,
      email: user.email,
      appointments: user.appointments,
    };

    return sendSuccessResponse(
      res,
      200,
      "User details retrieved successfully",
      response
    );
  } catch (err) {
    return sendErrorResponse(res, 500, "Internal server error ", err);
  }
};