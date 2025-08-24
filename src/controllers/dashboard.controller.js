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
            $count: ""
        }
    ])


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats,
    getChannelVideos
}