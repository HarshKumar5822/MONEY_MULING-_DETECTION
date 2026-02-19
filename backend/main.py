import pandas as pd
import networkx as nx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import io
import time
from datetime import datetime, timedelta

app = FastAPI(
    title="Money Muling Detection Engine",
    description="Backend for RIFT 2026 Hackathon - Money Muling Detection Challenge",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Root Route ---
@app.get("/")
async def root():
    return {
        "message": "Money Muling Detection Engine API is running",
        "endpoints": {
            "analyze": "/analyze [POST]",
            "docs": "/docs [GET]"
        }
    }

# --- Pydantic Models for Response ---

class SuspiciousAccount(BaseModel):
    account_id: str
    suspicion_score: float
    detected_patterns: List[str]
    ring_id: Optional[str] = None

class FraudRing(BaseModel):
    ring_id: str
    member_accounts: List[str]
    pattern_type: str
    risk_score: float

class Summary(BaseModel):
    total_accounts_analyzed: int
    suspicious_accounts_flagged: int
    fraud_rings_detected: int
    processing_time_seconds: float

class AnalysisResponse(BaseModel):
    suspicious_accounts: List[SuspiciousAccount]
    fraud_rings: List[FraudRing]
    summary: Summary

# --- Graph & Analysis Logic ---

def build_graph(df: pd.DataFrame) -> nx.DiGraph:
    """Creates a directed graph from the transaction DataFrame."""
    G = nx.DiGraph()
    # Add edges with attributes
    for _, row in df.iterrows():
        G.add_edge(
            str(row['sender_id']), 
            str(row['receiver_id']), 
            transaction_id=str(row['transaction_id']),
            amount=float(row['amount']),
            timestamp=row['timestamp']
        )
    return G

def detect_cycles(G: nx.DiGraph) -> List[List[str]]:
    """Detects simple cycles of length 3, 4, and 5."""
    try:
        # strict limit on cycle length to 5 as per requirements to manage performance
        # recursive_simple_cycles is often faster for small cycles but let's stick to simple_cycles with filtering
        # Ideally, we would write a custom DFS for length limited cycles for very large graphs
        # For < 10k transactions, basic simple_cycles might be okay but can blow up if highly connected.
        # Let's use a slightly optimized approach: inspect cycles and filter.
        
        # Note: nx.simple_cycles generates all elementary cycles. 
        # In a dense graph, this is exponential. 
        # Requirement: "handle up to 10,000 transactions efficiently" and "Detect cycles of length 3, 4, and 5"
        
        cycles = []
        # optimization: compute only relevant cycles. 
        # Since networkx doesn't support length limit in simple_cycles directly effectively for all versions,
        # we will use a pragmatic approach: use simple_cycles but monitor time/count 
        # OR iteratively search. 
        # Given the contest constraints, let's try standard simple_cycles first but filter strictly.
        
        # A safer approach for "length 3-5" specifically is:
        # iterate all nodes, do DFS/BFS up to depth 5.
        
        # Using a custom generator to avoid generating all if not needed
        raw_cycles = nx.simple_cycles(G)
        
        # We need to be careful with "up to 10,000 transactions". 
        # If the graph is dense, simple_cycles will hang. 
        # Let's add a limit just in case, or use a more targeted search if needed.
        # For now, we trust the "money muling" graph is suspicious but not a complete clique.
        
        count = 0
        limit = 100000 # Safety break
        
        for cycle in raw_cycles:
            if 3 <= len(cycle) <= 5:
                cycles.append(cycle)
            
            count += 1
            if count > limit:
                break # Prevention of timeout
                
        return cycles
    except Exception as e:
        print(f"Cycle detection error: {e}")
        return []

def detect_smurfing(df: pd.DataFrame) -> Dict[str, List[str]]:
    """
    Detects Fan-in and Fan-out patterns with temporal analysis (72h window).
    Returns a dict of account_id -> list of patterns detected.
    """
    suspicious_patterns = {} # account_id -> [patterns]
    
    # Ensure timestamp is datetime
    if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
        df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Sort checks for efficient windowing
    df_sorted = df.sort_values('timestamp')

    # Fan-in: >10 unique senders to a receiver in 72h
    # Group by receiver
    for receiver, group in df_sorted.groupby('receiver_id'):
        # We need to count unique senders within any 72h window
        # Rolling window on time is tricky with pandas groupby directly for "unique count" efficiently
        # Let's iterate: for each transaction, look back 72h.
        
        # Optimization: use a sliding window approach
        # Create a list of (time, sender_id)
        txs = list(zip(group['timestamp'], group['sender_id']))
        
        # Sliding window
        left = 0
        unique_senders = {} # sender_id -> count in window
        
        for right in range(len(txs)):
            current_time = txs[right][0]
            current_sender = txs[right][1]
            
            # Add to window
            unique_senders[current_sender] = unique_senders.get(current_sender, 0) + 1
            
            # Shrink window from left
            while left < right and (current_time - txs[left][0] > timedelta(hours=72)):
                removed_sender = txs[left][1]
                unique_senders[removed_sender] -= 1
                if unique_senders[removed_sender] == 0:
                    del unique_senders[removed_sender]
                left += 1
            
            if len(unique_senders) > 10:
                receiver_str = str(receiver)
                if receiver_str not in suspicious_patterns:
                    suspicious_patterns[receiver_str] = []
                if "fan_in" not in suspicious_patterns[receiver_str]:
                    suspicious_patterns[receiver_str].append("fan_in")
                break # Flagged once is enough

    # Fan-out: >10 unique receivers from a sender in 72h
    # Group by sender
    for sender, group in df_sorted.groupby('sender_id'):
        txs = list(zip(group['timestamp'], group['receiver_id']))
        
        left = 0
        unique_receivers = {} 
        
        for right in range(len(txs)):
            current_time = txs[right][0]
            current_receiver = txs[right][1]
            
            unique_receivers[current_receiver] = unique_receivers.get(current_receiver, 0) + 1
            
            while left < right and (current_time - txs[left][0] > timedelta(hours=72)):
                removed_receiver = txs[left][1]
                unique_receivers[removed_receiver] -= 1
                if unique_receivers[removed_receiver] == 0:
                    del unique_receivers[removed_receiver]
                left += 1
            
            if len(unique_receivers) > 10:
                sender_str = str(sender)
                if sender_str not in suspicious_patterns:
                    suspicious_patterns[sender_str] = []
                if "fan_out" not in suspicious_patterns[sender_str]:
                    suspicious_patterns[sender_str].append("fan_out")
                break 

    return suspicious_patterns

def calculate_risk_score_ring(pattern_type: str, member_count: int) -> float:
    # Basic scoring logic for rings
    base_score = 80.0
    if pattern_type == "cycle":
        # shorter cycles are often more indicative of tight fraud, 
        # but 3-5 are all bad. Let's say score increases with length slightly? 
        # actually, usually tightness is riskier. Let's keep it simple.
        return min(100.0, base_score + (member_count * 2))
    return base_score

# --- Main Endpoint ---

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_transactions(file: UploadFile = File(...)):
    start_time = time.time()
    
    # 1. Read CSV
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Basic validation
        required_cols = {'transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'}
        if not required_cols.issubset(df.columns):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_cols}")
        
        # Create unique account list
        all_accounts = set(df['sender_id'].astype(str)).union(set(df['receiver_id'].astype(str)))
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

    # 2. Build Graph
    G = build_graph(df)
    
    # 3. Detect Cycles (Rings)
    cycles = detect_cycles(G)
    
    fraud_rings = []
    account_ring_map = {} # account_id -> ring_id
    
    for idx, cycle in enumerate(cycles):
        ring_id = f"RING_{idx+1:03d}"
        risk_score = calculate_risk_score_ring("cycle", len(cycle))
        
        fraud_rings.append(FraudRing(
            ring_id=ring_id,
            member_accounts=cycle,
            pattern_type="cycle",
            risk_score=risk_score
        ))
        
        for member in cycle:
            account_ring_map[member] = ring_id

    # 4. Detect Smurfing
    smurfing_patterns = detect_smurfing(df)
    
    # 5. Compile Suspicious Accounts
    suspicious_accounts = []
    
    for account in all_accounts:
        patterns = []
        score = 0.0
        
        # Check if in a ring
        in_ring = account in account_ring_map
        if in_ring:
            patterns.append(f"cycle_member")
            score += 50
        
        # Check smurfing
        if account in smurfing_patterns:
            patterns.extend(smurfing_patterns[account])
            if "fan_in" in smurfing_patterns[account]:
                score += 30
            if "fan_out" in smurfing_patterns[account]:
                score += 30
        
        # Add to list if suspicious
        if score > 0:
            # high velocity check (optional extra credit: simple count)
            # if df[(df['sender_id'] == account) | (df['receiver_id'] == account)].shape[0] > 50:
            #     patterns.append("high_velocity")
            #     score += 10
            
            # Cap score
            score = min(100.0, score)
            
            suspicious_accounts.append(SuspiciousAccount(
                account_id=account,
                suspicion_score=score,
                detected_patterns=patterns,
                ring_id=account_ring_map.get(account)
            ))
    
    # Sort suspicious accounts by score (descending)
    suspicious_accounts.sort(key=lambda x: x.suspicion_score, reverse=True)
    
    # 6. Final Summary
    processing_time = time.time() - start_time
    summary = Summary(
        total_accounts_analyzed=len(all_accounts),
        suspicious_accounts_flagged=len(suspicious_accounts),
        fraud_rings_detected=len(fraud_rings),
        processing_time_seconds=round(processing_time, 4)
    )
    
    return AnalysisResponse(
        suspicious_accounts=suspicious_accounts,
        fraud_rings=fraud_rings,
        summary=summary
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
