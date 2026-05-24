// profile/api/changePasswordApi.js

import axios from "../../../api/axios";

export const changePassword = async ({ current_password, new_password }) => {
  const response = await axios.post("/users/change-password/", {
    current_password,
    new_password,
  });
  return response.data;
};
