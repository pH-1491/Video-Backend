import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query


    page = parseInt(page);
    limit = parseInt(limit);

    //build filter
    const filter = {};

    if (query) {
        filter.$or =[
            {
                title: {
                    $regex: query,    //$regex is like "LIKE" in my SQL
                    $options: "i",    // this makes the query case-insensitive
                }
            },
            {
                description: {
                    $regex: query,
                    $options: "i",
                }
            }
        ];
    }


    if (userId && isValidObjectId(userId)) {
        filter.owner = userId;
    }

    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
    }

    //get videos with pagination
    const videos = await Video.find(filter)
    .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user","username email")

    const totalVideos = await Video.countDocuments(filter);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                totalVideos,
                page,
                totalPages: Math.ceil(totalVideos / limit),
                videos: videos,
            },
            "Videos fetched successfully"
        )
    )
})



const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if (!title) {
        throw new ApiError(400, "Title is required")
    }

    if (!description) {
        throw new ApiError(400, "Description is required")
    }

    if (!req.file?.videoFile) {
        throw new ApiError(400, "Video file is required");
    }

    if (!req.files?.thumbnail) {
        throw new ApiError(400, "Thumbnail is required");
    }

    //Upload video on cloudinary
    const uploadedVideo = await uploadOnCloudinary(req.files.videoFile[0].path);
    if (!uploadedVideo?.url) {
        throw new ApiError(500, "Failed to upload video to Cloudinary");
    }

    //upload thumbnail to cloudinary
    const uploadedThumbnail = await uploadOnCloudinary(req.files.thumbnail[0].path);
    if (!uploadedThumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail");
    }

    //create a new video in mongodb

    const video = await Video.create({
        title: title,
        description: description,
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        duration: uploadedVideo.duration,
        owner: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            Video,
            "Video published successfully"
        )
    )
})



const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }

    const video = await Video.findById(videoId).populate("owner", "username email");
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        )
    )
})



const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Authorization check
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const { title, description } = req.body;
    let thumbnail = req.body.thumbnail;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    // If thumbnail is uploaded via file
    if (req.file) {
        const uploadedThumbnail = await uploadOnCloudinary(req.file.path);
        if (!uploadedThumbnail?.url) {
            throw new ApiError(500, "Failed to upload thumbnail");
        }
        thumbnail = uploadedThumbnail.url;
    }

    // Update video
    video.title = title;
    video.description = description;
    if (thumbnail) video.thumbnail = thumbnail;

    await video.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video details updated successfully"
        )
    );
});



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    //authorization check
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    await video.deleteOne();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video deleted successfully"
        )
    )

})



const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const video = await Video.findOne({
        owner: userId,
        _id: videoId
    });

    if (!video) {
        throw new ApiError(404, "Video not found or not owned by you");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    const message = video.isPublished
        ? "Video published successfully"
        : "Video unpublished successfully";

    return res.status(200).json(
        new ApiResponse(200, video, message)
    );
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}