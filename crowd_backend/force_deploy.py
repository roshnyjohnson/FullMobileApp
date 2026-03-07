import asyncio
from crowd_backend.main import _run_deploy_logic

def force_deploy():
    print("Forcing deployment for Event 3 (Engagemnet1)...")
    try:
        _run_deploy_logic(3)
        print("Success! Deployment list is generated.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    force_deploy()
