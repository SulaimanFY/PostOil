#!/usr/bin/env python3
"""Local development server.

I run this from the project root:

    python frontend/serve.py [port]

It does two things:

  1. Copies project-level `data/` into `frontend/data/` so the relative
     fetches (`./data/...`) match the layout I deploy on GitHub Pages.
  2. Serves `frontend/` on http://localhost:<port> (default 8000).
"""
from __future__ import annotations

import http.server
import shutil
import socketserver
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
SRC = PROJECT_ROOT / "data"
DST = ROOT / "data"


def sync_data() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing data folder: {SRC}")
    if DST.exists():
        shutil.rmtree(DST)
    shutil.copytree(SRC, DST)
    print(f"Synced {SRC} -> {DST}")


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    sync_data()

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):  # noqa: A002 - signature
            sys.stderr.write("[serve] " + format % args + "\n")

    handler_factory = lambda *a, **kw: QuietHandler(*a, directory=str(ROOT), **kw)
    with socketserver.TCPServer(("", port), handler_factory) as httpd:
        url = f"http://localhost:{port}/"
        print(f"Serving frontend at {url}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down.")


if __name__ == "__main__":
    main()
