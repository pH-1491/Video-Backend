import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    //count total subscribers
    const totalSubscribers = await Subscription.countDocuments({channel: channelId});

    // //total videos
    // const totalVideos = await Video.countDocuments({owner: channelId});

    //total views across all videos
    const videoStats = await Video.aggregate([
        { $match: {owner: new mongoose.Types.ObjectId(channelId) } },
        {
            $group: {
                _id: null, // no filter is given to group them we are just collecting all videos with that channel id
                totalViews: { $sum: "$views"},
                totalVideos: {$sum: 1} //for every document that passes match add 1
            }
        }
    ]);

    const totalVideos = videoStats[0]?.totalVideos || 0;
    const totalViews = videoStats[0]?.totalViews || 0;

    //total likes
    //to get this join with video schema
    const likeStats = await Like.aggregate([
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'videoData'

            },

        },
        {
            $unwind: '$videoData'
        },
        {
            $match: {
                "videoData.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totalLikes"
        }
    ])
    const totalLikes = likeStats[0]?.totalLikes || 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalSubscribers,
            totalVideos,
            totalViews,
            totalLikes
        }, "Channel stats fetched successfully")
    );


})



const getChannelVideos = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(400, "User not found");
    }

    //count all the videos uploaded by the user
    const totalVideos = await Video.countDocuments({owner: userId});

    //fetch all the videos uploaded by the user
    const allVideos = await Video.find({owner: userId}).populate("owner");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {totalVideos, allVideos},
                "Videos data fetch successfully."
            )
        )


})



export {
    getChannelStats,
    getChannelVideos
}