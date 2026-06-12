import * as authService from "./auth.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/v1/auth",
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.id);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const result = await authService.refreshUserToken(token);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});
