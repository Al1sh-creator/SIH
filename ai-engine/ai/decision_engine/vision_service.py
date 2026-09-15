import os
import json
import logging
import base64
import math
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from io import BytesIO

logger = logging.getLogger(__name__)

# ─── OOD (Out-Of-Distribution) Detection Thresholds ──────────────────────────
# If the model's top confidence is below this value, the image is likely NOT a
# plant leaf and we reject it outright.
MIN_CONFIDENCE_THRESHOLD = 70.0   # percent (0-100)

# Maximum allowed prediction entropy. Entropy measures how "spread out" the
# probability distribution is across classes. A high entropy (close to
# log(num_classes)) means the model is guessing — typical of random images.
# We normalise entropy to [0, 1] and reject if it exceeds this threshold.
MAX_NORMALISED_ENTROPY = 0.75

# ─── ImageNet Pre-Filter (Leaf/Plant Gate) ────────────────────────────────────
# A stock ImageNet-pretrained MobileNetV2 is used as a *gatekeeper* before the
# disease classifier runs. We scan its top-K predictions for plant-related
# keywords. If none are found the image is rejected immediately — before any
# disease softmax probabilities are ever computed.
#
# This sidesteps the well-known "softmax overconfidence" problem: a closed-set
# classifier always picks *some* class, even for completely unrelated images.

# How many of the top ImageNet predictions to scan for plant keywords.
IMAGENET_TOPK = 5

# Keywords that indicate the image contains plant-like content.
# Matched case-insensitively against ImageNet class label strings.
PLANT_KEYWORDS = {
    "leaf", "plant", "flower", "tree", "fruit", "corn", "tomato", "potato",
    "grape", "strawberry", "peach", "apple", "squash", "pepper", "herb",
    "fern", "moss", "blossom", "petal", "stem", "root", "seed", "crop",
    "vegetable", "garden", "fungus", "mold", "rust", "blight", "cabbage",
    "lettuce", "spinach", "citrus", "lemon", "lime", "orange", "banana",
    "mango", "papaya", "broccoli", "cauliflower", "artichoke", "zucchini",
    "cucumber", "pumpkin", "berry", "cherry", "rose", "daisy", "tulip",
    "sunflower", "acorn", "pine", "oak", "maple", "willow", "bamboo",
    "cactus", "succulent", "aloe", "wheat", "rice", "soybean", "cotton",
}

# ─── Built-in treatment knowledge base ───────────────────────────────────────
# Used as fallback when Groq API is unreachable, so the user always gets a result.
FALLBACK_TREATMENTS = {
    "Apple___Apple_scab": {
        "description": "Apple scab is a fungal disease caused by Venturia inaequalis, producing dark olive-green to black lesions on leaves and fruit.",
        "organic_treatment": "Apply neem oil or sulfur-based fungicide. Remove and destroy fallen infected leaves. Ensure good air circulation by proper pruning.",
        "chemical_treatment": "Apply Mancozeb or Captan fungicide at bud break and repeat every 7-10 days during wet weather. Myclobutanil can be used as a curative spray."
    },
    "Apple___Black_rot": {
        "description": "Black rot is caused by the fungus Botryosphaeria obtusa. It affects leaves, fruit, and bark, causing circular brown lesions.",
        "organic_treatment": "Prune out dead or diseased branches. Remove mummified fruits. Apply copper-based fungicide during dormant season.",
        "chemical_treatment": "Apply Captan or Thiophanate-methyl fungicide during the growing season. Ensure thorough coverage of fruit and foliage."
    },
    "Apple___Cedar_apple_rust": {
        "description": "Cedar apple rust is caused by Gymnosporangium juniperi-virginianae. It produces bright orange-yellow spots on apple leaves.",
        "organic_treatment": "Remove nearby juniper/cedar trees if possible. Apply sulfur sprays preventatively. Use resistant apple varieties.",
        "chemical_treatment": "Apply Myclobutanil or Mancozeb from pink bud stage through petal fall. Repeat applications every 7-10 days."
    },
    "Tomato___Bacterial_spot": {
        "description": "Bacterial spot is caused by Xanthomonas species, producing small, water-soaked spots that turn brown on leaves and fruit.",
        "organic_treatment": "Use copper-based sprays. Practice crop rotation. Remove infected plant debris. Use disease-free seeds and transplants.",
        "chemical_treatment": "Apply copper hydroxide combined with Mancozeb. Streptomycin sulfate can be used on seedlings. Rotate with non-solanaceous crops."
    },
    "Tomato___Early_blight": {
        "description": "Early blight is caused by Alternaria solani, producing dark concentric ring-shaped lesions on lower leaves first.",
        "organic_treatment": "Apply neem oil or copper fungicide. Mulch around plants. Remove lower affected leaves. Practice crop rotation.",
        "chemical_treatment": "Apply Chlorothalonil or Mancozeb preventatively. Azoxystrobin provides excellent control. Start applications before symptoms appear."
    },
    "Tomato___Late_blight": {
        "description": "Late blight is caused by Phytophthora infestans, causing large, irregularly shaped water-soaked lesions. Can destroy entire fields rapidly.",
        "organic_treatment": "Remove and destroy infected plants immediately. Apply copper-based fungicide. Ensure good air circulation. Avoid overhead irrigation.",
        "chemical_treatment": "Apply Metalaxyl-M (Ridomil) or Cymoxanil + Mancozeb. Spray preventatively during cool, wet conditions. Alternate fungicide groups."
    },
    "Tomato___Leaf_Mold": {
        "description": "Leaf mold is caused by Passalora fulva (Cladosporium fulvum), producing yellow patches on upper leaf surfaces with olive-green mold underneath.",
        "organic_treatment": "Improve ventilation in greenhouses. Reduce humidity. Remove affected leaves. Apply neem oil or potassium bicarbonate.",
        "chemical_treatment": "Apply Chlorothalonil or Mancozeb. Ensure good greenhouse ventilation. Use resistant varieties when available."
    },
    "Tomato___Septoria_leaf_spot": {
        "description": "Septoria leaf spot is caused by Septoria lycopersici, producing small circular spots with dark borders and gray centers on lower leaves.",
        "organic_treatment": "Remove infected lower leaves. Apply copper-based fungicide. Mulch to prevent soil splash. Practice 3-year crop rotation.",
        "chemical_treatment": "Apply Chlorothalonil or Mancozeb at first sign of disease. Repeat every 7-10 days during wet weather."
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "description": "Two-spotted spider mites cause stippling and yellowing of leaves. Severe infestations produce fine webbing on leaf undersides.",
        "organic_treatment": "Spray with neem oil or insecticidal soap. Introduce predatory mites (Phytoseiulus persimilis). Maintain adequate plant watering.",
        "chemical_treatment": "Apply Abamectin or Spiromesifen miticide. Rotate miticide classes to prevent resistance. Avoid broad-spectrum insecticides."
    },
    "Tomato___Target_Spot": {
        "description": "Target spot is caused by Corynespora cassiicola, producing concentric ring lesions on leaves, stems, and fruit.",
        "organic_treatment": "Remove and destroy infected plant debris. Improve air circulation. Apply copper-based fungicide or neem oil.",
        "chemical_treatment": "Apply Chlorothalonil or Azoxystrobin. Begin applications preventatively and repeat every 7-14 days."
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "description": "TYLCV is a viral disease transmitted by whiteflies, causing severe leaf curling, yellowing, and stunted growth.",
        "organic_treatment": "Control whitefly populations with yellow sticky traps and neem oil. Remove infected plants. Use reflective mulch to repel whiteflies.",
        "chemical_treatment": "Apply Imidacloprid or Thiamethoxam for whitefly control. Use resistant varieties. Remove and destroy infected plants to prevent spread."
    },
    "Tomato___Tomato_mosaic_virus": {
        "description": "Tomato mosaic virus causes mottled light and dark green patterns on leaves, leaf curling, and reduced fruit quality.",
        "organic_treatment": "Remove and destroy infected plants. Disinfect tools with 10% bleach solution. Wash hands before handling plants. Use resistant varieties.",
        "chemical_treatment": "No chemical cure exists for viral diseases. Focus on prevention: use virus-free seeds, disinfect tools, and control aphid vectors with Imidacloprid."
    },
    "Potato___Early_blight": {
        "description": "Early blight in potato is caused by Alternaria solani, producing dark brown target-like spots on leaves starting from lower foliage.",
        "organic_treatment": "Apply copper-based fungicide or neem oil. Remove lower infected leaves. Mulch around plants and practice 2-3 year crop rotation.",
        "chemical_treatment": "Apply Mancozeb or Chlorothalonil at first sign of disease. Azoxystrobin provides systemic protection. Repeat every 7-10 days."
    },
    "Potato___Late_blight": {
        "description": "Late blight in potato is caused by Phytophthora infestans, producing large water-soaked lesions that rapidly kill foliage and rot tubers.",
        "organic_treatment": "Remove and destroy infected plants immediately. Apply copper fungicide preventatively. Hill soil around plants to protect tubers.",
        "chemical_treatment": "Apply Metalaxyl-M + Mancozeb or Cymoxanil preventatively. Spray before and during cool, wet weather. Destroy cull piles."
    },
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "description": "Gray leaf spot is caused by Cercospora zeae-maydis, producing rectangular gray-tan lesions between leaf veins.",
        "organic_treatment": "Practice crop rotation with non-host crops. Till under infected residue. Use resistant hybrids. Ensure adequate spacing for air circulation.",
        "chemical_treatment": "Apply Azoxystrobin or Propiconazole at VT-R1 stage. Fungicide application is most effective when applied preventatively."
    },
    "Corn_(maize)___Common_rust_": {
        "description": "Common rust is caused by Puccinia sorghi, producing small reddish-brown pustules on both leaf surfaces.",
        "organic_treatment": "Plant resistant hybrids. Remove volunteer corn plants. Sulfur-based fungicide can provide some protection.",
        "chemical_treatment": "Apply Azoxystrobin or Propiconazole if rust appears before tasseling. Economic threshold is when most hybrids show pustules before tasseling."
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "description": "Northern leaf blight is caused by Exserohilum turcicum, producing long, cigar-shaped gray-green lesions on leaves.",
        "organic_treatment": "Use resistant hybrids. Practice crop rotation. Till under corn residue after harvest to reduce inoculum.",
        "chemical_treatment": "Apply Azoxystrobin + Propiconazole at V14-VT stage. Fungicide is most beneficial when disease is present before tasseling."
    },
    "Grape___Black_rot": {
        "description": "Black rot is caused by Guignardia bidwellii, producing tan circular leaf spots and shriveled, mummified black fruit.",
        "organic_treatment": "Remove and destroy mummified fruit and infected leaves. Prune for good air circulation. Apply copper-based fungicide at bud break.",
        "chemical_treatment": "Apply Myclobutanil or Mancozeb starting at bud break through 4 weeks after bloom. Maintain spray schedule during wet weather."
    },
    "Grape___Esca_(Black_Measles)": {
        "description": "Esca (Black Measles) is a complex fungal disease causing tiger-stripe patterns on leaves and dark spotting on berries.",
        "organic_treatment": "Prune during dry weather and seal wounds. Remove severely infected vines. Apply Trichoderma-based biological control agents to pruning wounds.",
        "chemical_treatment": "No fully effective chemical control exists. Sodium arsenite (where permitted) was traditionally used. Focus on wound protection with thiophanate-methyl paste."
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "description": "Isariopsis leaf spot causes angular reddish-brown spots on grape leaves, primarily affecting lower canopy in humid conditions.",
        "organic_treatment": "Improve canopy management for air circulation. Remove infected leaves. Apply copper-based fungicide or sulfur sprays.",
        "chemical_treatment": "Apply Mancozeb or Captan preventatively during humid conditions. Ensure thorough coverage of lower canopy."
    },
    "Cherry_(including_sour)___Powdery_mildew": {
        "description": "Powdery mildew on cherry produces white powdery patches on leaves and young shoots, causing leaf curling and reduced vigor.",
        "organic_treatment": "Apply sulfur or potassium bicarbonate sprays. Prune for good air circulation. Neem oil can help prevent early infections.",
        "chemical_treatment": "Apply Myclobutanil or Trifloxystrobin at first sign of disease. Begin applications when conditions favor disease (warm, humid)."
    },
    "Peach___Bacterial_spot": {
        "description": "Bacterial spot on peach is caused by Xanthomonas arboricola pv. pruni, causing dark spots on leaves and pitted fruit lesions.",
        "organic_treatment": "Use copper sprays during dormant season. Select resistant varieties. Avoid overhead irrigation. Remove severely infected branches.",
        "chemical_treatment": "Apply Oxytetracycline during bloom and early fruit development. Copper hydroxide during dormant season. Rotate antibiotics to prevent resistance."
    },
    "Pepper,_bell___Bacterial_spot": {
        "description": "Bacterial spot on bell pepper is caused by Xanthomonas species, producing small water-soaked spots on leaves and raised scab-like spots on fruit.",
        "organic_treatment": "Use copper-based sprays. Plant disease-free transplants. Practice crop rotation. Remove and destroy infected plant debris.",
        "chemical_treatment": "Apply copper hydroxide + Mancozeb combination. Use Acibenzolar-S-methyl (Actigard) as a plant defense activator. Rotate with non-solanaceous crops."
    },
    "Squash___Powdery_mildew": {
        "description": "Powdery mildew on squash produces white powdery coating on leaf surfaces, reducing photosynthesis and yield.",
        "organic_treatment": "Apply milk spray (40% milk to water), neem oil, or potassium bicarbonate. Ensure adequate spacing. Plant resistant varieties.",
        "chemical_treatment": "Apply Myclobutanil or Chlorothalonil at first sign. Sulfur-based products are effective preventatively. Rotate fungicide groups."
    },
    "Strawberry___Leaf_scorch": {
        "description": "Leaf scorch is caused by Diplocarpon earlianum, producing small dark purple spots that enlarge and cause leaves to appear scorched.",
        "organic_treatment": "Remove infected leaves. Improve air circulation by thinning plants. Apply copper-based fungicide. Renovate beds after harvest.",
        "chemical_treatment": "Apply Captan or Myclobutanil from bloom through harvest. Maintain spray schedule during wet conditions."
    },
    "Orange___Haunglongbing_(Citrus_greening)": {
        "description": "Citrus greening (Huanglongbing/HLB) is caused by Candidatus Liberibacter, transmitted by Asian citrus psyllid. Causes mottled yellowing and bitter, lopsided fruit.",
        "organic_treatment": "Control psyllid vectors with neem oil and kaolin clay. Remove severely infected trees. Use certified disease-free nursery stock.",
        "chemical_treatment": "Apply systemic insecticides (Imidacloprid) to control psyllid vectors. No cure for HLB exists — focus on vector control and removing infected trees."
    },
}

# Generic fallback for any class not in the lookup (including healthy)
DEFAULT_FALLBACK = {
    "description": "The uploaded leaf was analyzed by our locally trained computer vision model.",
    "organic_treatment": "Maintain good agricultural practices: crop rotation, proper spacing, adequate watering, and organic compost application.",
    "chemical_treatment": "No specific chemical treatment recommended. Monitor the crop regularly and consult a local agronomist if symptoms worsen."
}


class VisionService:
    def __init__(self):
        # ── Groq LLM (lazy — may be None if key is missing) ──
        self.llm = None
        try:
            groq_key = os.environ.get("GROQ_API_KEY")
            if groq_key:
                from langchain_groq import ChatGroq
                from langchain_core.messages import HumanMessage
                self.llm = ChatGroq(
                    api_key=groq_key,
                    model_name="openai/gpt-oss-20b",
                    temperature=0.2,
                )
                logger.info("Groq LLM initialized successfully.")
            else:
                logger.warning("GROQ_API_KEY not set — will use local fallback for treatment advice.")
        except Exception as e:
            logger.warning(f"Could not initialise Groq LLM (will use fallback): {e}")

        # ── Local PyTorch CV Model ──
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.class_names = []

        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            weights_path = os.path.join(base_dir, "model", "weights", "mobilenet_v2_disease.pth")
            classes_path = os.path.join(base_dir, "model", "weights", "class_names.txt")

            if os.path.exists(weights_path) and os.path.exists(classes_path):
                with open(classes_path, 'r') as f:
                    self.class_names = [line.strip() for line in f.readlines() if line.strip()]

                self.model = models.mobilenet_v2(pretrained=False)
                num_ftrs = self.model.classifier[1].in_features

                # Try loading with new architecture (Dropout + Linear) first,
                # fall back to old architecture (just replacing Linear)
                try:
                    self.model.classifier = nn.Sequential(
                        nn.Dropout(0.3),
                        nn.Linear(num_ftrs, len(self.class_names))
                    )
                    self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
                    logger.info("Loaded model with new classifier architecture (Dropout+Linear).")
                except RuntimeError:
                    # Fall back to old architecture
                    self.model = models.mobilenet_v2(pretrained=False)
                    num_ftrs = self.model.classifier[1].in_features
                    self.model.classifier[1] = nn.Linear(num_ftrs, len(self.class_names))
                    self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
                    logger.info("Loaded model with old classifier architecture (Linear).")
                self.model = self.model.to(self.device)
                self.model.eval()

                self.transform = transforms.Compose([
                    transforms.Resize(256),
                    transforms.CenterCrop(224),
                    transforms.ToTensor(),
                    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
                ])
                logger.info(f"Local CV model loaded — {len(self.class_names)} classes, device={self.device}")
            else:
                logger.warning(f"Local CV model weights not found at {weights_path}. Run model/train.py first.")
        except Exception as e:
            logger.error(f"Error loading local CV model: {e}")

        # ── ImageNet Pre-Filter Model ──────────────────────────────────────────
        # A stock ImageNet MobileNetV2 used purely as a plant/leaf gatekeeper.
        # It never sees disease-specific weights — only used to decide whether
        # the input image is plant-like at all before the disease model runs.
        self.imagenet_model = None
        self.imagenet_classes = None
        try:
            import torchvision
            # Load ImageNet class labels bundled with torchvision
            # (available in torchvision >= 0.13 via built-in weights API)
            try:
                weights = models.MobileNet_V2_Weights.IMAGENET1K_V1
                self.imagenet_model = models.mobilenet_v2(weights=weights)
                self.imagenet_classes = weights.meta["categories"]
                logger.info("ImageNet pre-filter loaded via new weights API.")
            except AttributeError:
                # Older torchvision — fall back to pretrained=True
                self.imagenet_model = models.mobilenet_v2(pretrained=True)
                # Fetch class labels from the standard torchvision URL
                import urllib.request
                import json as _json
                _labels_url = (
                    "https://raw.githubusercontent.com/anishathalye/imagenet-simple-labels"
                    "/master/imagenet-simple-labels.json"
                )
                try:
                    with urllib.request.urlopen(_labels_url, timeout=5) as resp:
                        self.imagenet_classes = _json.loads(resp.read().decode())
                    logger.info("ImageNet labels fetched from remote URL.")
                except Exception:
                    # Ultimate fallback: use numeric indices (pre-filter disabled)
                    self.imagenet_classes = None
                    logger.warning(
                        "Could not fetch ImageNet labels — plant pre-filter will be disabled."
                    )

            if self.imagenet_model is not None:
                self.imagenet_model = self.imagenet_model.to(self.device)
                self.imagenet_model.eval()
                logger.info("ImageNet pre-filter model ready on device=%s", self.device)
        except Exception as e:
            logger.warning(f"Could not load ImageNet pre-filter model: {e}. Pre-filter disabled.")
            self.imagenet_model = None
            self.imagenet_classes = None

    # ──────────────────────────────────────────────────────────────────────────
    # Step 0 — ImageNet Plant Pre-Filter
    # ──────────────────────────────────────────────────────────────────────────
    def _is_plant_image(self, image: Image.Image) -> bool:
        """Return True only if the image looks plant-like according to ImageNet.

        Uses a stock ImageNet-pretrained MobileNetV2 to scan the top-K predicted
        class labels for plant-related keywords.  This gating step happens *before*
        the closed-set disease classifier so that overconfident softmax scores on
        non-plant images never reach the user.

        If the pre-filter model is unavailable (failed to load), this method
        returns True (i.e. it fails open, letting the existing OOD checks decide).
        """
        if self.imagenet_model is None or self.imagenet_classes is None:
            # Pre-filter not available — fail open, let downstream checks decide.
            logger.debug("[PreFilter] ImageNet model unavailable — skipping pre-filter.")
            return True

        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.imagenet_model(input_tensor)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)

        # Grab top-K class indices
        topk_probs, topk_indices = torch.topk(probabilities, IMAGENET_TOPK)
        topk_labels = [
            self.imagenet_classes[idx.item()].lower()
            for idx in topk_indices
        ]

        logger.debug(f"[PreFilter] Top-{IMAGENET_TOPK} ImageNet labels: {topk_labels}")

        # Check whether any plant keyword appears in any of the top labels
        for label in topk_labels:
            for keyword in PLANT_KEYWORDS:
                if keyword in label:
                    logger.info(
                        f"[PreFilter] Plant keyword '{keyword}' found in ImageNet label '{label}' — PASS."
                    )
                    return True

        print(
            "\n"
            "╔══════════════════════════════════════════════════════════╗\n"
            "║  ✗  NOT A PLANT IMAGE — REQUEST REJECTED                 ║\n"
            "╠══════════════════════════════════════════════════════════╣\n"
           f"║  Top-{IMAGENET_TOPK} ImageNet labels: {', '.join(topk_labels):<34}║\n"
            "║  None matched any plant keyword.                         ║\n"
            "║  Returning 422 to client.                                ║\n"
            "╚══════════════════════════════════════════════════════════╝"
        )
        logger.warning(
            f"[PreFilter] No plant keyword found in top-{IMAGENET_TOPK} ImageNet labels: {topk_labels} — REJECT."
        )
        return False

    # ──────────────────────────────────────────────────────────────────────────
    # Step 1 — Local CV classification
    # ──────────────────────────────────────────────────────────────────────────
    def _predict_local(self, base64_image: str) -> tuple:
        """Run the local MobileNetV2 model. Returns (class_name, confidence%).

        Raises ValueError if the image is detected as out-of-distribution
        (i.e. not a plant leaf) using three signals (applied in order):
          0. ImageNet pre-filter: top-K labels contain no plant keyword.
          1. Max softmax probability below MIN_CONFIDENCE_THRESHOLD.
          2. Normalised prediction entropy above MAX_NORMALISED_ENTROPY.
        """
        if self.model is None:
            raise RuntimeError("Local CV model is not loaded. Train it first with model/train.py")

        image_data = base64.b64decode(
            base64_image.split(',')[1] if ',' in base64_image else base64_image
        )
        image = Image.open(BytesIO(image_data)).convert('RGB')

        # ── OOD Check 0: ImageNet pre-filter (PRIMARY gate) ───────────────────
        # This is the most reliable check. A stock ImageNet model has seen
        # 1000 diverse classes — if none of the top-K predictions are plant-
        # related, the image is almost certainly not a leaf.
        if not self._is_plant_image(image):
            raise ValueError(
                "The uploaded image does not appear to be a plant or leaf. "
                "Please upload a clear photo of a plant leaf for disease analysis."
            )

        input_tensor = self.transform(image)
        input_batch = input_tensor.unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(input_batch)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)

        confidence_val = round(confidence.item() * 100, 2)

        # ── OOD Check 1: Max-probability threshold ────────────────────────────
        if confidence_val < MIN_CONFIDENCE_THRESHOLD:
            print(
                "\n"
                "╔══════════════════════════════════════════════════════════╗\n"
                "║  ✗  LOW CONFIDENCE — REQUEST REJECTED                    ║\n"
                "╠══════════════════════════════════════════════════════════╣\n"
               f"║  Confidence : {confidence_val:>5.1f}%  (threshold: {MIN_CONFIDENCE_THRESHOLD:.0f}%)                 ║\n"
                "║  The model is not sure enough — likely not a leaf.       ║\n"
                "║  Returning 422 to client.                                ║\n"
                "╚══════════════════════════════════════════════════════════╝"
            )
            logger.warning(
                f"[OOD] Rejected — max confidence {confidence_val:.1f}% "
                f"is below threshold {MIN_CONFIDENCE_THRESHOLD}%. Likely not a plant leaf."
            )
            raise ValueError(
                f"The uploaded image does not appear to be a plant leaf "
                f"(confidence too low: {confidence_val:.1f}%). "
                "Please upload a clear photo of a plant leaf."
            )

        # ── OOD Check 2: Entropy of probability distribution ─────────────────
        # High entropy → model is uniformly uncertain → random/irrelevant image.
        probs_np = probabilities.cpu().numpy()
        entropy = -sum(p * math.log(p + 1e-12) for p in probs_np)
        max_entropy = math.log(len(self.class_names))  # worst-case entropy
        normalised_entropy = entropy / max_entropy if max_entropy > 0 else 0

        if normalised_entropy > MAX_NORMALISED_ENTROPY:
            print(
                "\n"
                "╔══════════════════════════════════════════════════════════╗\n"
                "║  ✗  HIGH ENTROPY — REQUEST REJECTED                      ║\n"
                "╠══════════════════════════════════════════════════════════╣\n"
               f"║  Entropy    : {normalised_entropy:>5.3f}  (threshold: {MAX_NORMALISED_ENTROPY:.2f})              ║\n"
               f"║  Confidence : {confidence_val:>5.1f}%                                    ║\n"
                "║  Model is uniformly uncertain — likely not a leaf.       ║\n"
                "║  Returning 422 to client.                                ║\n"
                "╚══════════════════════════════════════════════════════════╝"
            )
            logger.warning(
                f"[OOD] Rejected — normalised entropy {normalised_entropy:.3f} "
                f"exceeds threshold {MAX_NORMALISED_ENTROPY}. Likely not a plant leaf."
            )
            raise ValueError(
                f"The uploaded image does not appear to be a plant leaf "
                f"(prediction too uncertain: entropy={normalised_entropy:.2f}). "
                "Please upload a clear photo of a plant leaf."
            )

        predicted_class = self.class_names[predicted_idx.item()]
        display_name = predicted_class.replace("___", " — ").replace("_", " ")
        print(
            "\n"
            "╔══════════════════════════════════════════════════════════╗\n"
            "║  ✔  PLANT IMAGE ACCEPTED — DISEASE DETECTED              ║\n"
            "╠══════════════════════════════════════════════════════════╣\n"
           f"║  Disease    : {display_name:<44}║\n"
           f"║  Confidence : {confidence_val:>5.1f}%                                    ║\n"
           f"║  Entropy    : {normalised_entropy:>5.3f}  (lower = more certain)          ║\n"
            "╚══════════════════════════════════════════════════════════╝"
        )
        logger.info(
            f"[Local CV] Prediction: {predicted_class} ({confidence_val}%) "
            f"| entropy={normalised_entropy:.3f}"
        )
        return predicted_class, confidence_val

    # ──────────────────────────────────────────────────────────────────────────
    # Step 2a — Groq treatment explanation (may fail)
    # ──────────────────────────────────────────────────────────────────────────
    def _get_groq_treatment(self, predicted_class: str, confidence_val: float, crop_type: str) -> dict | None:
        """Ask Groq for treatment advice. Returns parsed dict or None on failure."""
        if self.llm is None:
            logger.info("[Groq] LLM not available — skipping.")
            return None

        try:
            from langchain_core.messages import HumanMessage

            prompt = (
                f"You are an expert agronomist. A computer vision model has diagnosed a {crop_type} plant "
                f"with the following condition: '{predicted_class}'. "
                "Provide organic and chemical treatment advice for this specific disease. "
                "Your response MUST be ONLY a raw, valid JSON object, without any markdown formatting or code blocks. "
                "Do not wrap the JSON in ```json...```. Output strictly the following JSON structure: "
                '{"disease_name": "...", "confidence": ' + str(confidence_val) +
                ', "organic_treatment": "...", "chemical_treatment": "...", "description": "..."}'
            )

            message = HumanMessage(content=[{"type": "text", "text": prompt}])

            print("\n[GenAI] --- Fetching treatments from Groq... ---")
            response = self.llm.invoke([message])
            content = response.content
            print("\n[GenAI] --- Finished! ---")

            # Parse the JSON out of the response
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                cleaned_content = content[start_idx:end_idx + 1]
            else:
                cleaned_content = content.strip()

            result = json.loads(cleaned_content)
            logger.info("[Groq] Treatment explanation generated successfully.")
            return result

        except Exception as e:
            logger.warning(f"[Groq] Failed to generate treatment — falling back to local knowledge base. Error: {e}")
            return None

    # ──────────────────────────────────────────────────────────────────────────
    # Step 2b — Local fallback treatment
    # ──────────────────────────────────────────────────────────────────────────
    def _get_fallback_treatment(self, predicted_class: str, confidence_val: float) -> dict:
        """Return treatment info from the built-in knowledge base."""
        entry = FALLBACK_TREATMENTS.get(predicted_class, DEFAULT_FALLBACK)

        # Pretty-format the disease name: "Tomato___Early_blight" → "Tomato — Early blight"
        display_name = predicted_class.replace("___", " — ").replace("_", " ")

        result = {
            "disease_name": display_name,
            "confidence": confidence_val,
            "description": entry["description"],
            "organic_treatment": entry["organic_treatment"],
            "chemical_treatment": entry["chemical_treatment"],
            "source": "local_fallback"
        }
        logger.info(f"[Fallback] Using built-in treatment for '{predicted_class}'")
        return result

    # ──────────────────────────────────────────────────────────────────────────
    # Public API — called by disease/views.py
    # ──────────────────────────────────────────────────────────────────────────
    def analyze_disease_fast(self, base64_image: str, crop_type: str = "Unknown/Other") -> dict:
        """
        STAGE 1 — Fast path (always returns in ~1-2 seconds).

        Runs the local CV model + local knowledge-base treatment.
        Never calls Groq — so it is always fast.

        Returns a dict that includes:
          - All standard result fields (disease_name, confidence, description, treatments)
          - 'predicted_class': raw class key (used by the enhance endpoint)
          - 'groq_enhanced': False  (signals to the frontend that Groq hasn't run yet)
        """
        try:
            predicted_class, confidence_val = self._predict_local(base64_image)
            result = self._get_fallback_treatment(predicted_class, confidence_val)
            # Pass raw class key so the enhance endpoint can use it without re-running the model
            result['predicted_class'] = predicted_class
            result['groq_enhanced'] = False
            return result
        except ValueError as ve:
            logger.warning(f"[Vision] Invalid image rejected: {ve}")
            return {'error': str(ve), 'error_type': 'invalid_image'}
        except Exception as e:
            logger.error(f"Vision Service Error (fast path): {e}", exc_info=True)
            return {'error': str(e), 'error_type': 'server_error'}

    def enhance_with_groq(self, predicted_class: str, confidence_val: float, crop_type: str = "Unknown/Other") -> dict:
        """
        STAGE 2 — Groq enhancement (called separately by the enhance endpoint).

        Takes the already-computed predicted_class + confidence from Stage 1
        and asks Groq for a richer treatment explanation.
        Falls back to the local KB if Groq is unavailable or times out.
        """
        try:
            result = self._get_groq_treatment(predicted_class, confidence_val, crop_type)
            if result is not None:
                result['disease_name'] = predicted_class.replace('___', ' — ').replace('_', ' ')
                result['confidence'] = confidence_val
                result['source'] = 'groq_api'
                result['groq_enhanced'] = True
            else:
                result = self._get_fallback_treatment(predicted_class, confidence_val)
                result['groq_enhanced'] = False
            return result
        except Exception as e:
            logger.error(f"Vision Service Error (Groq enhance): {e}", exc_info=True)
            # Return local fallback so the frontend always gets something
            result = self._get_fallback_treatment(predicted_class, confidence_val)
            result['groq_enhanced'] = False
            return result

    # Keep the original method for backwards compatibility
    def analyze_disease(self, base64_image: str, crop_type: str = "Unknown/Other") -> dict:
        """
        Legacy single-call path (detect + Groq in one request).
        Prefer analyze_disease_fast() + enhance_with_groq() for better UX.
        """
        try:
            predicted_class, confidence_val = self._predict_local(base64_image)
            result = self._get_groq_treatment(predicted_class, confidence_val, crop_type)
            if result is not None:
                result['disease_name'] = predicted_class.replace('___', ' — ').replace('_', ' ')
                result['confidence'] = confidence_val
                result['source'] = 'groq_api'
                result['groq_enhanced'] = True
            else:
                result = self._get_fallback_treatment(predicted_class, confidence_val)
                result['groq_enhanced'] = False
            return result
        except ValueError as ve:
            logger.warning(f"[Vision] Invalid image rejected: {ve}")
            return {'error': str(ve), 'error_type': 'invalid_image'}
        except Exception as e:
            logger.error(f"Vision Service Error: {e}", exc_info=True)
            return {'error': str(e), 'error_type': 'server_error'}


vision_service = VisionService()
