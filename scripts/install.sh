#!/bin/bash
# SymbiLink One-Click Install Script
# Supports: Ubuntu/Debian, CentOS/RHEL, macOS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
    print_info "Detected OS: $OS"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Node.js
install_nodejs() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js $(node -v) already installed"
            return 0
        fi
    fi

    print_info "Installing Node.js..."

    if [[ "$OS" == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "redhat" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    elif [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install node@20
        else
            print_error "Homebrew not found. Please install Node.js manually."
            exit 1
        fi
    fi

    print_success "Node.js installed"
}

# Install Docker
install_docker() {
    if command_exists docker; then
        print_success "Docker already installed"
        return 0
    fi

    print_info "Installing Docker..."

    if [[ "$OS" == "debian" ]]; then
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    elif [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install --cask docker
        else
            print_error "Homebrew not found. Please install Docker manually."
            exit 1
        fi
    fi

    # Add user to docker group
    sudo usermod -aG docker $USER

    print_success "Docker installed"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Build project
build_project() {
    print_info "Building project..."
    npm run build
    print_success "Project built"
}

# Initialize configuration
init_config() {
    print_info "Initializing configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env from template"
    else
        print_warning ".env already exists, skipping..."
    fi

    if [ ! -f symbilink.config.json ]; then
        cat > symbilink.config.json << EOF
{
  "name": "symbi",
  "version": "3.0.0",
  "mode": "hybrid",
  "channels": {
    "webchat": { "enabled": true },
    "telegram": { "enabled": false },
    "discord": { "enabled": false }
  },
  "skills": {
    "autoDiscover": true,
    "directory": "./src/skills"
  },
  "monitoring": {
    "enabled": true,
    "metricsPort": 9090
  }
}
EOF
        print_success "Created symbilink.config.json"
    else
        print_warning "symbilink.config.json already exists, skipping..."
    fi

    # Create directories
    mkdir -p data/memory data/sessions logs
    print_success "Created data directories"
}

# Create systemd service
create_service() {
    if [[ "$OS" != "debian" && "$OS" != "redhat" ]]; then
        return 0
    fi

    print_info "Creating systemd service..."
    
    INSTALL_DIR=$(pwd)
    
    sudo tee /etc/systemd/system/symbi.service > /dev/null << EOF
[Unit]
Description=SymbiLink AI Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable symbi
    
    print_success "Systemd service created"
    print_info "Start with: sudo systemctl start symbi"
    print_info "View logs with: journalctl -u symbi -f"
}

# Main installation
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║   🔗 SymbiLink Installer v3.0.0                               ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""

    detect_os

    # Parse arguments
    SKIP_DEPS=false
    SKIP_DOCKER=false
    DOCKER_MODE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --docker)
                DOCKER_MODE=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-deps    Skip dependency installation"
                echo "  --skip-docker  Skip Docker installation"
                echo "  --docker       Use Docker Compose for installation"
                echo "  --help         Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    if [ "$DOCKER_MODE" = true ]; then
        print_info "Installing with Docker Compose..."
        
        if [ "$SKIP_DOCKER" = false ]; then
            install_docker
        fi

        # Create .env if not exists
        if [ ! -f .env ]; then
            cp .env.example .env
            print_warning "Please edit .env with your API keys before starting"
        fi

        print_success "Docker installation ready!"
        echo ""
        print_info "Next steps:"
        print_info "  1. Edit .env with your API keys"
        print_info "  2. Run: docker compose up -d"
        print_info "  3. Access dashboard at: http://localhost:3001"
        print_info "  4. Access webchat at: http://localhost:80/webchat"
        echo ""
    else
        # Standard installation
        if [ "$SKIP_DEPS" = false ]; then
            install_nodejs
        fi

        if [ "$SKIP_DOCKER" = false ]; then
            read -p "Install Docker? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                install_docker
            fi
        fi

        install_dependencies
        build_project
        init_config
        create_service

        echo ""
        print_success "Installation complete!"
        echo ""
        print_info "Next steps:"
        print_info "  1. Edit .env with your API keys"
        print_info "  2. Run: npm start"
        print_info "  3. Or run with Docker: docker compose up -d"
        echo ""
    fi
}

# Run main function
main "$@"