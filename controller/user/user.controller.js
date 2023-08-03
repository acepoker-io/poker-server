import httpStatus from "http-status";
import ApiError from "../../landing-server/utils/ApiError.js";
import userService from "../../service/user.service.js";

const getAllFriends = async (req, res) => {
  const response = await userService.getAllFriends();
  if (!response) {
    throw new ApiError(httpStatus.NOT_FOUND, "users not found");
  }
  return res.status(200).send(response);
};

const userController = {
  getAllFriends,
};
export default userController;
