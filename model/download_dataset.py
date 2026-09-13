import os
import urllib.request
import zipfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# We'll use a direct public URL for a lightweight version of the Plant Disease Dataset 
# specifically optimized for training during hackathons.
DATASET_URL = "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
DOWNLOAD_DIR = "data"
ZIP_PATH = os.path.join(DOWNLOAD_DIR, "dataset.zip")
EXTRACT_DIR = os.path.join(DOWNLOAD_DIR, "plantvillage")

def download_and_extract():
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    
    if not os.path.exists(ZIP_PATH):
        logger.info(f"Downloading dataset from {DATASET_URL}...")
        logger.info("This might take a few minutes depending on your internet connection.")
        try:
            urllib.request.urlretrieve(DATASET_URL, ZIP_PATH)
            logger.info("Download complete.")
        except Exception as e:
            logger.error(f"Failed to download dataset: {e}")
            logger.info("Alternative: Please download the PlantVillage dataset manually from Kaggle and extract it into the model/data folder.")
            return
    else:
        logger.info("Dataset zip already exists. Skipping download.")
        
    if not os.path.exists(EXTRACT_DIR):
        logger.info("Extracting dataset...")
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(EXTRACT_DIR)
        logger.info(f"Extraction complete. Data available in {EXTRACT_DIR}")
    else:
        logger.info("Dataset already extracted.")

if __name__ == "__main__":
    logger.info("Starting automated dataset download for AgriSmart AI Core Task...")
    download_and_extract()
    logger.info("Ready for training! Next step: run python train.py")
