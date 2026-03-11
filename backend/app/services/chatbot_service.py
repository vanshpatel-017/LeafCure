"""
Chatbot service for LeafBot AI assistant
"""
import openai
import os
from typing import Dict, Any

class ChatbotService:
    def __init__(self):
        # Set OpenAI API key from environment variable
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
    async def get_response(self, user_message: str) -> Dict[str, Any]:
        """
        Get response from OpenAI ChatGPT with LeafBot personality
        """
        try:
            # Check if API key is available
            if not openai.api_key:
                return self._get_fallback_response(user_message)
            
            system_prompt = """You are LeafBot, an AI plant disease expert assistant for LeafCure platform. 

Your expertise includes:
- Plant disease identification and diagnosis
- Treatment recommendations (organic and chemical)
- Prevention strategies
- Plant care advice
- Photography tips for disease detection
- LeafCure platform usage help

LeafCure supports 14 plant species: Tomato, Apple, Potato, Corn, Grape, Cherry, Bell Pepper, Strawberry, Peach, Orange, Blueberry, Raspberry, Soybean, and Squash with 38+ disease detection capabilities.

Be helpful, professional, and knowledgeable. Always identify yourself as LeafBot when asked. Provide detailed, actionable advice while being conversational and friendly."""

            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return {
                "success": True,
                "message": response.choices[0].message.content.strip()
            }
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._get_fallback_response(user_message)
    
    def _get_fallback_response(self, user_message: str) -> Dict[str, Any]:
        """Fallback responses when OpenAI API is unavailable"""
        input_text = user_message.lower()
        
        if any(word in input_text for word in ['hello', 'hi', 'hey']):
            return {"success": True, "message": "Hello! I'm LeafBot, your AI plant disease expert. I can help you with plant health questions, disease identification, treatment advice, and using LeafCure effectively. What would you like to know?"}
        
        elif any(phrase in input_text for phrase in ['how are you', 'how do you feel']):
            return {"success": True, "message": "I'm doing great, thank you for asking! I'm here and ready to help you with any plant-related questions or concerns you might have. How can I assist you today?"}
        
        elif any(word in input_text for word in ['thank', 'thanks']):
            return {"success": True, "message": "You're very welcome! I'm always happy to help with plant health and disease questions. Feel free to ask me anything else you'd like to know."}
        
        elif any(word in input_text for word in ['bye', 'goodbye']):
            return {"success": True, "message": "Goodbye! It was great helping you today. Remember, I'm always here whenever you need plant disease advice or help with LeafCure. Take care of your plants! 🌱"}
        
        elif 'plant' in input_text and any(word in input_text for word in ['support', 'which', 'what']):
            return {"success": True, "message": "LeafCure supports disease detection for 14 plant species: Tomato, Apple, Potato, Corn, Grape, Cherry, Bell Pepper, Strawberry, Peach, Orange, Blueberry, Raspberry, Soybean, and Squash. We can detect 38+ different disease conditions across these plants. What plant are you working with?"}
        
        else:
            return {"success": True, "message": "I'm LeafBot, your plant disease expert! I can help with plant health questions, disease identification, treatment recommendations, prevention strategies, and LeafCure platform usage. What specific question can I help you with?"}