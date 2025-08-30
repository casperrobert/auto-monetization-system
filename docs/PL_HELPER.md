pl_helper (PennyLane helper)
---------------------------------

This repo includes a lightweight Python helper `backend/quantum/pl_helper.py` that accepts an intermediate circuit representation via stdin (JSON) and attempts to execute it with PennyLane. It is intended as a bridge for the Node `PennyLaneProvider`.

Usage (example):

    echo '{"circ": {"qubits": 2, "ops": [{"name":"H","wires":[0]},{"name":"H","wires":[1]},{"name":"MEASURE_ALL","wires":[0,1]}]}, "opts": {"shots": 1024}}' | python3 backend/quantum/pl_helper.py

If PennyLane is not installed, the helper exits with code 2 and writes an explanatory message to stderr.

To install dependencies into a virtualenv (recommended):

    python3 -m venv .venv
    . .venv/bin/activate
    pip install -r backend/quantum/requirements.txt
