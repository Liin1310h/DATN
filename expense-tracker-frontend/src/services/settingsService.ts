import API from "./api";
import type { UserSettings } from "../types/userSettings";

export const getSettings = async (): Promise<UserSettings> => {
  const response = await API.get("/settings");
  return response.data;
};

export const updateSettings = async (settingsData: UserSettings) => {
  const response = await API.put("/settings", settingsData);
  return response.data;
};
