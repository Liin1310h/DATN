export const uploadImages = async (
  files: File[],
  onProgress?: (percent: number) => void,
): Promise<string[]> => {
  const sigRes = await fetch("http://localhost:5000/api/media/signature", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  const { timestamp, signature, apiKey, cloudName } = await sigRes.json();

  let uploaded = 0;

  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", "expense-tracker");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();

    uploaded++;
    const percent = Math.round((uploaded / files.length) * 100);
    onProgress?.(percent);

    return data.secure_url;
  });

  return Promise.all(uploadPromises);
};
