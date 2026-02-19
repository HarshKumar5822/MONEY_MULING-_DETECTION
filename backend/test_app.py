import requests
import json
import time

url = "http://127.0.0.1:8001/analyze"
files = {'file': open('test_data.csv', 'rb')}

try:
    print(f"Sending request to {url}...")
    start = time.time()
    response = requests.post(url, files=files)
    end = time.time()
    
    print(f"Status Code: {response.status_code}")
    print(f"Time Taken: {end - start:.4f}s")
    
    if response.status_code == 200:
        data = response.json()
        print("\n--- JSON Response ---")
        print(json.dumps(data, indent=2))
        
        # assertions
        assert data['summary']['suspicious_accounts_flagged'] > 0
        assert data['summary']['fraud_rings_detected'] > 0
        print("\n✅ Verification Successful: Suspicious accounts and rings detected.")
    else:
        print("\n❌ Request Failed")
        print(response.text)

except Exception as e:
    print(f"\n❌ Error: {e}")
finally:
    files['file'].close()
