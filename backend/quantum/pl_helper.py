#!/usr/bin/env python3
"""
pl_helper.py — PennyLane bridge helper (improved)

Reads JSON from stdin and executes a minimal set of gates using PennyLane.
Input formats supported:
 - { "circ": { "qubits": N, "ops": [...] }, "opts": { "shots": 1024, "device": "default.qubit" } }
 - or { "circuit": ... }

Output: JSON to stdout. On error the helper prints a small JSON error and exits with a non-zero code.

Exit codes:
 0 - success
 2 - PennyLane import failed
 3 - invalid JSON / device creation failed
 4 - invalid circuit (no qubits)
 5 - runtime execution error
"""
import sys
import json
import os


def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


try:
    import pennylane as qml
    import numpy as np
except Exception as e:
    # structured output for the caller
    out = {"success": False, "error": "pennylane_import_failed", "detail": str(e)}
    sys.stdout.write(json.dumps(out))
    sys.exit(2)


def safe_load_stdin():
    try:
        data = sys.stdin.read()
        if not data:
            return {}
        return json.loads(data)
    except Exception as e:
        out = {"success": False, "error": "invalid_json", "detail": str(e)}
        sys.stdout.write(json.dumps(out))
        sys.exit(3)


def apply_op(op):
    name = op.get('name', '').upper()
    wires = op.get('wires', []) or []
    params = op.get('params', {}) or {}

    if name == 'H':
        for w in wires:
            qml.Hadamard(wires=w)
    elif name == 'RZ':
        angle = float(params.get('angle', 0))
        for w in wires:
            qml.RZ(angle, wires=[w])
    elif name == 'RX':
        angle = float(params.get('angle', 0))
        for w in wires:
            qml.RX(angle, wires=[w])
    elif name == 'RY':
        angle = float(params.get('angle', 0))
        for w in wires:
            qml.RY(angle, wires=[w])
    elif name in ('CNOT', 'CX'):
        if len(wires) >= 2:
            qml.CNOT(wires=[wires[0], wires[1]])
    elif name == 'CZ':
        if len(wires) >= 2:
            qml.CZ(wires=[wires[0], wires[1]])
    elif name in ('MEASURE_ALL', 'MEASURE'):
        # handled by returning samples; ignore here
        pass
    else:
        # Unknown op — log to stderr but continue
        eprint(f"pl_helper: unknown op '{name}' ignored")


def samples_to_counts(samples):
    counts = {}
    for s in samples:
        k = ''.join(str(int(b)) for b in s)
        counts[k] = counts.get(k, 0) + 1
    return counts


def main():
    payload = safe_load_stdin()
    circ = payload.get('circ') or payload.get('circuit') or {}
    opts = payload.get('opts') or payload.get('options') or {}

    n = int(circ.get('qubits', 0) or 0)
    if n <= 0:
        out = {"success": False, "error": "invalid_circuit", "detail": "no qubits"}
        sys.stdout.write(json.dumps(out))
        sys.exit(4)

    shots = int(opts.get('shots', int(os.environ.get('PL_SHOTS', 1024))))
    dev_name = opts.get('device', os.environ.get('PL_DEVICE', 'default.qubit'))

    try:
        dev = qml.device(dev_name, wires=n, shots=shots)
    except Exception as e:
        # fallback: try default.qubit
        try:
            dev = qml.device('default.qubit', wires=n, shots=shots)
        except Exception as e2:
            out = {"success": False, "error": "device_creation_failed", "detail": str(e2)}
            sys.stdout.write(json.dumps(out))
            sys.exit(3)

    @qml.qnode(dev)
    def run_circ():
        for op in circ.get('ops', []):
            apply_op(op)
        return qml.sample(wires=list(range(n)))

    try:
        samples = run_circ()
        arr = np.array(samples)
        # normalize shape
        if arr.ndim == 1:
            arr = arr.reshape((-1, n))

        # map possible -1/1 to 0/1
        if np.all(np.isin(arr, [-1, 1])):
            arr = ((1 - arr) / 2).astype(int)
        else:
            arr = arr.astype(int)

        samples_list = arr.tolist()
        counts = samples_to_counts(samples_list)

        out = {"success": True, "provider": "pennylane", "samples": samples_list[:min(len(samples_list), 200)], "counts": counts}
        sys.stdout.write(json.dumps(out))
        sys.exit(0)
    except Exception as e:
        out = {"success": False, "error": "execution_error", "detail": str(e)}
        sys.stdout.write(json.dumps(out))
        sys.exit(5)


if __name__ == '__main__':
    main()
