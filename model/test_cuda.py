import torch

print("PyTorch version:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("Device name:", torch.cuda.get_device_name(0))
    print("Device count:", torch.cuda.device_count())
    x = torch.randn(1000, 1000, device='cuda')
    print("Tensor computation on GPU successful:", (x @ x).shape)
