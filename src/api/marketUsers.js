import apiClient from "./axios";

export const listMarketUsers = (params = {}) =>
  apiClient.get("/users/list-by-market/", { params }).then((r) => r.data);
