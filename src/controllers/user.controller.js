import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js"
import { ApiResponce } from "../utils/ApiResponce.js";
import { table } from "console";

const registerUser = asyncHandler(
    async (req, res) => {
        // steps :
        // 1 get user details from frontend
        // 2 validation - empty
        // 3 check if user already exists: username, email
        // 4 check for images, check for avatar
        // 5 upload them to cloudinary, avatar
        // 6 create user object - create entry in db
        // 7 remove password and refresh token field from response
        // 8 check for user creation
        // 9 return response

        // step 1
        const { username, email, fullname, password } = req.body;

        // step 2
        // 1st way of defineing errors
        // if (username === "") {
        //     throw new ApiError(404, "username is required")
        // }
        // if (email === "") {
        //     throw new ApiError(404, "email is required")
        // }
        // if (fullname === "") {
        //     throw new ApiError(404, "fullname is required")
        // }
        // if (password === "") {
        //     throw new ApiError(404, "password is required")
        // }

        // 2nd way of defineing errors
        if (
            [username, email, fullname, password].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(404, "All field are required!");
        }

        // step 3
        const existedUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists");
        }

        // step 4
        const avatarLocalPath = req.files?.avatar[0].path;
        // const coverImageLocalPath = req.files?.coverImage[0].path;

        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        }
       

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required")
        }

        // step 5
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!avatar) {
            throw new ApiError(400, "Avatar file is required")
        }

        //step 6
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })

        // step 7
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        // step 8
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }

        // step 9 
        return res.status(201).json(
            new ApiResponce(200, createdUser, "User registered successfully")
        )
    });

export { registerUser };
