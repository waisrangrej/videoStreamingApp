import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User} from '../models/user.models.js'
import { uploadonCloudnary } from "../utils/cloudnary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser=asyncHandler( async (req,res)=>{
// get user details from frontend
// validation-not empty
// check if user already exists: username , email
// check for images, check for avtar
// upload them to cloudnary, avatar
// create user object- create entry in db
// remove password and refresh token field from response
// check user creation
// return res

const {username,email,fullName,password}=req.body
console.log("email:",email);

if(
    [fullName,email,fullName,password].some((field)=> field?.trim() === "")
){
    throw new apiError(400,"all field are required")
}

const existedUser=User.findOne({
    $or:[{ username },{ email }]
})

if(existedUser) throw new apiError (409, "user with email or username is already exist")

const avatarLocalPath= req.files?.avatar[0]?.path;
const coverImageLocalPath=req.files?.coverImage[0?.path];

if(!avatar) throw new apiError(400,"avatar is required")

const avatar=await uploadonCloudnary(avatarLocalPath)
const coverImage=await uploadonCloudnary(coverImageLocalPath)

if(!avatar) throw new apiError(400,"avatar file is required");

 const user=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.tolowercase()
})

const createdUser = await User.findById(User._id).select(
    "-password -refreshToken"
)

if(!createdUser) throw new apiError(500, "something went wrong while registering the user")

return res.status(201).json(
    new apiResponse(200,createdUser,"user registered successfully")
)

})


export {registerUser}