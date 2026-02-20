import api from "./axios";

export const getMyContext = () => {
  return api.get("/me/context");
};
