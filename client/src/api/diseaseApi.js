import api from './apiClient';

export const detectDisease = (imageFile, cropType) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (cropType) formData.append('cropType', cropType);
    return api.post('/api/disease/detect', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};
