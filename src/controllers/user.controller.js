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

        if(!incomingRefreshToken){
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
    });
    const changeCurrentPassword = asyncHandler(async(req,res)=>{

        const {oldPassword , newPassword} = req.body

        const user = await User.findById(user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if(!isPasswordCorrect){
            throw new ApiError(400,'Invalid old password');
        }
        user.password = newPassword
        await user.save({validateBeforeSave:false})

        return res.status(200)
        .json(new ApiResponse(200,{},"Password Changed Successfully"))
    });

    const getCurrentUser = asyncHandler(async(req,res)=>{
        return res.status(200)
        .json(200,rq.user,"current user fetched")
    });

    const updateAccountDetails = asyncHandler(async(req,res)=>{
        const {email,fullname} = req.body
        if(!fullname || !email){
            throw new ApiError(400,'All fields are required');
        }
        const user = User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullname,
                    email
                }
            },
            {new:true}
        ).select("-password")
        return res.status(200)
        .json(new ApiResponse(200,user, 'Account details updated'))
    });

    const updateUserAvatar = asyncHandler(async(req,res)=>{

    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,'Avatar file is missing');
    }
    const avatar = await uploadOnCloundinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,'Error while uploading avatar')
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            avatar: avatar.url
        }},
        {new:true}
    ).select("-password");
    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar image updated"))
    });


    
    const updateUserCoverImage = asyncHandler(async(req,res)=>{

    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,'cover file is missing');
    }
    const coverImage = await uploadOnCloundinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,'Error while uploading coverImage')
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            coverImage: coverImage.url
        }},
        {new:true}
    )
    return res.status(200)
    .json(new ApiResponse(200,user,"Cover image updated"))
    });

    const getUserProfile = asyncHandler(async(req,res)=>{
        const {username} = req.params

        if(!username){
            throw new ApiError(400,'Username is missing')
        }
        const channel = await User.aggregate([
            {
                $match:{
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField:"_id",
                    foreignField: "channel",
                    as:"subscribers"

                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    subscriberCount:{
                        $size:"$subscribers"
                    },
                    channelSubscribedToCount:{
                        $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                    }
                }
            }
        },{
            $project:{
                fullname:1,
                username:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                coverImage:1,
                avatar:1,
                email:1

                

            }
        }
        ])
           if(!channel?.length){
            throw new ApiError(404,'Channel does not exists')
           }
        return res.status(200)
        .json(
            new ApiResponse(200,channel[0],"User Channel fetched")
        )
    })



export {registerUser , loginUser , logOutUser , 
       refreshAcessToken,changeCurrentPassword ,
       getCurrentUser , updateAccountDetails ,updateUserAvatar,
       updateUserCoverImage , getUserProfile}