import api from "./axios";

import axios from "./axios";

export const loginUser = (email, password, mode = "lead") => {
  const url =
    mode === "employee"
      ? "/auth/employee/login"
      : "/auth/login";

  return axios.post(url, { email, password });
};


export const sendOtp = (email, mode = "lead") => {
  const url =
    mode === "employee"
      ? "/auth/employee/send-otp"
      : "/auth/send-otp";

  return axios.post(url, { email });
};

export const resetPassword = (payload, mode = "lead") => {
  const url =
    mode === "employee"
      ? "/auth/employee/reset-password"
      : "/auth/reset-password";

  return axios.post(url, payload);
};