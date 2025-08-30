#!/usr/bin/env python3
"""
pl_helper.py
Simple PennyLane bridge: reads { "circ": { qubits, ops }, "opts": {...} } from stdin (JSON),
executes the circuit using PennyLane (if installed) and prints a JSON result to stdout.

This helper is intentionally minimal and defensive: if PennyLane is not installed,
it prints an error message to stderr and exits with code 2 so the Node adapter can
fallback to simulator.
"""
import sys
import json

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

try:
    import pennylane as qml
    import numpy as np
except Exception as e:
    eprint('pennylane-not-installed:', str(e))
    # exit code 2 signals to the caller that PennyLane is not available
    sys.exit(2)

def safe_load_stdin():
    try:
        data = sys.stdin.read()
        if not data:
            return {}
        return json.loads(data)
    except Exception as e:
        eprint('invalid-json-stdin:', str(e))
        sys.exit(3)

def apply_op(op):
    name = op.get('name','').upper()
    wires = op.get('wires', [])
    params = op.get('params', {})
    if name == 'H':
        for w in wires: qml.Hadamard(w)
    elif name == 'RZ':
        angle = params.get('angle', 0)
        for w in wires: qml.RZ(angle, wires=[w])
    elif name == 'RX':
        angle = params.get('angle', 0)
        for w in wires: qml.RX(angle, wires=[w])
    elif name == 'RY':
        angle = params.get('angle', 0)
        for w in wires: qml.RY(angle, wires=[w])
    elif name == 'CZ':
        if len(wires) >= 2: qml.CZ(wires=wires)
    elif name == 'CNOT' or name == 'CX':
        qml.CNOT(wires=wires)
    elif name == 'MEASURE_ALL' or name == 'MEASURE':
        # measurement handled after circuit
        pass
    else:
        # unknown op - ignore or log
        pass

def main():
    payload = safe_load_stdin()
    circ = payload.get('circ') or payload.get('circuit') or {}
    opts = payload.get('opts') or {}

    n = circ.get('qubits', 0)
    if n <= 0:
        eprint('invalid-circuit: no qubits')
        sys.exit(4)

    shots = opts.get('shots', 1024)
    dev_name = opts.get('device', 'default.qubit')

    try:
        dev = qml.device(dev_name, wires=n, shots=shots)
    except Exception:
        # fallback to default.qubit with no shots (analytic)
        dev = qml.device('default.qubit', wires=n, shots=shots)

    @qml.qnode(dev)
    def run_circ():
        for op in circ.get('ops', []):
            apply_op(op)
        # return samples in computational basis using sample for each wire
        return qml.sample(wires=range(n))

    try:
        samples = run_circ()
        arr = np.array(samples)
        # ensure 2D
        if arr.ndim == 1:
            arr = arr.reshape((-1, n))
        # handle PauliZ outputs (values may be -1 or 1) by mapping to 0/1
        # If values are {0,1} already, keep them
        if arr.size == 0:
            bits = []
        else:
            if np.all(np.isin(arr, [-1, 1])):
                bits = ((1 - arr) / 2).astype(int).tolist()
            else:
                bits = arr.astype(int).tolist()

        out = { 'samples': bits, 'counts': {} }
        for s in bits:
            k = ''.join(str(b) for b in s)
            out['counts'][k] = out['counts'].get(k, 0) + 1
        out['score'] = None
        print(json.dumps(out))
        sys.exit(0)
    except Exception as e:
        eprint('execution-error:', str(e))
        sys.exit(5)

if __name__ == '__main__':
    main()
