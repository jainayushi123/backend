import { asyncHandler } from "../utils/ayncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //   res.status(200).json({
  //     message: "Ayushi jain",
  //   });
  //Algorithm design
  //1. take data from user(get user details from frontend)
  //2. validate data (validation - not empty)
  //3. check if user already exits: userName ,email
  //4. check for images and profile/avatar
  //5. upload them to cloudinary, avatar
  //6. create user object - create entry in db
  //7. remove password and refresh token field from response
  //8. check for user creation
  //9. return res if created else error

  const { userName, email, password, fullName } = req.body;
  console.log("Full Name", fullName);

  //   if (fullName === "") {
  //     throw new ApiError(400, "FullName is required");
  //   }

  //   if (!userName && !email && !password && !fullName) {
  //     throw new ApiError(400, "All fields are not defined");
  //   }

  if (
    [fullName, email, password, userName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All firlds are required");
  }

  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or userNAme already Exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //Not mandatory
  //   if (!coverImageLocalPath) {
  //     throw new ApiError(400, "CoverImage file is required");
  //   }

  const avatar = await uploadFileOnCloudinary(avatarLocalPath);
  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

//asyncHandler is usually a wrapper for handling async functions in Express.
//It catches errors inside async route handlers and passes them to
//Express’s error-handling middleware, instead of having to write try/catch every time.
//It is wrapped inside asyncHandler so if any error occurs,
//it won’t crash the server but instead move to the next error handler.

export { registerUser };
