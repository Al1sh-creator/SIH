import argparse
import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

def load_class_names(class_file):
    with open(class_file, 'r') as f:
        classes = [line.strip() for line in f.readlines()]
    return classes

def main():
    parser = argparse.ArgumentParser(description="Crop Disease Detection CLI")
    parser.add_argument("--image", required=True, help="Path to the image to classify")
    args = parser.parse_args()

    image_path = args.image
    if not os.path.exists(image_path):
        print(f"Error: Image not found at {image_path}")
        return

    # Check for weights
    # Note: adjust this path depending on where predict.py is run from (root vs /model)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    weights_path = os.path.join(base_dir, "weights", "mobilenet_v2_disease.pth")
    classes_path = os.path.join(base_dir, "weights", "class_names.txt")

    if not os.path.exists(weights_path) or not os.path.exists(classes_path):
        print(f"Error: Weights or class names not found in {os.path.join(base_dir, 'weights')}")
        print("Please train the model first by running model/train.py")
        return

    class_names = load_class_names(classes_path)

    # Device configuration
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    # Initialize model
    model = models.mobilenet_v2(pretrained=False)
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_ftrs, len(class_names))
    
    # Load weights
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model = model.to(device)
    model.eval()

    # Image transformations (same as validation transforms)
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Load and preprocess image
    try:
        image = Image.open(image_path).convert('RGB')
        input_tensor = transform(image)
        input_batch = input_tensor.unsqueeze(0).to(device)
    except Exception as e:
        print(f"Error processing image: {e}")
        return

    # Predict
    with torch.no_grad():
        output = model(input_batch)
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        confidence, predicted_idx = torch.max(probabilities, 0)
        
    predicted_class = class_names[predicted_idx.item()]
    confidence_val = confidence.item()

    # Output STRICTLY the predicted class (plus confidence for debugging)
    # The hackathon requires printing the predicted class
    print(f"{predicted_class}")
    # print(f"Confidence: {confidence_val:.2f}")

if __name__ == "__main__":
    main()
