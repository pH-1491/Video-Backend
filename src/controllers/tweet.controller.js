import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content || content.trim() === "") {
        throw new ApiError(401,'content is required');
    }

    if (!req.user?._id){
        throw new ApiError(403, 'Unauthorized: Please log in')
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user._id,
    })

    if (!tweet){
        throw new ApiError(500, 'failed to create tweet')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                tweet,
                "Tweet created successfully",
            )
        )

})



const getUserTweets = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const { tweetId } = req.params;

    if (!userId){
        throw new ApiError(403, 'user not found');
    }

    // if (!tweetId){
    //     throw new ApiError(403, 'tweet not found');
    // }

    //count total number of tweets posted by that user
    const totalTweets = await Tweet.countDocuments({owner: userId});

    //get all the tweets posted by the user
    const allTweets = await Tweet.find({owner: userId}).populate("owner","username email");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {totalTweets, allTweets,},
            "Tweet data fetched successfully",
        )
    )
})




const updateTweet = asyncHandler(async (req, res) => {

    const { tweetId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required to update tweet");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet){
        throw new ApiError(403, 'Tweet not found');
    }

    //authorisation check (forgot)
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You are not authorized to update tweet');
    }

    //update content
    tweet.content = content;
    await tweet.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet updated successfully",
        )
    )

})




const deleteTweet = asyncHandler(async (req, res) => {

    const { tweetId } = req.params;
    if (!tweetId){
        throw new ApiError(403, 'Tweet not found');
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet){
        throw new ApiError(403, 'Tweet not found');
    }

    //authorisation check
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You are not authorized to delete this tweet');
    }

    //await Tweet.findByIdAndDelete(tweetId);
    await tweet.deleteOne();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet deleted successfully",
        )
    )
})




export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}