from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI # <-- NEW IMPORT

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Create the client with your secret key (NEW SYNTAX)
client = OpenAI(api_key="sk-YOUR_SECRET_API_KEY")

scraped_database = [
    {"model": "iPhone 13", "price": 400, "battery": "85%", "color": "Black"},
    {"model": "iPhone 14 Pro", "price": 650, "battery": "90%", "color": "Deep Purple"},
    {"model": "Galaxy S23", "price": 550, "battery": "93%", "color": "Phantom Black"}
]

class UserRequest(BaseModel):
    desired_model: str
    budget: int
    urgency: str

@app.post("/api/get_recommendation")
def get_recommendation(req: UserRequest):
    prompt = f"""
    User wants a {req.desired_model} with a budget of ${req.budget} (Urgency: {req.urgency}).
    
    Available scraped marketplace data:
    {scraped_database}
    
    1. Filter out suitable phones.
    2. Suggest a 'Smart Upgrade' if a better model fits their budget.
    3. Output a clear comparison, market context, and a definitive decision: BUY, WAIT, or SWITCH.
    """
    
    # 2. Use the client to make the request (NEW SYNTAX)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {"ai_verdict": response.choices[0].message.content}
