import ast
import json
import threading
import time
from typing import Any, Dict, List, Optional
import tiktoken
from jinja2 import Template
from litellm import model_cost
from pydantic import BaseModel
from rich import print as rprint

from docetl.utils import completion_cost, count_tokens

class LLMResult(BaseModel):
    response: Any
    total_cost: float
    validated: bool

class InvalidOutputError(Exception):
    """Custom exception raised when the LLM output is invalid or cannot be parsed."""
    def __init__(
        self,
        message: str,
        output: str,
        expected_schema: Dict[str, Any],
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, str]]] = None,
    ):
        self.message = message
        self.output = output
        self.expected_schema = expected_schema
        self.messages = messages
        self.tools = tools
        super().__init__(self.message)

    def __str__(self):
        return (
            f"{self.message}\n"
            f"Invalid output: {self.output}\n"
            f"Expected schema: {self.expected_schema}\n"
            f"Messages sent to LLM: {self.messages}\n"
            f"Tool calls generated by LLM: {self.tools}"
        )

def timeout(seconds):
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = [TimeoutError("Function call timed out")]

            def target():
                try:
                    result[0] = func(*args, **kwargs)
                except Exception as e:
                    result[0] = e

            thread = threading.Thread(target=target)
            thread.start()
            thread.join(seconds)
            if isinstance(result[0], Exception):
                raise result[0]
            return result[0]

        return wrapper
    return decorator

def truncate_messages(
    messages: List[Dict[str, str]], 
    model: str, 
    from_agent: bool = False
) -> List[Dict[str, str]]:
    """Truncate messages to fit within model's context length."""
    model_input_context_length = model_cost.get(model.split("/")[-1], {}).get(
        "max_input_tokens", 8192
    )
    total_tokens = sum(count_tokens(json.dumps(msg), model) for msg in messages)

    if total_tokens <= model_input_context_length - 100:
        return messages

    truncated_messages = messages.copy()
    longest_message = max(truncated_messages, key=lambda x: len(x["content"]))
    content = longest_message["content"]
    excess_tokens = total_tokens - model_input_context_length + 200

    try:
        encoder = tiktoken.encoding_for_model(model.split("/")[-1])
    except Exception:
        encoder = tiktoken.encoding_for_model("gpt-4o")
        
    encoded_content = encoder.encode(content)
    tokens_to_remove = min(len(encoded_content), excess_tokens)
    mid_point = len(encoded_content) // 2
    truncated_encoded = (
        encoded_content[: mid_point - tokens_to_remove // 2]
        + encoder.encode(f" ... [{tokens_to_remove} tokens truncated] ... ")
        + encoded_content[mid_point + tokens_to_remove // 2 :]
    )
    truncated_content = encoder.decode(truncated_encoded)
    total_tokens = len(encoded_content)

    warning_type = "User" if not from_agent else "Agent"
    rprint(
        f"[yellow]{warning_type} Warning:[/yellow] Cutting {tokens_to_remove} tokens from a prompt with {total_tokens} tokens..."
    )

    longest_message["content"] = truncated_content
    return truncated_messages 