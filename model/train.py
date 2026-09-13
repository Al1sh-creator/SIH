import os
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader, random_split
import time
import copy

def train_model():
    print("=" * 60)
    print("🌿 FarmSense — MobileNetV2 Disease Detection Training")
    print("=" * 60)

    # Path to where download_dataset.py extracted the data
    data_dir = "data/plantvillage/PlantVillage-Dataset-master/raw/color"

    if not os.path.exists(data_dir):
        print(f"Error: Data directory not found at {data_dir}.")
        print("Please run 'python download_dataset.py' first.")
        return

    # ── 1. Enhanced Data Augmentation ────────────────────────────────────────
    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(p=0.2),
            transforms.RandomRotation(20),
            transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.1),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    # ── 2. Load Dataset ─────────────────────────────────────────────────────
    print(f"\n📂 Loading dataset from {data_dir}...")
    full_dataset = datasets.ImageFolder(data_dir, transform=data_transforms['train'])
    class_names = full_dataset.classes
    print(f"   Found {len(full_dataset)} images across {len(class_names)} classes.")

    # ── 3. Train/Val Split (80/20) ──────────────────────────────────────────
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    # Apply validation transforms to the val subset
    # Note: We create a wrapper to apply different transforms
    val_dataset.dataset = copy.copy(full_dataset)
    val_dataset.dataset.transform = data_transforms['val']

    print(f"   Train: {train_size} images | Val: {val_size} images")

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    # On Windows, num_workers=0 prevents multiprocessing spawn issues and freezes
    num_workers = 0

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True,
                              num_workers=num_workers, pin_memory=torch.cuda.is_available())
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False,
                            num_workers=num_workers, pin_memory=torch.cuda.is_available())

    print(f"\n🖥️  Using device: {device}")
    if torch.cuda.is_available():
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
        print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

    # ── 4. Initialize Pre-trained MobileNetV2 ────────────────────────────────
    print("\n🧠 Loading pre-trained MobileNetV2...")
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)

    # Freeze early layers (keep first 14 out of 19 feature blocks frozen)
    # Unfreeze last 5 blocks for fine-tuning — helps distinguish similar diseases
    for i, (name, param) in enumerate(model.features.named_parameters()):
        block_num = int(name.split('.')[0]) if name.split('.')[0].isdigit() else 0
        if block_num < 14:
            param.requires_grad = False
        else:
            param.requires_grad = True

    # Replace the classifier for our specific number of classes
    num_ftrs = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_ftrs, len(class_names))
    )
    model = model.to(device)

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"   Trainable params: {trainable:,} / {total:,} ({100*trainable/total:.1f}%)")

    criterion = nn.CrossEntropyLoss()

    # Separate LR for backbone (lower) and classifier (higher)
    optimizer = optim.Adam([
        {'params': [p for p in model.features.parameters() if p.requires_grad], 'lr': 1e-4},
        {'params': model.classifier.parameters(), 'lr': 1e-3},
    ], weight_decay=1e-4)

    # ── 5. Training Loop ────────────────────────────────────────────────────
    num_epochs = 5
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs)

    best_acc = 0.0
    best_model_weights = copy.deepcopy(model.state_dict())

    print(f"\n🚀 Starting training for {num_epochs} epochs...\n")

    for epoch in range(num_epochs):
        epoch_start = time.time()
        print(f"Epoch {epoch+1}/{num_epochs}")
        print("-" * 40)

        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
                dataloader = train_loader
            else:
                model.eval()
                dataloader = val_loader

            running_loss = 0.0
            running_corrects = 0
            total_batches = len(dataloader)

            for batch_idx, (inputs, labels) in enumerate(dataloader):
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

                # Progress indicator every 50 batches
                if phase == 'train' and (batch_idx + 1) % 50 == 0:
                    print(f"   [{batch_idx+1}/{total_batches}] loss: {loss.item():.4f}")

            epoch_loss = running_loss / len(dataloader.dataset)
            epoch_acc = running_corrects.double() / len(dataloader.dataset)

            emoji = "📈" if phase == 'train' else "📊"
            print(f"   {emoji} {phase:5s} — Loss: {epoch_loss:.4f}  Acc: {epoch_acc:.4f} ({epoch_acc*100:.1f}%)")

            # Save best model based on validation accuracy
            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_model_weights = copy.deepcopy(model.state_dict())
                print(f"   ✅ New best model! Val Acc: {best_acc:.4f}")

        scheduler.step()
        elapsed = time.time() - epoch_start
        print(f"   ⏱️  Epoch time: {elapsed:.1f}s\n")

    # ── 6. Save Best Model ──────────────────────────────────────────────────
    print("=" * 40)
    print(f"🏆 Best Validation Accuracy: {best_acc:.4f} ({best_acc*100:.1f}%)")
    print("=" * 40)

    # Load best weights before saving
    model.load_state_dict(best_model_weights)

    os.makedirs('weights', exist_ok=True)
    torch.save(model.state_dict(), 'weights/mobilenet_v2_disease.pth')

    with open('weights/class_names.txt', 'w') as f:
        for c in class_names:
            f.write(c + '\n')

    print("✅ Model saved to weights/mobilenet_v2_disease.pth")
    print("✅ Class names saved to weights/class_names.txt")
    print("\n🎉 Training complete! Restart the Django server to use the new model.")

if __name__ == '__main__':
    train_model()

