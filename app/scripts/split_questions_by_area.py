#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
split_questions_by_area.py

Split a JSON file of questions into multiple JSON files grouped by area.
Each output file contains up to --chunk-size questions.

Usage:
  python scripts/split_questions_by_area.py --input scripts/data/questions.json --chunk-size 30 --output-dir scripts/data/by_area

The script supports the following input shapes:
- top-level array of question objects (each object should have an area key)
- top-level object with a list under one of: questions, items, data
- top-level mapping area_name -> list_of_questions

It does NOT run here; run locally so the file is read on your machine.
"""

from __future__ import annotations
import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List


def sanitize(s: str) -> str:
    s = str(s or 'unknown').strip()
    s = s.lower()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^a-z0-9_\-]", "", s)
    return s or 'unknown'


def chunk_list(lst: List[Any], size: int) -> Iterable[List[Any]]:
    for i in range(0, len(lst), size):
        yield lst[i:i+size]


def detect_questions(obj: Any):
    """Return ('list', list) or ('mapping', dict) depending on top-level JSON structure."""
    if isinstance(obj, list):
        return 'list', obj
    if isinstance(obj, dict):
        # common keys that hold a list
        for key in ('questions', 'items', 'data', 'questions_list'):
            v = obj.get(key)
            if isinstance(v, list):
                return 'list', v
        # mapping area->list?
        if obj and all(isinstance(v, list) for v in obj.values()):
            return 'mapping', obj
    raise ValueError('Unsupported JSON structure; expected list or mapping area->list or dict with list under questions/items/data')


def group_by_area(items: List[Dict], area_key: str) -> Dict[str, List[Dict]]:
    fallbacks = ['area', 'subject', 'assunto', 'categoria', 'category', 'topic']
    keys = [area_key] + [k for k in fallbacks if k != area_key]
    groups: Dict[str, List[Dict]] = {}
    for it in items:
        if not isinstance(it, dict):
            area = 'unknown'
        else:
            area = None
            for k in keys:
                if k in it:
                    val = it.get(k)
                    if isinstance(val, (list, tuple)):
                        area = ','.join(map(str, val)) if val else 'unknown'
                    else:
                        area = str(val) if val is not None else 'unknown'
                    break
            if area is None:
                area = 'unknown'
        groups.setdefault(sanitize(area), []).append(it)
    return groups


def write_chunks(output_dir: Path, area_name: str, items: List[Any], chunk_size: int) -> List[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    paths: List[Path] = []
    total = (len(items) + chunk_size - 1) // chunk_size or 1
    for idx, chunk in enumerate(chunk_list(items, chunk_size), start=1):
        fname = f"{area_name}_part{idx:02d}.json" if total > 1 else f"{area_name}.json"
        p = output_dir / fname
        with p.open('w', encoding='utf-8') as f:
            json.dump(chunk, f, ensure_ascii=False, indent=2)
        paths.append(p)
    return paths


def main() -> None:
    parser = argparse.ArgumentParser(description="Split questions.json by area into multiple JSON files.")
    parser.add_argument('--input', '-i', type=Path, default=Path('scripts/data/questions.json'), help='Input JSON file')
    parser.add_argument('--output-dir', '-o', type=Path, default=None, help='Output directory (default: <input_parent>/by_area)')
    parser.add_argument('--chunk-size', '-n', type=int, default=30, help='Max questions per output file')
    parser.add_argument('--area-key', '-k', type=str, default='area', help='Primary key to use for area (default: area)')
    parser.add_argument('--dry-run', action='store_true', help='Do not write files; only print summary')
    args = parser.parse_args()

    input_path = args.input
    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    out_dir = args.output_dir or (input_path.parent / 'by_area')
    out_dir = Path(out_dir)

    with input_path.open('r', encoding='utf-8') as f:
        doc = json.load(f)

    structure, payload = detect_questions(doc)
    created: List[Path] = []

    if structure == 'mapping':
        mapping: Dict[str, Any] = payload
        for area, items in mapping.items():
            if not isinstance(items, list):
                continue
            area_name = sanitize(area)
            if args.dry_run:
                print(f"{area_name}: {len(items)} items -> {((len(items)+args.chunk_size-1)//args.chunk_size)} files")
            else:
                created += write_chunks(out_dir, area_name, items, args.chunk_size)
    else:
        items = payload
        groups = group_by_area(items, args.area_key)
        for area_name, group_items in groups.items():
            if args.dry_run:
                print(f"{area_name}: {len(group_items)} items -> {((len(group_items)+args.chunk_size-1)//args.chunk_size)} files")
            else:
                created += write_chunks(out_dir, area_name, group_items, args.chunk_size)

    if args.dry_run:
        print("Dry run complete.")
    else:
        print(f"Wrote {len(created)} files to {out_dir}")
        for p in created[:100]:
            print(" -", p)
        if len(created) > 100:
            print(" - ...")


if __name__ == '__main__':
    main()
