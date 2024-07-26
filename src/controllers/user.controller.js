import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from '../models/user.models.js';
import { uploadonCloudnary } from "../utils/cloudnary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken'

const registerUser = asyncHandler(async (req, res, next) => {
  try {
    // Get user details from frontend
    const { username, email, fullName, password } = req.body;
    console.log("Received user details:", { email, fullName });

    // Validate input
    if ([username, email, fullName, password].some((field) => !field?.trim())) {
      throw new apiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (existedUser) {
      throw new apiError(409, "User with email or username already exists");
    }

    // console.log("Files received:", req.files);

    // Check for avatar and cover image
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
      throw new apiError(400, "Avatar file is required");
    }

    // Upload images to Cloudinary
    const avatar = await uploadonCloudnary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadonCloudnary(coverImageLocalPath) : null;

    if (!avatar) {
      throw new apiError(400, "Avatar upload failed");
    }

    // Create user object and save to database
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
    });

    // Remove sensitive fields from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
      throw new apiError(500, "Something went wrong while registering the user");
    }

    // Send successful response
    return res.status(201).json(new apiResponse(200, createdUser, "User registered successfully"));

  } catch (error) {
    console.error("Error during user registration:", error.message);
    next(error); // Pass the error to the error handling middleware
  }
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new apiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefereshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Something went wrong while generating refresh and access token");
  }
}

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new apiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new apiError(400, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedinUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  };

  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new apiResponse(200, {
      user: loggedinUser, accessToken, refreshToken
    }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out"));
});

//refresh token access code start from here

const refreshAccessToken=asyncHandler(async(req,res)=>{
  const inComingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

  if(inComingRefreshToken){
    throw new apiError(401,"unauthorized request")
  }

try {
  const decodedToken=jwt.verify(
    inComingRefreshToken,
    process.env.REFERESH_TOKEN_SECRET
  )
  
  const user= await User.findById(decodedToken?._id)
  
  if (!user) {
    throw new apiError(401,"Invalid refresh token")
  }
  
  if(inComingRefreshToken !== User?.refreshToken ){
    throw new apiError(401,"refresh token is expired or user")
  }
  
  const options={
    httpOnly:true,
    secure:true
  }
  
  const {accessToken,newrefreshToken}=await generateAccessAndRefreshToken(user._id)
  
  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",newrefreshToken,options)
  .json(
    new apiResponse(200,{accessToken,refreshToken:newrefreshToken},
      "Access Token refreshed successfully"
    )
  )
} catch (error) {
  throw new apiError(401,error?.message || "invalid refresh token")
}


})

export { registerUser, loginUser, logoutUser,refreshAccessToken };
