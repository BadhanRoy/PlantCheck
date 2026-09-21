import base64
import io
import json
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from transformers import AutoImageProcessor, AutoModel, CLIPImageProcessor, CLIPVisionModel


class ConvBNReLU(nn.Sequential):
    def __init__(self, in_channels, out_channels, kernel_size, stride=1, padding=0, groups=1):
        super().__init__(
            nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding, groups=groups, bias=False),
            nn.BatchNorm2d(out_channels),
        )


class InvertedResidual(nn.Module):
    def __init__(self, input_channels, output_channels, stride):
        super().__init__()
        self.stride = stride
        branch_channels = output_channels // 2
        if stride == 2:
            self.branch1 = nn.Sequential(
                nn.Conv2d(input_channels, input_channels, 3, stride, 1, groups=input_channels, bias=False),
                nn.BatchNorm2d(input_channels),
                nn.Conv2d(input_channels, branch_channels, 1, bias=False),
                nn.BatchNorm2d(branch_channels),
            )
        else:
            self.branch1 = nn.Identity()
        input_branch_channels = input_channels if stride == 2 else branch_channels
        self.branch2 = nn.Sequential(
            nn.Conv2d(input_branch_channels, branch_channels, 1, bias=False),
            nn.BatchNorm2d(branch_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(branch_channels, branch_channels, 3, stride, 1, groups=branch_channels, bias=False),
            nn.BatchNorm2d(branch_channels),
            nn.Conv2d(branch_channels, branch_channels, 1, bias=False),
            nn.BatchNorm2d(branch_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        if self.stride == 1:
            first, second = x.chunk(2, dim=1)
            return channel_shuffle(torch.cat((first, self.branch2(second)), dim=1))
        return channel_shuffle(torch.cat((torch.relu(self.branch1(x)), self.branch2(x)), dim=1))


def channel_shuffle(x, groups=2):
    batch_size, channels, height, width = x.size()
    channels_per_group = channels // groups
    x = x.view(batch_size, groups, channels_per_group, height, width)
    x = x.transpose(1, 2).contiguous()
    return x.view(batch_size, channels, height, width)


class ShuffleNetV2(nn.Module):
    def __init__(self, num_classes=89):
        super().__init__()
        self.conv1 = ConvBNReLU(3, 24, 3, 2, 1)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        self.stage2 = self._make_stage(24, 116, 4)
        self.stage3 = self._make_stage(116, 232, 8)
        self.stage4 = self._make_stage(232, 464, 4)
        self.conv5 = ConvBNReLU(464, 1024, 1)
        self.fc = nn.Linear(1024, num_classes)

    @staticmethod
    def _make_stage(input_channels, output_channels, repeats):
        blocks = [InvertedResidual(input_channels, output_channels, 2)]
        blocks.extend(InvertedResidual(output_channels, output_channels, 1) for _ in range(repeats - 1))
        return nn.Sequential(*blocks)

    def features(self, x):
        x = self.conv1(x)
        x = torch.relu(x)
        x = self.maxpool(x)
        x = self.stage4(self.stage3(self.stage2(x)))
        x = self.conv5(x)
        x = torch.relu(x)
        return torch.flatten(torch.mean(x, dim=(2, 3)), 1)

    def forward(self, x):
        return self.fc(self.features(x))


class FusionHead(nn.Module):
    def __init__(self, in_dim, num_classes, K=8, tau=0.07, alpha=0.5):
        super().__init__()
        self.linear = nn.Linear(in_dim, num_classes)
        self.K = K
        self.tau = tau
        self.alpha = alpha
        self.register_buffer("prototypes", torch.zeros(num_classes, K, in_dim))

    def forward(self, x):
        linear_logits = self.linear(x)
        x_norm = F.normalize(x, dim=1)
        p_norm = F.normalize(self.prototypes, dim=2)
        sims = torch.einsum("bd,ckd->bck", x_norm, p_norm)
        proto_logits = sims.max(dim=2).values / self.tau
        return self.alpha * linear_logits + (1.0 - self.alpha) * proto_logits


@dataclass
class PlantDiseaseModel:
    model_path: Path
    class_indices_path: Path
    image_size: tuple[int, int] = (224, 224)
    minimum_confidence: float = 0.60
    minimum_luminance_std: float = 1.0

    def __post_init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.prototype_vectors = None
        self.prototype_classes = None
        self.prototype_alpha = 0.0
        self.prototype_temperature = 0.07
        self.class_labels = self._load_class_labels()
        self._fusion_backbone_names = []
        self._fusion_feature_dims = {}
        self._fusion_processors = {}
        self._fusion_backbones = {}
        self._checkpoint_kind = "legacy"
        self._load_lock = Lock()
        self._prediction_lock = Lock()

    def _load_class_labels(self) -> List[str]:
        with self.class_indices_path.open("r", encoding="utf-8") as file:
            class_indices = json.load(file)
        indexed_labels = sorted((int(index), label) for label, index in class_indices.items())
        if [index for index, _ in indexed_labels] != list(range(len(indexed_labels))):
            raise ValueError("Class indices must be contiguous and start at zero.")
        return [label for _, label in indexed_labels]

    def _load_fusion_backbones(self, checkpoint: Dict[str, Any]) -> None:
        backbone_names = checkpoint.get("backbones", ["dinov2_vitl14", "clip_vitl14"])
        hf_names = {
            "dinov2_vitl14": "facebook/dinov2-large",
            "clip_vitl14": "openai/clip-vit-large-patch14",
        }
        self._fusion_backbone_names = list(backbone_names)
        self._fusion_feature_dims = checkpoint.get("feature_dims", {
            "dinov2_vitl14": 1024,
            "clip_vitl14": 768,
        })
        self._fusion_processors = {}
        self._fusion_backbones = {}

        for name in self._fusion_backbone_names:
            if name == "dinov2_vitl14":
                processor = AutoImageProcessor.from_pretrained(hf_names[name])
                model = AutoModel.from_pretrained(hf_names[name])
            elif name == "clip_vitl14":
                processor = CLIPImageProcessor.from_pretrained(hf_names[name])
                model = CLIPVisionModel.from_pretrained(hf_names[name])
            else:
                raise ValueError(f"Unsupported fusion backbone: {name}")

            model = model.to(self.device).eval()
            for param in model.parameters():
                param.requires_grad = False
            self._fusion_processors[name] = processor
            self._fusion_backbones[name] = model

    def _fusion_features(self, image: Image.Image) -> torch.Tensor:
        if not self._fusion_backbones:
            raise RuntimeError("Fusion backbones were not initialized.")

        features = []
        for name in self._fusion_backbone_names:
            processor = self._fusion_processors[name]
            model = self._fusion_backbones[name]
            inputs = processor(images=[image], return_tensors="pt").to(self.device)
            with torch.no_grad():
                output = model(**inputs)
            if name == "dinov2_vitl14":
                feature = output.last_hidden_state[:, 0]
            else:
                feature = output.pooler_output if output.pooler_output is not None else output.last_hidden_state[:, 0]
            features.append(feature.float())
        return torch.cat(features, dim=1)

    def _get_model(self):
        if self.model is None:
            with self._load_lock:
                if self.model is None:
                    if not self.model_path.exists():
                        raise FileNotFoundError(self.model_path)
                    checkpoint = torch.load(self.model_path, map_location=self.device, weights_only=False)

                    if isinstance(checkpoint, dict) and "head_state" in checkpoint and "fusion_dim" in checkpoint:
                        self._checkpoint_kind = "fusion"
                        self._load_fusion_backbones(checkpoint)
                        head = FusionHead(
                            in_dim=int(checkpoint["fusion_dim"]),
                            num_classes=len(self.class_labels),
                            K=int(checkpoint.get("proto_k", 8)),
                            tau=float(checkpoint.get("proto_tau", 0.07)),
                            alpha=float(checkpoint.get("proto_alpha", 0.5)),
                        )
                        head.load_state_dict(checkpoint["head_state"])
                        self.model = {"head": head.to(self.device).eval()}
                        return self.model

                    self._checkpoint_kind = "legacy"
                    model = ShuffleNetV2(num_classes=len(self.class_labels))
                    state_dict = checkpoint.get("model_state_dict", checkpoint)
                    model.load_state_dict(state_dict)
                    if "prototype_vectors" in checkpoint and "prototype_classes" in checkpoint:
                        self.prototype_vectors = F.normalize(
                            torch.as_tensor(checkpoint["prototype_vectors"], dtype=torch.float32, device=self.device),
                            dim=1,
                        )
                        self.prototype_classes = torch.as_tensor(
                            checkpoint["prototype_classes"], dtype=torch.long, device=self.device
                        )
                        self.prototype_alpha = float(checkpoint.get("proto_alpha", 0.0))
                        self.prototype_temperature = float(checkpoint.get("proto_temp", 0.07))
                    model.to(self.device).eval()
                    self.model = model
        return self.model

    def _probabilities(self, model: ShuffleNetV2, input_tensor: torch.Tensor) -> torch.Tensor:
        features = model.features(input_tensor)
        probabilities = torch.softmax(model.fc(features), dim=1)
        if self.prototype_vectors is None or self.prototype_classes is None:
            return probabilities

        similarities = F.normalize(features, dim=1) @ self.prototype_vectors.T
        prototype_logits = torch.full(
            (features.shape[0], len(self.class_labels)),
            -1e9,
            device=self.device,
        )
        for prototype_index, class_index in enumerate(self.prototype_classes.tolist()):
            prototype_logits[:, class_index] = torch.maximum(
                prototype_logits[:, class_index], similarities[:, prototype_index]
            )
        prototype_probabilities = torch.softmax(
            prototype_logits / self.prototype_temperature, dim=1
        )
        return (1.0 - self.prototype_alpha) * probabilities + self.prototype_alpha * prototype_probabilities

    def _preprocess(self, image: Image.Image) -> torch.Tensor:
        resized = image.resize(self.image_size)
        array = np.asarray(resized, dtype=np.float32) / 255.0
        array = (
            (array - np.array([0.485, 0.456, 0.406], dtype=np.float32))
            / np.array([0.229, 0.224, 0.225], dtype=np.float32)
        ).astype(np.float32)
        return torch.from_numpy(array.transpose(2, 0, 1)).unsqueeze(0).to(self.device)

    def _has_visual_signal(self, image: Image.Image) -> bool:
        luminance = np.asarray(image.convert("L").resize(self.image_size), dtype=np.float32)
        if luminance.size == 0:
            return False

        std_value = float(luminance.std())
        mean_value = float(luminance.mean())

        # Reject only truly blank or near-uniform images. Many valid leaves are darker or lower
        # contrast than the original gate allowed, so a very small threshold should not block them.
        if std_value < 0.35:
            return False

        if std_value < 0.75 and (mean_value < 8.0 or mean_value > 247.0):
            return False

        return True

    def _treatment_for(self, label: str) -> Dict[str, Any]:
        normalized = label.lower()
        if normalized.endswith(" leaf"):
            condition_type = "healthy"
            summary = f"Healthy {label.rsplit(' ', 1)[0]} leaf. No disease detected."
            steps = [
                "Continue regular watering and fertilization appropriate for the crop.",
                "Monitor weekly for spots, discoloration, pests, or new symptoms.",
                "Maintain good air circulation and remove damaged leaves with clean tools.",
                "Confirm any persistent change with a local horticulture specialist.",
            ]
        else:
            condition_type = "fungal"
            if "bacterial" in normalized or "canker" in normalized or "greening" in normalized:
                condition_type = "bacterial"
            elif "virus" in normalized or "mosaic" in normalized or "leafroll" in normalized:
                condition_type = "viral"
            elif "rust" in normalized:
                condition_type = "rust"
            elif "mildew" in normalized:
                condition_type = "mildew"
            elif "blight" in normalized or "blast" in normalized:
                condition_type = "blight"
            elif "spot" in normalized or "tar" in normalized:
                condition_type = "spot"

            action_sets = {
                "fungal": [
                    "Remove and destroy infected leaves, fruit, and fallen debris.",
                    "Improve air circulation and avoid overhead watering.",
                    "Rotate crops and use disease-resistant varieties where available.",
                    "Use a locally approved fungicide only according to its product label.",
                ],
                "bacterial": [
                    "Remove and destroy infected tissue and disinfect tools between cuts.",
                    "Avoid handling plants while foliage is wet and avoid overhead watering.",
                    "Use certified disease-free seed or planting material and rotate crops.",
                    "Confirm the diagnosis locally before applying a bactericide.",
                ],
                "viral": [
                    "Isolate the plant and remove it if the diagnosis is confirmed.",
                    "Control likely insect vectors and remove nearby weed hosts.",
                    "Disinfect tools and hands; do not propagate from symptomatic plants.",
                    "Use certified virus-free and resistant planting material where available.",
                ],
                "rust": [
                    "Remove and destroy infected leaves and crop debris.",
                    "Improve air circulation and avoid overhead irrigation.",
                    "Monitor nearby alternate hosts and rotate crops where practical.",
                    "Use an approved rust fungicide according to its product label.",
                ],
                "mildew": [
                    "Remove severely infected leaves and improve spacing and airflow.",
                    "Keep foliage dry and water at the soil level.",
                    "Reduce humidity and avoid excess nitrogen fertilization.",
                    "Use an approved mildew treatment according to its product label.",
                ],
                "blight": [
                    "Isolate the plant and remove visibly infected leaves and debris.",
                    "Avoid overhead watering and sanitize tools after handling the plant.",
                    "Improve air circulation and rotate crops when possible.",
                    "Confirm the diagnosis before applying a fungicide, especially for late blight.",
                ],
                "spot": [
                    "Remove infected leaves and destroy crop debris after harvest.",
                    "Avoid overhead watering and mulch to reduce soil splash.",
                    "Improve air circulation and rotate crops where practical.",
                    "Use an approved spot-treatment fungicide according to its product label.",
                ],
            }
            steps = action_sets[condition_type]
            summary = f"{label.title()} is a {condition_type} condition requiring closer inspection and prompt care."

        return {
            "type": condition_type,
            "summary": summary,
            "actions": steps,
            "steps": steps,
            "caution": "Treatment depends on the crop and local regulations. Follow product labels and seek expert confirmation.",
        }

    def _gradcam_data_url(self, model: ShuffleNetV2, input_tensor: torch.Tensor, class_index: int, image: Image.Image) -> str:
        activations = None
        gradients = None
        target_layer = model.conv5

        def save_activation(_module, _inputs, output):
            nonlocal activations
            activations = output.detach()

        def save_gradient(_module, _grad_input, grad_output):
            nonlocal gradients
            gradients = grad_output[0].detach()

        forward_handle = target_layer.register_forward_hook(save_activation)
        backward_handle = target_layer.register_full_backward_hook(save_gradient)
        try:
            model.zero_grad(set_to_none=True)
            output = model(input_tensor)
            output[0, class_index].backward()
            if activations is None or gradients is None:
                raise RuntimeError("Grad-CAM hooks did not receive model activations.")
            weights = gradients.mean(dim=(2, 3), keepdim=True)
            cam = torch.relu((weights * activations).sum(dim=1, keepdim=True))
            cam = torch.nn.functional.interpolate(cam, size=self.image_size, mode="bilinear", align_corners=False)
            cam = cam[0, 0].cpu().numpy()
            cam -= cam.min()
            if cam.max() > 0:
                cam /= cam.max()

            heatmap = np.stack(
                [
                    np.clip(1.5 - np.abs(4.0 * cam - 3.0), 0.0, 1.0),
                    np.clip(1.5 - np.abs(4.0 * cam - 2.0), 0.0, 1.0),
                    np.clip(1.5 - np.abs(4.0 * cam - 1.0), 0.0, 1.0),
                ],
                axis=-1,
            )
            heatmap_image = Image.fromarray(np.uint8(np.clip(heatmap, 0, 1) * 255), mode="RGB")
            base_image = image.resize(self.image_size).convert("RGB")
            overlay = Image.blend(base_image, heatmap_image, alpha=0.45)
            buffer = io.BytesIO()
            overlay.save(buffer, format="JPEG", quality=88)
            encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
            return f"data:image/jpeg;base64,{encoded}"
        finally:
            forward_handle.remove()
            backward_handle.remove()

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        supported = self._has_visual_signal(image)
        if not supported:
            return {
                "label": "Unsupported image",
                "confidence": 0.0,
                "class_index": None,
                "alternatives": [],
                "supported": False,
                "reason": "This image does not look sufficiently like one of the supported PlantWild leaf classes.",
                "model": "Fusion-DINOv2-CLIP",
            }

        model = self._get_model()
        if self._checkpoint_kind == "fusion":
            head = model["head"]
            with torch.no_grad():
                fused = self._fusion_features(image)
                logits = head(fused)
                probabilities = torch.softmax(logits, dim=1)[0]
            top_index = int(torch.argmax(probabilities).item())
            top_count = min(3, len(self.class_labels))
            top_probabilities, top_indices = torch.topk(probabilities, k=top_count)
            confidence = float(probabilities[top_index].item())
            return {
                "label": self.class_labels[top_index],
                "confidence": round(confidence * 100, 2),
                "class_index": top_index,
                "alternatives": [
                    {
                        "label": self.class_labels[int(index)],
                        "confidence": round(float(probability) * 100, 2),
                        "class_index": int(index),
                    }
                    for probability, index in zip(top_probabilities.tolist(), top_indices.tolist())
                ],
                "supported": True,
                "model": "Fusion-DINOv2-CLIP",
                "explainability": {
                    "method": "fusion-head",
                    "heatmap": None,
                    "target": "Fusion model attention is embedded in the learned prototype head.",
                    "note": "The final checkpoint is a frozen feature fusion model with a prototype-based head.",
                },
                "treatment": self._treatment_for(self.class_labels[top_index]),
            }

        input_tensor = self._preprocess(image)
        with self._prediction_lock:
            with torch.no_grad():
                probabilities = self._probabilities(model, input_tensor)[0]
        top_index = int(torch.argmax(probabilities).item())
        top_count = min(3, len(self.class_labels))
        top_probabilities, top_indices = torch.topk(probabilities, k=top_count)
        confidence = float(probabilities[top_index].item())

        with self._prediction_lock:
            gradcam = self._gradcam_data_url(model, input_tensor, top_index, image)

        return {
            "label": self.class_labels[top_index],
            "confidence": round(confidence * 100, 2),
            "class_index": top_index,
            "alternatives": [
                {
                    "label": self.class_labels[int(index)],
                    "confidence": round(float(probability) * 100, 2),
                    "class_index": int(index),
                }
                for probability, index in zip(top_probabilities.tolist(), top_indices.tolist())
            ],
            "supported": True,
            "model": "ShuffleNetV2-DINOv2",
            "explainability": {
                "method": "Grad-CAM",
                "heatmap": gradcam,
                "target": "Highlighted regions show areas that contributed most to this prediction.",
                "note": "This visualization explains model attention; it does not prove that the highlighted area caused the disease.",
            },
            "treatment": self._treatment_for(self.class_labels[top_index]),
        }
