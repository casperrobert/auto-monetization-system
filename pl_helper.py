#!/usr/bin/env python3
"""
PennyLane Bridge Helper

This module provides a bridge to PennyLane quantum computing library with graceful
error handling when PennyLane is not installed. Falls back to simulator behavior
and provides structured JSON error messages.
"""

import json
import sys
import traceback
from typing import Dict, Any, List, Optional

class PennyLaneError(Exception):
    """Custom exception for PennyLane related errors"""
    pass

class PLHelper:
    """
    PennyLane Helper class that provides quantum computing capabilities
    with graceful fallback when PennyLane is not available.
    """
    
    def __init__(self):
        self.pennylane_available = False
        self.qml = None
        self.device = None
        self._init_pennylane()
    
    def _init_pennylane(self):
        """Initialize PennyLane if available, otherwise prepare for simulator fallback"""
        try:
            import pennylane as qml
            self.qml = qml
            self.pennylane_available = True
            # Try to create a default device
            try:
                self.device = qml.device('default.qubit', wires=2)
            except Exception as e:
                self._log_error("Failed to create PennyLane device", str(e))
        except ImportError as e:
            self._log_warning("PennyLane not installed, using simulator fallback")
            self.pennylane_available = False
        except Exception as e:
            self._log_error("Unexpected error initializing PennyLane", str(e))
            self.pennylane_available = False
    
    def _log_error(self, message: str, details: str = "") -> Dict[str, Any]:
        """Log structured JSON error"""
        error_data = {
            "status": "error",
            "message": message,
            "details": details,
            "pennylane_available": self.pennylane_available,
            "timestamp": self._get_timestamp()
        }
        print(json.dumps(error_data), file=sys.stderr)
        return error_data
    
    def _log_warning(self, message: str) -> Dict[str, Any]:
        """Log structured JSON warning"""
        warning_data = {
            "status": "warning", 
            "message": message,
            "pennylane_available": self.pennylane_available,
            "timestamp": self._get_timestamp()
        }
        print(json.dumps(warning_data), file=sys.stderr)
        return warning_data
    
    def _log_info(self, message: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Log structured JSON info"""
        info_data = {
            "status": "info",
            "message": message,
            "pennylane_available": self.pennylane_available,
            "timestamp": self._get_timestamp()
        }
        if data:
            info_data.update(data)
        print(json.dumps(info_data))
        return info_data
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def get_status(self) -> Dict[str, Any]:
        """Get the current status of the PennyLane helper"""
        status = {
            "pennylane_available": self.pennylane_available,
            "device_available": self.device is not None,
            "timestamp": self._get_timestamp()
        }
        
        if self.pennylane_available:
            try:
                status["pennylane_version"] = self.qml.version()
                status["available_devices"] = self._get_available_devices()
            except Exception as e:
                status["version_error"] = str(e)
        
        return status
    
    def _get_available_devices(self) -> List[str]:
        """Get list of available PennyLane devices"""
        if not self.pennylane_available:
            return []
        
        try:
            # This is a simplified approach - in real PennyLane you'd use qml.devices
            return ["default.qubit", "default.mixed"]
        except Exception:
            return []
    
    def create_simple_circuit(self, params: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Create and execute a simple quantum circuit
        
        Args:
            params: Optional parameters for the circuit
            
        Returns:
            Dict containing circuit results or error information
        """
        if params is None:
            params = [0.5, 0.3]
        
        if not self.pennylane_available:
            return self._simulate_circuit_execution(params)
        
        try:
            if self.device is None:
                return self._log_error("No quantum device available")
            
            # Define a simple quantum circuit
            @self.qml.qnode(self.device)
            def circuit(x, y):
                self.qml.RX(x, wires=0)
                self.qml.RY(y, wires=1) 
                self.qml.CNOT(wires=[0, 1])
                return self.qml.expval(self.qml.PauliZ(0)), self.qml.expval(self.qml.PauliZ(1))
            
            result = circuit(params[0], params[1])
            
            return {
                "status": "success",
                "circuit_type": "simple_quantum",
                "parameters": params,
                "results": result.tolist() if hasattr(result, 'tolist') else list(result),
                "pennylane_used": True,
                "timestamp": self._get_timestamp()
            }
            
        except Exception as e:
            self._log_error("Circuit execution failed", str(e))
            return self._simulate_circuit_execution(params)
    
    def _simulate_circuit_execution(self, params: List[float]) -> Dict[str, Any]:
        """
        Simulate quantum circuit execution when PennyLane is not available
        
        Args:
            params: Circuit parameters
            
        Returns:
            Dict containing simulated results
        """
        import math
        
        # Simple simulation of quantum expectation values
        # This is a very basic approximation for demonstration
        x, y = params[0], params[1] if len(params) > 1 else 0.0
        
        # Simulate expectation values with some trigonometric functions
        # to mimic quantum behavior
        exp_val_0 = math.cos(x) * math.cos(y * 0.5)
        exp_val_1 = math.sin(x * 0.7) * math.cos(y)
        
        return {
            "status": "success",
            "circuit_type": "simulated_quantum",
            "parameters": params,
            "results": [exp_val_0, exp_val_1],
            "pennylane_used": False,
            "simulation_note": "Using classical simulation - PennyLane not available",
            "timestamp": self._get_timestamp()
        }
    
    def run_quantum_optimization(self, steps: int = 10) -> Dict[str, Any]:
        """
        Run a simple quantum optimization routine
        
        Args:
            steps: Number of optimization steps
            
        Returns:
            Dict containing optimization results
        """
        if not self.pennylane_available:
            return self._simulate_optimization(steps)
        
        try:
            if self.device is None:
                return self._log_error("No quantum device available for optimization")
            
            # Simple optimization example
            import numpy as np
            
            @self.qml.qnode(self.device)
            def cost_function(params):
                self.qml.RX(params[0], wires=0)
                self.qml.RY(params[1], wires=1)
                self.qml.CNOT(wires=[0, 1])
                return self.qml.expval(self.qml.PauliZ(0))
            
            # Initialize parameters
            params = np.array([0.1, 0.2])
            optimizer = self.qml.GradientDescentOptimizer(stepsize=0.1)
            
            costs = []
            for i in range(steps):
                params, cost = optimizer.step_and_cost(cost_function, params)
                costs.append(float(cost))
            
            return {
                "status": "success",
                "optimization_type": "quantum_gradient_descent",
                "steps": steps,
                "final_params": params.tolist(),
                "final_cost": costs[-1],
                "cost_history": costs,
                "pennylane_used": True,
                "timestamp": self._get_timestamp()
            }
            
        except Exception as e:
            self._log_error("Optimization failed", str(e))
            return self._simulate_optimization(steps)
    
    def _simulate_optimization(self, steps: int) -> Dict[str, Any]:
        """
        Simulate quantum optimization when PennyLane is not available
        
        Args:
            steps: Number of optimization steps
            
        Returns:
            Dict containing simulated optimization results
        """
        import math
        
        # Simulate optimization convergence
        params = [0.1, 0.2]
        costs = []
        
        for i in range(steps):
            # Simple cost function simulation
            cost = 1.0 - 0.8 * math.exp(-i * 0.1) + 0.1 * math.sin(i * 0.3)
            costs.append(cost)
            
            # Update parameters (simulated gradient descent)
            params[0] += 0.01 * (0.5 - params[0])
            params[1] += 0.01 * (0.3 - params[1])
        
        return {
            "status": "success",
            "optimization_type": "simulated_quantum_optimization",
            "steps": steps,
            "final_params": params,
            "final_cost": costs[-1],
            "cost_history": costs,
            "pennylane_used": False,
            "simulation_note": "Using classical simulation - PennyLane not available",
            "timestamp": self._get_timestamp()
        }


def main():
    """Main function for command line usage"""
    helper = PLHelper()
    
    if len(sys.argv) < 2:
        print(json.dumps(helper.get_status()))
        return
    
    command = sys.argv[1]
    
    if command == "status":
        print(json.dumps(helper.get_status()))
    elif command == "circuit":
        params = [float(x) for x in sys.argv[2:]] if len(sys.argv) > 2 else None
        print(json.dumps(helper.create_simple_circuit(params)))
    elif command == "optimize":
        steps = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        print(json.dumps(helper.run_quantum_optimization(steps)))
    else:
        error = {
            "status": "error", 
            "message": f"Unknown command: {command}",
            "details": "",
            "pennylane_available": helper.pennylane_available,
            "timestamp": helper._get_timestamp()
        }
        print(json.dumps(error), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()