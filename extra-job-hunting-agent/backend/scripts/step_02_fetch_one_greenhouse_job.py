import requests

board_token = "stripe"

url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs"

response = requests.get(url)
response.raise_for_status()

jobs = response.json()["jobs"]

first_job = jobs[0]

print(first_job)
