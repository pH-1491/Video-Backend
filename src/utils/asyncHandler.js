const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
};


export {asyncHandler};

// const asyncHandler = (fn) => async (req, res, next) => {
//     try{
//         await fn(req, res, next);
//     }catch(e){
//         res.status(e.code || 500).json({
//             sucess: false,
//             message: e.message
//         });
//     }
// }