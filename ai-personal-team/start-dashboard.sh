#!/bin/bash
# AI Personal Team Dashboard Startup Script
# This script starts the necessary port forwarding for the monitoring dashboard
# independently of VS Code

echo "🚀 Starting AI Personal Team Monitoring Dashboard..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if cluster is running
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes cluster is not running"
    echo "💡 Start your k3d cluster first: k3d cluster start"
    exit 1
fi

# Kill existing port forwards
echo "🧹 Cleaning up existing port forwards..."
pkill -f "kubectl port-forward.*grafana" 2>/dev/null || true
pkill -f "kubectl port-forward.*ai-personal-team" 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

# Start Grafana port forwarding
echo "📊 Starting Grafana port forwarding (localhost:3001)..."
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3001:80 > /dev/null 2>&1 &
GRAFANA_PID=$!

# Start AI Personal Team service port forwarding  
echo "🤖 Starting AI Personal Team service port forwarding (localhost:3002)..."
kubectl port-forward -n ai-personal-team svc/ai-personal-team-service 3002:3000 > /dev/null 2>&1 &
TEAM_PID=$!

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Test connections
echo "🔍 Testing connections..."

if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Grafana is accessible at http://localhost:3001"
    echo "   📊 Dashboard: http://localhost:3001/d/mission-control-dashboard/fb58c56"
    echo "   🔑 Credentials: admin / prom-operator"
else
    echo "⚠️  Grafana may still be starting up..."
fi

if curl -s http://localhost:3002/api/metrics > /dev/null; then
    echo "✅ AI Personal Team metrics are accessible at http://localhost:3002"
else
    echo "⚠️  AI Personal Team service may still be starting up..."
fi

echo ""
echo "🎯 Dashboard URLs:"
echo "   📊 Mission Control Dashboard: http://localhost:3001/d/mission-control-dashboard/fb58c56"
echo "   🤖 Agent Interface: http://localhost:3002"
echo ""
echo "🛑 To stop the port forwarding:"
echo "   kill $GRAFANA_PID $TEAM_PID"
echo "   or run: pkill -f 'kubectl port-forward'"
echo ""
echo "✨ Dashboard is ready! No need to keep VS Code running."

# Save PIDs for easy cleanup
echo "$GRAFANA_PID" > /tmp/grafana-pf.pid
echo "$TEAM_PID" > /tmp/ai-team-pf.pid
