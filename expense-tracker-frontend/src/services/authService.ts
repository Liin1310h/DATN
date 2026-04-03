import API from "./api";

export const login = async (email: string, password: string) => {
  const res = await API.post("/Auth/login", {
    email,
    password,
  });

  return res.data;
};

export const register = async (
  email: string,
  password: string,
  fullName: string,
) => {
  const res = await API.post("/Auth/register", {
    email,
    password,
    fullName,
  });

  return res.data;
};
