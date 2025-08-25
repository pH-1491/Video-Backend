import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError("video not found")
    }

    //check if user has already liked this video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    let message = "";

    if (!existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        message = "video unliked successfully";
    }else{
        await Like.create({
            video: videoId,
            likedBy: req.user._id
        });
        message = "video liked successfully";
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, message)
        );
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError("commentId not found")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    let message = "";

    if (existingLike){
        await Like.findByIdAndDelete(existingLike._id);
        message = "comment unliked successfully";
    }else{
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        });
        message = "comment liked successfully";
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, message)
    )

})


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, "tweetId is required");
    }

    // check if tweet is already liked
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    let message = "";
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        message = "tweet unliked successfully";
    } else {
            await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        });
        message = "tweet liked successfully";
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, message));
});


const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError("user not found");
    }
    //count total liked videos
    const totalLikedVideos = await Like.countDocuments({likedBy: userId});

    //get all liked videos with video details
    const likedVideos = await Like.find({likedBy: userId}).populate("video");

    return res
        .status(200).
        json(
        new ApiResponse(
            200,
            { totalLikedVideos, likedVideos },
            "Fetched liked videos successfully."
        )
    );
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}