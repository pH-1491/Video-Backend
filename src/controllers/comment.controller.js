import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400,"Invalid videoId provided");
    }

    const pageNumber = parseInt(page,10);
    const limitNumber = parseInt(limit,10);
    const skip = (pageNumber - 1) * limitNumber;

    //fetch comments
    const comments = await Comment.find({video: videoId})
        .populate("owner","username email")
        .sort({ createdAt: -1})
        .skip(skip)
        .limit(limitNumber);

    const totalComments = await Comment.countDocuments({video: videoId});

    return res
        .status(200)
        .json(
            new ApiResponse(200, {
                comments,
                pagination: {
                    total: totalComments,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalComments / limitNumber),
                }
            }, "Comments fetched successfully")
        );

})


const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const {content} = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id,   // req.user comes from verifyJWT
    });

    return res
    .status(200)
    .json(new ApiResponse(201, comment,"Comment added successfully"));
})


const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const {content} = req.body;

    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    //find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    //check the ownership of the commment
    if (comment.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "User does not have permission to update");
    }

    //update comment
    comment.content = content;
    await content.save();

    return res
    .status(200)
    .json(new ApiResponse(201, comment,"Comment updated successfully"));

})


const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Comment content is required");
    }

    //find the comment
    const comment  = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    //!ownership check
    if (comment.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    // comment.content = "";
    // await comment.save();
    //this does not deletes the comment from database
    await comment.findByIdAndDelete(commentId);

    return res
    .status(200)
    .json(new ApiResponse(201, comment,"Comment deleted successfully"));
})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
}



