import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloundinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';

// Method for tokens
const generateAccessAndRefreshTokens = async(userId)=>{
        try {
           const user =  await User.findById(userId)
           const accessToken = user.generateAccessToken();
           const refreshToken = user.generateRefreshToken();

           user.refreshToken = refreshToken;
           await user.save({validationBeforeSave:false}); 

           return {accessToken , refreshToken};

        } catch (error) {
            throw new ApiError(500,'something went wrong')
        }
}

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
        const existedUser = await User.findOne({
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
        new ApiResponse(201,createdUser,"User Registered Scuccessfully")
    );
});
    // Login
    const loginUser = asyncHandler(async(req,res)=>{
        const{email,username,password} = req.body;

        console.log(email); 

        if(!email && !username){
            throw new ApiError(400,'username or password required')
        }
        const user = await User.findOne({
            $or:[{username},{email}]
        })
        if(!user){
            throw new ApiError(404,'user does not exist');
        }
        const isPasswordValid = await user.isPasswordCorrect(password)
        if(!isPasswordValid){
            throw new ApiError(401,'invalid user credentials');
        }
       const {refreshToken, accessToken} = await
        generateAccessAndRefreshTokens(user._id);

       const logggedInUser = await User.findById(user._id).
       select("-password -refreshToken");

       const options = {
        httpOnly:true,
        secure:true
       }
       return res.status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",refreshToken ,options)
       .json(
        new ApiResponse(
            200,
            {
                user: logggedInUser , accessToken ,
                refreshToken
            },
            "User logged in Successfully"
        )
       )
     });
    //  LogOut
    const logOutUser = asyncHandler(async(req,res)=>{
       await User.findByIdAndUpdate(
            req.user._id,{
                $set:{
                    refreshToken:undefined
                }
            },{
                new:true
            }
        )
        const options = {
            httpOnly:true,
            secure:true
           }
           return res
           .status(200)
           .clearCookie("accessToken",options)
           .clearCookie("refreshToken",options)
           .json(new ApiResponse(200,{},"user logged Out"))

    });
    // Refresh token
    const refreshAcessToken = asyncHandler(async(req,res)=>{
    
    const incomingRefreshToken = req.cookies.
    refreshToken || req.body.refreshToken

        if(incomingRefreshToken){
            throw new ApiError(401,'unauthorized request')
        }
       try {
         const decodedToken = jwt.verify(
             incomingRefreshToken,
             process.env.REFRESH_TOKEN_SECRET
         )
         const user = User.findById(decodedToken?._id)
         if(!user){
             throw new ApiError(401,'invalid refresh token')
         }
         if(!incomingRefreshToken !== user?.refreshToken){
             throw new ApiError(401,"Refresh token expired or used")
         }
             const options = {
                 httpOnly:true,
                 secure:true
             }
     const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)
 
         return res.status(200)
         .cookie("accessToken",accessToken , options)
         .cookie("refreshToke",refreshToken , options)
         .json(
             new ApiResponse(
                 200,
                 {accessToken , refreshToken: newRefreshToken},
                 "Access token refreshed"
             )
         )
       } catch (error) {
            throw new ApiError(401,error?.message ||
                "invalid refresh token"
            )
       }
    })


export {registerUser , loginUser , logOutUser , refreshAcessToken}