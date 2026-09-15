import api from './apiClient';

/** Stage 1 — instant: local CV model + local KB treatment (~1-2 sec) */
export const detectDiseaseFast = (imageFile, cropType) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (cropType) formData.append('cropType', cropType);
    return api.post('/api/disease/detect/fast', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

/** Stage 2 — async: Groq AI treatment enhancement */
export const enhanceTreatment = (predictedClass, confidence, cropType) => {
    return api.post('/api/disease/treatment/enhance', {
        predicted_class: predictedClass,
        confidence,
        cropType,
    });
};

/** Legacy single-call (slow — kept for backwards compat) */
export const detectDisease = (imageFile, cropType) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (cropType) formData.append('cropType', cropType);
    return api.post('/api/disease/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
