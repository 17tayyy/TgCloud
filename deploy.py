#!/usr/bin/env python3
"""
TgCloud Deploy & Manager
========================

Centralized deployment and management script for TgCloud.
Features:
- Automatic IP detection (public/private)
- Docker deployment
- Local development mode
- Complete service management
- Production-ready security

Usage: python deploy.py [command]

Commands:
  deploy              - Full production deployment
  dev                 - Local development mode (auto-installs dependencies)
  stop                - Stop all services
  logs                - View system logs
  clean               - Clean all containers and volumes
  status              - Show service status
  setup               - Reconfigure system
  install             - Install development dependencies only
  host <ip_or_domain> - Change host/IP configuration

Examples:
  python deploy.py deploy                    # Deploy with auto-detected IP
  python deploy.py dev                       # Development with dependency install
  python deploy.py install                   # Install dependencies only
  python deploy.py host 192.168.1.100       # Set specific IP
  python deploy.py host yourdomain.com       # Use domain name
"""

import os
import sys
import json
import socket
import subprocess
import time
import signal
from pathlib import Path
from threading import Thread
from typing import Dict, Optional, List

class TgCloudManager:
    def __init__(self):
        self.root = Path(__file__).parent
        self.env_file = self.root / ".env"
        self.compose_file = self.root / "docker-compose.yml"
        
        # Default configuration (production-ready and secure)
        self.default_config = {
            "API_ID": "",
            "API_HASH": "", 
            "CHAT_ID": "",
            "SECRET_KEY": self._generate_secret(),
            "HOST": self._detect_ip(),
            "API_PORT": "8000",
            "WEB_PORT": "80",
            "NODE_ENV": "production",
            "LOG_LEVEL": "INFO",
            "MAX_FILE_SIZE": "100MB",
            "SESSION_EXPIRE_HOURS": "24",
            "DB_PATH": "/app/data"
        }
    
    def _generate_secret(self) -> str:
        """Generate a secure secret key"""
        import secrets
        import string
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(50))
    
    def _detect_ip(self) -> str:
        """Automatically detect public IP address"""
        # Try to get public IP first
        try:
            import urllib.request
            response = urllib.request.urlopen('https://api.ipify.org', timeout=5)
            public_ip = response.read().decode('utf-8').strip()
            if public_ip and self._is_valid_ip(public_ip):
                return public_ip
        except:
            pass
        
        # Fallback to local IP detection
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                local_ip = s.getsockname()[0]
                return local_ip
        except:
            return "localhost"
    
    def _is_valid_ip(self, ip: str) -> bool:
        """Validate IP address format"""
        import re
        pattern = r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
        return bool(re.match(pattern, ip))
    
    def _run_cmd(self, cmd: str, sudo: bool = False) -> bool:
        """Execute command with error handling"""
        if sudo and not cmd.startswith("sudo"):
            cmd = f"sudo {cmd}"
        
        try:
            env = os.environ.copy()
            env.update(self._load_config())
            
            result = subprocess.run(cmd, shell=True, env=env, cwd=self.root)
            return result.returncode == 0
        except Exception as e:
            self._error(f"Error: {e}")
            return False
    
    def _load_config(self) -> Dict[str, str]:
        """Load configuration from .env file"""
        config = self.default_config.copy()
        
        if self.env_file.exists():
            with open(self.env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        config[key.strip()] = value.strip()
        
        return config
    
    def _save_config(self, config: Dict[str, str]):
        """Save configuration to .env file"""
        with open(self.env_file, 'w') as f:
            f.write("# TgCloud Configuration\n")
            f.write("# ===================\n\n")
            
            f.write("# Telegram API (REQUIRED)\n")
            f.write(f"API_ID={config['API_ID']}\n")
            f.write(f"API_HASH={config['API_HASH']}\n") 
            f.write(f"CHAT_ID={config['CHAT_ID']}\n\n")
            
            f.write("# Security\n")
            f.write(f"SECRET_KEY={config['SECRET_KEY']}\n\n")
            
            f.write("# Network\n")
            f.write(f"HOST={config['HOST']}\n")
            f.write(f"API_PORT={config['API_PORT']}\n")
            f.write(f"WEB_PORT={config['WEB_PORT']}\n")
            
            # Use correct protocol and port for frontend URL
            frontend_port = "" if config['WEB_PORT'] == "80" else f":{config['WEB_PORT']}"
            f.write(f"FRONTEND_URL=http://{config['HOST']}{frontend_port}\n\n")
            
            f.write("# Production\n")
            f.write(f"NODE_ENV={config['NODE_ENV']}\n")
            f.write(f"LOG_LEVEL={config['LOG_LEVEL']}\n")
            f.write(f"MAX_FILE_SIZE={config['MAX_FILE_SIZE']}\n")
            f.write(f"SESSION_EXPIRE_HOURS={config['SESSION_EXPIRE_HOURS']}\n")
    
    def _create_docker_compose(self, config: Dict[str, str]):
        """Generate optimized docker-compose.yml"""
        compose = f"""services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "{config['API_PORT']}:8000"
    env_file:
      - .env
    volumes:
      - backend_data:/app/data
    networks:
      - tgcloud
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL=http://{config['HOST']}:{config['API_PORT']}/api/v1
        - VITE_WS_BASE_URL=ws://{config['HOST']}:{config['API_PORT']}
    ports:
      - "{config['WEB_PORT']}:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - tgcloud
    restart: unless-stopped

networks:
  tgcloud:
    driver: bridge

volumes:
  backend_data:
"""
        
        with open(self.compose_file, 'w') as f:
            f.write(compose)
    
    def _check_docker(self) -> bool:
        """Verify Docker installation and permissions"""
        if not self._run_cmd("docker --version"):
            self._error("Docker is not installed")
            return False
            
        if not self._run_cmd("docker ps"):
            self._warning("Need Docker permissions, trying with sudo...")
            if not self._run_cmd("docker ps", sudo=True):
                self._error("No Docker permissions. Add user to docker group or use sudo")
                return False
            return "sudo"
        
        return True
    
    def _validate_telegram_config(self, config: Dict[str, str]) -> bool:
        """Validate Telegram configuration"""
        required = ["API_ID", "API_HASH", "CHAT_ID"]
        missing = [k for k in required if not config.get(k)]
        
        if missing:
            self._error(f"Missing Telegram configuration: {', '.join(missing)}")
            print("\nGet these credentials from:")
            print("   1. API_ID and API_HASH: https://my.telegram.org/apps")
            print("   2. CHAT_ID: Create a channel/group and use @userinfobot")
            print(f"\nEdit the file: {self.env_file}")
            return False
        
        return True
    
    def _success(self, msg: str): print(f"[SUCCESS] {msg}")
    def _info(self, msg: str): print(f"[INFO] {msg}")
    def _warning(self, msg: str): print(f"[WARNING] {msg}")
    def _error(self, msg: str): print(f"[ERROR] {msg}")
    def _header(self, msg: str): print(f"\n{msg}\n" + "="*50)

    def setup(self, force: bool = False) -> bool:
        """Initial configuration setup"""
        config = self._load_config()
        
        # First time or force reconfiguration
        if force or not self.env_file.exists():
            self._header("INITIAL CONFIGURATION")
            
            detected_ip = self._detect_ip()
            self._info(f"Auto-detected IP: {detected_ip}")
            
            # Check if it's a public IP
            if detected_ip.startswith(('192.168.', '10.', '172.')) or detected_ip == 'localhost':
                self._warning("Detected private/local IP address")
                print(f"""
IMPORTANT: Using IP {detected_ip}
This might cause issues if accessing from external networks.

Options:
1. Keep current IP for local/internal use
2. Manually set public IP in .env file: HOST=your.public.ip
3. Use domain name: HOST=yourdomain.com

For external access, edit .env and change HOST value.
""")
            else:
                self._success(f"Using public IP: {detected_ip}")
            
            config["HOST"] = detected_ip
            self._save_config(config)
            self._success("Configuration created")
            
            print(f"""
Configuration saved to: {self.env_file}
Edit this file to customize settings before deployment.
""")
        
        # Validate configuration
        if not self._validate_telegram_config(config):
            return False
        
        # Generate docker-compose
        self._create_docker_compose(config)
        self._success("Docker Compose generated")
        
        return True
    
    def deploy(self) -> bool:
        """Full production deployment"""
        self._header("PRODUCTION DEPLOYMENT")
        
        # Ensure production configuration
        config = self._load_config()
        config["WEB_PORT"] = "80"  # Force production port
        config["NODE_ENV"] = "production"
        self._save_config(config)
        
        # Automatic setup
        if not self.setup():
            return False
            return False
        
        # Verify Docker
        docker_sudo = self._check_docker()
        if not docker_sudo:
            return False
        
        sudo_prefix = "sudo " if docker_sudo == "sudo" else ""
        
        # Deploy
        self._info("Stopping previous services...")
        self._run_cmd(f"{sudo_prefix}docker-compose down", sudo=False)
        
        self._info("Building images...")
        if not self._run_cmd(f"{sudo_prefix}docker-compose build", sudo=False):
            return False
        
        self._info("Starting services...")
        if not self._run_cmd(f"{sudo_prefix}docker-compose up -d", sudo=False):
            return False
        
        # Final info
        config = self._load_config()
        host = config['HOST']
        web_port = config['WEB_PORT']
        api_port = config['API_PORT']
        
        # Check if host is accessible
        is_private_ip = host.startswith(('192.168.', '10.', '172.')) or host == 'localhost'
        
        print(f"""
DEPLOYMENT COMPLETED!

Access URLs:
   Web Interface: http://{host}:{web_port}
   API Endpoint:  http://{host}:{api_port}
   API Documentation: http://{host}:{api_port}/docs
   Health Check: http://{host}:{api_port}/health

Frontend Configuration:
   API Base URL: http://{host}:{api_port}/api/v1
   WebSocket URL: ws://{host}:{api_port}

Management Commands:
   python deploy.py logs     # View logs
   python deploy.py stop     # Stop services  
   python deploy.py status   # Check status
   python deploy.py clean    # Complete cleanup
""")
        
        if is_private_ip and host != 'localhost':
            print(f"""
⚠️  NETWORK WARNING:
   Using private IP ({host}) - only accessible from local network.
   
   For external access:
   1. Edit .env file: HOST=your.public.ip.or.domain
   2. Redeploy: python deploy.py deploy
   
   Or use port forwarding/reverse proxy.
""")
        elif host == 'localhost':
            print(f"""
ℹ️  LOCAL DEPLOYMENT:
   Using localhost - only accessible from this machine.
   
   For network access, edit .env: HOST=your.network.ip
""")
        else:
            print(f"""
✅ PUBLIC DEPLOYMENT:
   Using public IP ({host}) - accessible from internet.
   Make sure firewall allows ports {web_port} and {api_port}.
""")
        
        return True
    
    def dev(self) -> bool:
        """Local development mode"""
        self._header("DEVELOPMENT MODE")
        
        # Check dependencies
        backend_dir = self.root / "backend"
        frontend_dir = self.root / "frontend"
        
        if not backend_dir.exists():
            self._error("Backend directory not found")
            return False
            
        if not frontend_dir.exists():
            self._error("Frontend directory not found")
            return False
        
        if not Path("backend/requirements.txt").exists():
            self._error("Missing backend/requirements.txt")
            return False
        
        if not Path("frontend/package.json").exists():
            self._error("Missing frontend/package.json")
            return False
        
        # Setup for localhost
        config = self._load_config()
        config["HOST"] = "localhost"
        config["NODE_ENV"] = "development"
        config["WEB_PORT"] = "8080"  # Development frontend port
        config["DB_PATH"] = "./backend/data"  # Local data directory for development
        self._save_config(config)
        
        if not self._validate_telegram_config(config):
            return False
        
        # Install backend dependencies
        self._info("Installing backend dependencies...")
        if not self._run_cmd("cd backend && pip install -r requirements.txt"):
            self._warning("Failed to install backend dependencies. Trying with user flag...")
            if not self._run_cmd("cd backend && pip install --user -r requirements.txt"):
                self._error("Could not install backend dependencies. Please install manually:")
                print("  cd backend && pip install -r requirements.txt")
                return False
        
        # Install frontend dependencies
        self._info("Installing frontend dependencies...")
        if not self._run_cmd("cd frontend && npm install"):
            self._error("Could not install frontend dependencies. Please install manually:")
            print("  cd frontend && npm install")
            return False
        
        # Configure frontend
        frontend_env = self.root / "frontend" / ".env.local"
        with open(frontend_env, 'w') as f:
            f.write("VITE_API_BASE_URL=http://localhost:8000/api/v1\n")
            f.write("VITE_WS_BASE_URL=ws://localhost:8000\n")
        
        print("""
Development Mode Activated

URLs:
   Frontend: http://localhost:8080
   Backend: http://localhost:8000
   API Docs: http://localhost:8000/docs

Use Ctrl+C to stop both services
""")
        
        # Execute services
        def run_backend():
            backend_dir = self.root / "backend"
            if not backend_dir.exists():
                self._error("Backend directory not found")
                return
            
            os.chdir(backend_dir)
            env = os.environ.copy()
            env.update(config)
            
            subprocess.run([
                sys.executable, "-m", "uvicorn", "main:app", 
                "--reload", "--host", "0.0.0.0", "--port", "8000"
            ], env=env)
        
        def run_frontend():
            frontend_dir = self.root / "frontend"
            if not frontend_dir.exists():
                self._error("Frontend directory not found")
                return
                
            os.chdir(frontend_dir)
            subprocess.run(["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"])
        
        # Backend in thread
        backend_thread = Thread(target=run_backend, daemon=True)
        backend_thread.start()
        
        time.sleep(3)  # Wait for backend
        
        try:
            run_frontend()
        except KeyboardInterrupt:
            print("\nStopping services...")
        
        return True
    
    def stop(self) -> bool:
        """Stop all services"""
        self._header("STOPPING SERVICES")
        
        docker_sudo = self._check_docker()
        if not docker_sudo:
            return False
        
        sudo_prefix = "sudo " if docker_sudo == "sudo" else ""
        return self._run_cmd(f"{sudo_prefix}docker-compose down")
    
    def logs(self) -> bool:
        """Show real-time system logs"""
        self._header("SYSTEM LOGS")
        
        docker_sudo = self._check_docker()
        if not docker_sudo:
            return False
        
        sudo_prefix = "sudo " if docker_sudo == "sudo" else ""
        return self._run_cmd(f"{sudo_prefix}docker-compose logs -f --tail=100")
    
    def status(self) -> bool:
        """Show service status"""
        self._header("SERVICE STATUS")
        
        docker_sudo = self._check_docker()
        if not docker_sudo:
            return False
        
        sudo_prefix = "sudo " if docker_sudo == "sudo" else ""
        return self._run_cmd(f"{sudo_prefix}docker-compose ps")
    
    def install_deps(self) -> bool:
        """Install development dependencies"""
        self._header("INSTALLING DEPENDENCIES")
        
        # Backend dependencies
        self._info("Installing backend dependencies...")
        if not self._run_cmd("cd backend && pip install -r requirements.txt"):
            self._warning("Failed to install backend dependencies. Trying with user flag...")
            if not self._run_cmd("cd backend && pip install --user -r requirements.txt"):
                self._error("Could not install backend dependencies")
                print("Manual installation:")
                print("  cd backend")
                print("  python -m pip install --user -r requirements.txt")
                return False
        
        # Frontend dependencies
        self._info("Installing frontend dependencies...")
        if not self._run_cmd("cd frontend && npm install"):
            self._error("Could not install frontend dependencies")
            print("Manual installation:")
            print("  cd frontend")
            print("  npm install")
            return False
        
        self._success("All dependencies installed successfully")
        return True
    
    def set_host(self, new_host: str) -> bool:
        """Change host/IP configuration"""
        self._header(f"CHANGING HOST TO: {new_host}")
        
        config = self._load_config()
        old_host = config.get('HOST', 'unknown')
        config['HOST'] = new_host
        
        self._save_config(config)
        self._create_docker_compose(config)
        
        self._success(f"Host changed from {old_host} to {new_host}")
        print(f"""
Configuration updated!

Old Host: {old_host}
New Host: {new_host}

Run 'python deploy.py deploy' to apply changes.
""")
        return True
    
    def clean(self) -> bool:
        """Complete cleanup"""
        self._header("COMPLETE CLEANUP")
        
        docker_sudo = self._check_docker()
        if not docker_sudo:
            return False
        
        sudo_prefix = "sudo " if docker_sudo == "sudo" else ""
        
        commands = [
            f"{sudo_prefix}docker-compose down --volumes --remove-orphans",
            f"{sudo_prefix}docker system prune -f",
            f"{sudo_prefix}docker volume prune -f"
        ]
        
        for cmd in commands:
            self._info(f"Executing: {cmd}")
            self._run_cmd(cmd)
        
        self._success("Cleanup completed")
        return True

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    manager = TgCloudManager()
    command = sys.argv[1].lower()
    
    commands = {
        'deploy': manager.deploy,
        'dev': manager.dev,
        'stop': manager.stop, 
        'logs': manager.logs,
        'status': manager.status,
        'clean': manager.clean,
        'setup': lambda: manager.setup(force=True),
        'install': manager.install_deps
    }
    
    # Special command with parameter
    if command == 'host' and len(sys.argv) >= 3:
        new_host = sys.argv[2]
        commands['host'] = lambda: manager.set_host(new_host)
    elif command == 'host':
        print("[ERROR] Usage: python deploy.py host <ip_or_domain>")
        print("Example: python deploy.py host 192.168.1.100")
        print("Example: python deploy.py host yourdomain.com")
        return
    
    if command not in commands:
        print(f"[ERROR] Invalid command '{command}'")
        print(__doc__)
        return
    
    try:
        commands[command]()
    except KeyboardInterrupt:
        print("\n[WARNING] Cancelled by user")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")

if __name__ == "__main__":
    main()
