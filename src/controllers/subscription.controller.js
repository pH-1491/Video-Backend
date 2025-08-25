import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(403, "User ID is required");
    }

    if (!channelId) {
        throw new ApiError(403, "Channel not found");
    }

    //check if channel is already subscribed by the user
    const existingSubscriber = await Subscription.findOne( //fid returns an array not a single document
        {
            channel: channelId,
            subscriber: userId,
        }
    )

    let message = "";

    if (existingSubscriber) {
        await Subscription.findByIdAndDelete(existingSubscriber._id);
        message = "Channel unsubscribed successfully"
    }else{
        await Subscription.create(
            {
                channel: channelId,
                subscriber: userId,
            }
        )
        message = "Channel subscribed successfully"
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, message)
        )

})



// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!channelId) {
        throw new ApiError(403, "Channel not found");
    }
    //counting total subscribers and getting them
    const totalSubscribers = Subscription.countDocuments({channel: channelId});
    const subscribers = Subscription.find({channel: channelId})
                        .populate("user","username email");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {totalSubscribers, subscribers},
            "Subscribers data fetched successfully"
        )
    )
})



// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId) {
        throw new ApiError(400, "Subscriber not found");
    }
    //get number of channels subscribed
    const totalChannelsSubscribed = await Subscription.countDocuments({subscriber: subscriberId});
    const subscribedChannels = await Subscription.find({subscriber: subscriberId})
                                    .populate('channel','username email avatar');

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {totalChannelsSubscribed,subscribedChannels},
            "Subscribed channel data fetched successfully"
        )
    )

})



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}