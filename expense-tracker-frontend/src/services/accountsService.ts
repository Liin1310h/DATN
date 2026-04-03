import API from "./api";

export const getAccounts = async () => {
  const response = await API.get("/accounts");
  return response.data;
};

export const createAccount = async (data: any) => {
  const response = await API.post("/accounts", data);
  return response.data;
};

export const updateAccount = async (id: number, data: any) => {
  const response = await API.put(`/accounts/${id}`, data);
  return response.data;
};
export const deleteAccount = async (id: number) => {
  await API.delete(`/accounts/${id}`);
};
export interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

export const getBanks = async (): Promise<Bank[]> => {
  try {
    const response = await fetch("https://api.vietqr.io/v2/banks");
    const result = await response.json();

    if (result.code === "00") return result.data;

    throw new Error(result.desc || "Không thể lấy danh sách ngân hàng");
  } catch (error) {
    console.error("Lỗi lấy API của VietQR: ", error);
    return [];
  }
};
