import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js";


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body


    if (!name){
        throw new ApiError(400,'Playlist name is required')
    }

    const playList = await Playlist.create(
        {
            name: name,
            description: description || " ",
            owner: req.user._id,
            videos: []
        }
    )

    return res
        .status(201)
        .json(new ApiResponse(201,playList,"playlist created successfully."))
})


const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists



})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    //check if playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, 'Playlist not found')
    }

    //check if video to be added exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, 'Video not found')
    }

    //check if the video already exists in the playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(401, 'Video already exists in the playlist')
    }

    //add the video to the playlist
    playlist.videos.push(videoId);
    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiResponse(201,playlist,"video saved successfully to the playlist.")
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, 'Playlist not found')
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, 'Video not found')
    }

    // playlist.video.findByIdAndDelete(videoId);
    // playlist.save();
    //this is wrong because playlist.video is an array object and not a model

    playlist.videos = playlist.videos.filter(
        (vid) => vid.toString() !== videoId
    );

    //or we can also use $pull
    //await.Playlist.findByIdAndUpdate(
    //playlistId,
    //{ $pull: {videos: videoId} },
    //{new: true}
    //)

    playlist.save();


    return res
    .status(200)
    .json(
        new ApiResponse(201,playlist,"video deleted successfully from the playlist.")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}