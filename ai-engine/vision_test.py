import os
import base64
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

os.environ["GROQ_API_KEY"] = "[ENCRYPTION_KEY]"

# create a dummy white 1x1 pixel base64 image
dummy_img = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="

llm = ChatGroq(
    model_name="qwen/qwen3.6-27b",
    temperature=0.2,
)

message = HumanMessage(
    content=[
        {"type": "text", "text": "What is in this image?"},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{dummy_img}"}}
    ]
)

try:
    response = llm.invoke([message])
    print("Success:", response.content)
except Exception as e:
    print("Error:", str(e))
