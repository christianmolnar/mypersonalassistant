#!/bin/bash
# AI Personal Team Dashboard Stop Script
# This script stops the port forwarding for the monitoring dashboard

echo "🛑 Stopping AI Personal Team Monitoring Dashboard..."

# Kill port forwards by pattern
pkill -f "kubectl port-forward.*grafana" 2>/dev/null && echo "✅ Stopped Grafana port forwarding"
pkill -f "kubectl port-forward.*ai-personal-team" 2>/dev/null && echo "✅ Stopped AI Personal Team port forwarding"

# Clean up PID files
rm -f /tmp/grafana-pf.pid /tmp/ai-team-pf.pid

echo "🏁 Dashboard port forwarding stopped."
echo "💡 The Kubernetes cluster is still running. To stop it completely:"
echo "   k3d cluster stop"
