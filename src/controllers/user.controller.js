import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



const generateAccessAndRefreshTokens = async (userID) => {
    try {
        const user = await User.findById(userID);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};

    }catch (error) {
        throw new ApiResponse(501, "Something went wrong while generating access and refresh token");
    }
}



const registerUser = asyncHandler(async (req, res) => {
     //get user details from frontend
     //validation - not empty
     //check if user already exists: username, email
     //check for images, check for avatar
     //upload them to cloudinary,avatar
     //create user object - create entry in db
     //remove password and refresh token field
     //check for user creation
     //return res

    const {fullName, email, password,username} = req.body;
    console.log('email:',email);

    // if (fullName === ""){
    //     throw new ApiError(400, "fullName is required");
    // }

    if ([fullName,email,username,password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are mandatory");
    }

    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }



    // console.log("Files received by multer:", req.files);
    // console.log("Body received:", req.body);


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required abhi");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url ||"",
        email,
        password: password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "User not found");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created successfully")
    )


    })



const loginUser = asyncHandler(async (req, res) => {
    //req.body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookies
    const {email, username, password} = req.body;
    if (!(email || username)) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({    //find one is method of mongoose so used with mongoose's object
        $or: [{ email },{ username }]
    })

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
            "User created successfully"
            )
        );



})



const logoutUser = asyncHandler(async (req, res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1, //this removes the field from the document
                },
            },
            {
                new: true,
            }
        )
        const options = {
            httpOnly: true,
            secure: true,
        }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {},"User logged out successfully"));

})



const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try{
        const decodedToken = jwt.verify(  //decodes the encrypted token
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired");
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: newRefreshToken},
                    "accessToken refreshed"
                )
            )
    } catch (err){
        throw new ApiError(401, err?.message || "Invalid refresh token");
    }

})



const changePassword = asyncHandler(async (req, res) => {
    const {oldPassword,newPassword,confirmPassword} = req.body;

    if (!(newPassword === confirmPassword)){
        throw new ApiError(401, "Passwords do not match");
    }

    const User = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid password");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
        .json(new ApiResponse(200, {},"Password changed successfully"));

})



const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
        .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})



const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;

    if (!fullName || !email || !email.length) {
        throw new ApiError(401, "All details are required");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email,
            }
        },
        {new: true}
    ).select("-password ");

    return res
        .status(200)
        .json(new ApiResponse(200, user,"User account updated successfully"));

})



const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Invalid avatar local path");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(401, "error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        {new: true}
    ).select("-password ");
    return res
        .status(200)
        .json(new ApiResponse(200, user,"User avatar successfully updated"));
})



const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Invalid cover image local path");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!updateUserCoverImage.url) {
        throw new ApiError(401, "error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        {new: true}
    ).select("-password ");

    return res
        .status(200)
        .json(new ApiResponse(200, user,"User cover image successfully updated"));
})



const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {userName} = req.params; //params is url
    if (!userName?.trim()) {
        throw new ApiError(401, "Invalid user name");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase(),
            }
        },
        {
            $lookup: {
                from: "subscriptions", //db me sb lowercase me ho jata hi to plural ho jata hi
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions", //db me sb lowercase me ho jata hi to plural ho jata hi
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $condition: {
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1, //boolean flag
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                isSubscribed: 1,

            }
        }
    ])

    if (!channel?.length){
        throw new ApiError(401, "No channel found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200,channel[0],"user channel fetched successfully"));
})




const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id),
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user[0].watchHistory,
            "watchHistory fetched successfully",
        ))
})





export {registerUser ,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};















