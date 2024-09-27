import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloundinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation - not empty
    //check if user already exists : name , email
    //check for image , check for avatar
    //upload them cloudinary , avatar
    //create user object - create enty in db
    //remove password and refresh token from response
    //check for user creation
    //return response

    const {fullname,username,email, password}= req.body
        console.log("email:",email)
    
        if(
            [fullname,username,email,password].some((field)=>
            field?.trim()==="")
        ){
            throw new ApiError(400,'All field are required')
        }
        const existedUser = User.findOne({
            $or:[{username},{email}]
        })
        if(existedUser){
            throw new ApiError(409,"Username or email already exists")
        }

        const avatarLocalPath = req.files?.avatar[0]?.path; 
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

        if(!avatarLocalPath){
            throw new ApiError(400,'Avatar file is required ')
        }
        const avatar = await uploadOnCloundinary(avatarLocalPath);
        const coverImage = await uploadOnCloundinary(coverImageLocalPath);

        if(!avatar){
            throw new ApiError(400,'Avatar is required')
        }
      const user = await User.create({
            fullname,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            username:username.toLowerCase() 
        })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError('500','something went wrong while creating a user')
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Scuccessfully")
    )
})

export {registerUser}