import os
import ctypes

torch_lib = r'C:\Users\Public\SIH\ai-engine\venv\Lib\site-packages\torch\lib'
os.add_dll_directory(torch_lib)

dlls = [
    'c10.dll',
    'torch_cpu.dll',
    'c10_cuda.dll',
    'cudart64_12.dll',
    'cublas64_12.dll',
    'cublasLt64_12.dll',
    'cudnn64_9.dll',
    'torch_cuda.dll',
    'torch.dll',
    'torch_python.dll'
]

for dll in dlls:
    path = os.path.join(torch_lib, dll)
    try:
        ctypes.CDLL(path)
        print(f"LOADED: {dll}")
    except Exception as e:
        print(f"FAILED {dll}: {e}")
