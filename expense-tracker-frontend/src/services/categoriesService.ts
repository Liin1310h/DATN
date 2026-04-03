import API from "./api";

// Định nghĩa Interface
export interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
  userId?: number | null;
}
export const getCategories = async () => {
  try {
    const response = await API.get("/categories");
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy danh mục:", error);
    throw error;
  }
};

export const createCategory = async (categoryData: {
  name: string;
  icon: string;
  color: string;
}) => {
  try {
    const response = await API.post("/categories", categoryData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo danh mục:", error);
    throw error;
  }
};

export const changeCategory = async (id: number, categoryData: Category) => {
  try {
    const response = await API.put(`/categories/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thay đổi danh mục: ", error);
    throw error;
  }
};

export const deleteCategory = async (id: number) => {
  try {
    const response = await API.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.log("Lỗi khi xoá danh mục: ", error);
    throw error;
  }
};
