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
    ring_id: str = ""

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

def detect_cycles(G: nx.DiGraph, max_len: int = 5) -> List[List[str]]:
    """
    Detects cycles of length 3 to max_len using a depth-limited DFS.
    This is significantly faster than nx.simple_cycles for large sparse graphs
    when we only care about small cycles.
    """
    cycles = []
    nodes = list(G.nodes())
    
    # Pre-filter: only nodes with in-degree > 0 and out-degree > 0 can be in a cycle
    potential_nodes = [n for n in nodes if G.in_degree(n) > 0 and G.out_degree(n) > 0]
    subgraph = G.subgraph(potential_nodes)
    
    def dfs(v, start_node, path, depth):
        if depth > max_len:
            return
        
        for neighbor in subgraph.neighbors(v):
            if neighbor == start_node:
                if len(path) >= 3:
                    # Found a cycle! Sort to avoid duplicates (different start points)
                    cycle = path[:]
                    # To ensure uniqueness, we only add if start_node is the smallest ID
                    # or use a canonical representation
                    if start_node == min(cycle):
                        cycles.append((cycle, f"cycle_length_{len(cycle)}"))
            elif neighbor not in path:
                # Limit depth search
                if depth < max_len:
                    path.append(neighbor)
                    dfs(neighbor, start_node, path, depth + 1)
                    path.pop()

    for i, node in enumerate(potential_nodes):
        dfs(node, node, [node], 1)
        
    return cycles

def detect_smurfing(df: pd.DataFrame) -> Dict[str, List[str]]:
    """
    Optimized Smurfing Detection with 72h window.
    """
    suspicious_patterns = {} # account_id -> [patterns]
    
    if df.empty:
        return suspicious_patterns

    if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
        df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Fan-in Detection (Optimized)
    # Group by receiver and process each efficiently
    for receiver, group in df.groupby('receiver_id'):
        if len(group) <= 10: continue # Basic hurdle
        
        txs = group.sort_values('timestamp')[['timestamp', 'sender_id']].values
        left = 0
        window_senders = {}
        
        for right in range(len(txs)):
            curr_time, curr_sender = txs[right]
            window_senders[curr_sender] = window_senders.get(curr_sender, 0) + 1
            
            while curr_time - txs[left][0] > pd.Timedelta(hours=72):
                prev_sender = txs[left][1]
                window_senders[prev_sender] -= 1
                if window_senders[prev_sender] == 0:
                    del window_senders[prev_sender]
                left += 1
                
            if len(window_senders) > 10:
                rec_id = str(receiver)
                if rec_id not in suspicious_patterns: suspicious_patterns[rec_id] = []
                suspicious_patterns[rec_id].append("smurfing_fan_in")
                break

    # Fan-out Detection (Optimized)
    for sender, group in df.groupby('sender_id'):
        if len(group) <= 10: continue
        
        txs = group.sort_values('timestamp')[['timestamp', 'receiver_id']].values
        left = 0
        window_receivers = {}
        
        for right in range(len(txs)):
            curr_time, curr_rec = txs[right]
            window_receivers[curr_rec] = window_receivers.get(curr_rec, 0) + 1
            
            while curr_time - txs[left][0] > pd.Timedelta(hours=72):
                prev_rec = txs[left][1]
                window_receivers[prev_rec] -= 1
                if window_receivers[prev_rec] == 0:
                    del window_receivers[prev_rec]
                left += 1
                
            if len(window_receivers) > 10:
                snd_id = str(sender)
                if snd_id not in suspicious_patterns: suspicious_patterns[snd_id] = []
                suspicious_patterns[snd_id].append("smurfing_fan_out")
                break

    return suspicious_patterns

def detect_shell_networks(G: nx.DiGraph) -> List[List[str]]:
    """
    Detects chains of 3+ hops where intermediate nodes are 'shells' 
    (low total transaction count: 2-3).
    """
    shells = []
    # Pre-calculate transaction counts for each node (in + out)
    tx_counts = {node: G.in_degree(node) + G.out_degree(node) for node in G.nodes()}
    
    # We look for simple paths of length 3 (4 nodes)
    # where the middle 2 nodes are shells.
    # For a path A -> B -> C -> D, B and C must have tx_count in [2, 3]
    
    potential_intermediates = [n for n, count in tx_counts.items() if 2 <= count <= 3]
    
    for node in potential_intermediates:
        # Node must have at least one incoming and one outgoing to be 'intermediate'
        if G.in_degree(node) >= 1 and G.out_degree(node) >= 1:
            for pred in G.predecessors(node):
                for succ in G.successors(node):
                    if succ == pred: continue
                    # Succ could be another intermediate shell
                    if succ in potential_intermediates:
                        for final_succ in G.successors(succ):
                            if final_succ in [pred, node]: continue
                            # Path found: pred -> node -> succ -> final_succ
                            shells.append([pred, node, succ, final_succ])
    
    return shells

def calculate_risk_score_ring(pattern_type: str, member_count: int) -> float:
    # Optimized scoring for RIFT 2026 specifications
    if pattern_type.startswith("cycle_length_"):
        return min(100.0, 85.0 + (member_count * 2))
    if pattern_type == "shell_network_chain":
        return min(100.0, 75.0 + (member_count * 3))
    return 70.0

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
    cycles_with_patterns = detect_cycles(G) # Now returns (cycle_list, pattern_string)
    
    # 3b. Detect Shell Networks
    shell_chains = detect_shell_networks(G)
    
    fraud_rings = []
    account_ring_map = {} # account_id -> (ring_id, pattern_type)
    
    # Process Cycles
    for idx, (cycle, pattern_str) in enumerate(cycles_with_patterns):
        ring_id = f"RING_{idx+1:03d}"
        risk_score = calculate_risk_score_ring(pattern_str, len(cycle))
        
        fraud_rings.append(FraudRing(
            ring_id=ring_id,
            member_accounts=cycle,
            pattern_type=pattern_str,
            risk_score=risk_score
        ))
        
        for member in cycle:
            account_ring_map[member] = (ring_id, pattern_str)

    # Process Shell Networks
    shell_offset = len(fraud_rings)
    for idx, chain in enumerate(shell_chains):
        ring_id = f"RING_SHELL_{idx+1+shell_offset:03d}"
        pattern_str = "shell_network_chain"
        risk_score = calculate_risk_score_ring(pattern_str, len(chain))
        
        fraud_rings.append(FraudRing(
            ring_id=ring_id,
            member_accounts=chain,
            pattern_type=pattern_str,
            risk_score=risk_score
        ))
        
        for member in chain:
            if member not in account_ring_map: # Prioritize cycle detection if an account is in both
                account_ring_map[member] = (ring_id, pattern_str)

    # 4. Detect Smurfing
    smurfing_patterns = detect_smurfing(df)
    
    # 5. Compile Suspicious Accounts
    suspicious_accounts = []
    
    for account in all_accounts:
        patterns = []
        score = 0.0
        
        # Check if in a ring
        if account in account_ring_map:
            ring_id, pattern = account_ring_map[account]
            patterns.append(pattern)
            score += 50
        
        # Check smurfing
        if account in smurfing_patterns:
            patterns.extend(smurfing_patterns[account])
            if "smurfing_fan_in" in smurfing_patterns[account]:
                score += 30
            if "smurfing_fan_out" in smurfing_patterns[account]:
                score += 30
        
        # Check shell network membership (not in cycle but in shell chain)
        if account in account_ring_map and account_ring_map[account][0].startswith("RING_SHELL"):
            # pattern already added above
            score += 40

        # Add to list if suspicious
        if score > 0:
            score = min(100.0, score)
            
            suspicious_accounts.append(SuspiciousAccount(
                account_id=account,
                suspicion_score=score,
                detected_patterns=list(set(patterns)), # Deduplicate
                ring_id=account_ring_map.get(account)[0] if account in account_ring_map else ""
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
