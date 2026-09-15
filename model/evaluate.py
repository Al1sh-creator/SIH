"""
model/evaluate.py — FarmSense Model Evaluation Script
======================================================
Picks N random images per disease class from the PlantVillage dataset,
runs them through the trained MobileNetV2, and prints a full report:
  - Per-class accuracy
  - Overall accuracy
  - Top-5 accuracy
  - Confusion summary (most common misclassifications)

Usage (run from the /model directory):
  python evaluate.py               # 10 images per class (fast)
  python evaluate.py --per-class 30  # 30 images per class (thorough)
  python evaluate.py --class Tomato___Early_blight  # single class only
"""

import os
import sys
import argparse
import random
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from collections import defaultdict

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, "weights", "mobilenet_v2_disease.pth")
CLASSES_PATH = os.path.join(BASE_DIR, "weights", "class_names.txt")
DATA_DIR     = os.path.join(BASE_DIR, "data", "plantvillage",
                            "PlantVillage-Dataset-master", "raw", "color")

# ── Image transform (same as validation in train.py) ─────────────────────────
TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


def load_model(class_names):
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    model  = models.mobilenet_v2(pretrained=False)
    num_ftrs = model.classifier[1].in_features

    # Try new architecture first (Dropout+Linear), fall back to old
    try:
        model.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_ftrs, len(class_names))
        )
        model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))
    except RuntimeError:
        model = models.mobilenet_v2(pretrained=False)
        num_ftrs = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_ftrs, len(class_names))
        model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))

    model = model.to(device)
    model.eval()
    return model, device


def predict_image(model, device, image_path):
    """Returns (top1_class_idx, top5_class_indices, confidence%)."""
    image  = Image.open(image_path).convert('RGB')
    tensor = TRANSFORM(image).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(tensor)
        probs  = torch.nn.functional.softmax(output[0], dim=0)
    top5   = torch.topk(probs, 5)
    return top5.indices[0].item(), top5.indices.tolist(), round(top5.values[0].item() * 100, 1)


def collect_images(data_dir, filter_class=None):
    """Returns dict: {class_name: [image_paths]}"""
    class_images = {}
    for cls in sorted(os.listdir(data_dir)):
        cls_dir = os.path.join(data_dir, cls)
        if not os.path.isdir(cls_dir):
            continue
        if filter_class and filter_class.lower() not in cls.lower():
            continue
        imgs = [
            os.path.join(cls_dir, f)
            for f in os.listdir(cls_dir)
            if f.lower().endswith(('.jpg', '.jpeg', '.png'))
        ]
        if imgs:
            class_images[cls] = imgs
    return class_images


def bar(value, total, width=20):
    filled = int(round(value / total * width)) if total else 0
    return '█' * filled + '░' * (width - filled)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--per-class', type=int, default=10,
                        help='Number of random test images per class (default: 10)')
    parser.add_argument('--class', dest='filter_class', default=None,
                        help='Only test a specific class (partial name match)')
    parser.add_argument('--seed', type=int, default=42, help='Random seed')
    args = parser.parse_args()

    random.seed(args.seed)

    # ── Validation ───────────────────────────────────────────────────────────
    for path, label in [(WEIGHTS_PATH, "Weights"), (CLASSES_PATH, "Class names"), (DATA_DIR, "Dataset")]:
        if not os.path.exists(path):
            print(f"❌  {label} not found: {path}")
            sys.exit(1)

    with open(CLASSES_PATH) as f:
        class_names = [l.strip() for l in f if l.strip()]

    print("=" * 65)
    print("🌿  FarmSense — Model Evaluation")
    print("=" * 65)
    print(f"   Model      : MobileNetV2  ({len(class_names)} classes)")
    print(f"   Device     : {'CUDA (GPU)' if torch.cuda.is_available() else 'CPU'}")
    print(f"   Per-class  : {args.per_class} random images")
    if args.filter_class:
        print(f"   Filter     : '{args.filter_class}'")
    print()

    model, device = load_model(class_names)
    class_images  = collect_images(DATA_DIR, args.filter_class)

    if not class_images:
        print("❌  No classes found. Check --class filter or dataset path.")
        sys.exit(1)

    # ── Run evaluation ────────────────────────────────────────────────────────
    results          = {}
    confusion        = defaultdict(lambda: defaultdict(int))
    total_correct    = 0
    total_top5       = 0
    total_images     = 0
    true_class_idx   = {name: i for i, name in enumerate(class_names)}

    for cls_name, img_paths in class_images.items():
        sample    = random.sample(img_paths, min(args.per_class, len(img_paths)))
        correct   = 0
        top5_corr = 0
        confs     = []

        true_idx = true_class_idx.get(cls_name, -1)

        for img_path in sample:
            try:
                pred_idx, top5_idx, conf = predict_image(model, device, img_path)
                confs.append(conf)
                if pred_idx == true_idx:
                    correct += 1
                if true_idx in top5_idx:
                    top5_corr += 1
                confusion[cls_name][class_names[pred_idx]] += 1
            except Exception:
                pass  # skip corrupted images silently

        n = len(sample)
        results[cls_name] = dict(correct=correct, top5=top5_corr, total=n,
                                  avg_conf=round(sum(confs)/len(confs), 1) if confs else 0)
        total_correct  += correct
        total_top5     += top5_corr
        total_images   += n
        # Live progress
        acc = correct / n * 100 if n else 0
        print(f"  [{cls_name:<48}]  {acc:>5.1f}%  ({correct}/{n})")

    # ── Per-class report ──────────────────────────────────────────────────────
    print()
    print(f"{'CLASS':<50} {'ACC':>6}  {'TOP5':>5}  {'CONF':>6}  VISUAL")
    print("─" * 90)

    for cls_name, r in sorted(results.items(), key=lambda x: -x[1]['correct']/max(x[1]['total'],1)):
        acc  = r['correct'] / r['total'] * 100 if r['total'] else 0
        top5 = r['top5']    / r['total'] * 100 if r['total'] else 0
        display = cls_name.replace('___', ' — ').replace('_', ' ')
        print(f"{display:<50} {acc:>5.1f}%  {top5:>4.0f}%  {r['avg_conf']:>5.1f}%  {bar(r['correct'], r['total'])}")

    # ── Overall summary ───────────────────────────────────────────────────────
    overall_acc  = total_correct / total_images * 100 if total_images else 0
    overall_top5 = total_top5   / total_images * 100 if total_images else 0

    print("─" * 90)
    print(f"\n📊  OVERALL RESULTS  ({total_images} images, {len(results)} classes)")
    print(f"    Top-1 Accuracy : {overall_acc:.1f}%   {bar(total_correct, total_images, 30)}")
    print(f"    Top-5 Accuracy : {overall_top5:.1f}%   {bar(total_top5, total_images, 30)}")

    # ── Common misclassifications ─────────────────────────────────────────────
    print(f"\n🔎  MOST COMMON MISCLASSIFICATIONS")
    print("─" * 60)
    mistakes = []
    for true_cls, preds in confusion.items():
        for pred_cls, count in preds.items():
            if true_cls != pred_cls:
                mistakes.append((count, true_cls, pred_cls))
    mistakes.sort(reverse=True)
    for count, true_cls, pred_cls in mistakes[:10]:
        t = true_cls.replace('___', ' — ').replace('_', ' ')
        p = pred_cls.replace('___', ' — ').replace('_', ' ')
        print(f"    {count:>3}x  '{t}'  →  '{p}'")

    print("\n✅  Evaluation complete.\n")


if __name__ == "__main__":
    main()
