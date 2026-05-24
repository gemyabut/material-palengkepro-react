import axios from "../../../api/axios";

export const getProfile = async () => {
  const response = await axios.get("/users/profile/");
  return response.data;
};

export const updateProfile = async (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });

  const response = await axios.put("/users/profile/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
