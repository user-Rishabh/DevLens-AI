import urllib.request
import urllib.error

url = "http://localhost:8000/api/repos/5870b3d97abd0114/onboarding-guide"
print(f"Fetching: {url}")
try:
    req = urllib.request.Request(
        url, 
        method="GET",
        headers={"Origin": "http://localhost:5173"}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        print(f"Status: {response.status}")
        print(f"Body: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(f"Error Body: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Other Error: {e}")
