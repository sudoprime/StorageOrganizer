#!/usr/bin/env python3
"""
Generate random BIN-prefixed hash IDs for bins.

Usage:
    python generate_hashes.py [--count COUNT] [--output FILE]

Examples:
    python generate_hashes.py --count 102
    python generate_hashes.py --count 200 --output ids.txt
"""

import random
import string
import argparse


def generate_bin_ids(count=102):
    """
    Generate BIN-prefixed 4-character hash IDs.
    Format: BIN-A3F2, BIN-B7K9, etc.
    """
    ids = set()
    while len(ids) < count:
        hash_part = ''.join([
            random.choice(string.ascii_uppercase),
            str(random.randint(1, 9)),
            random.choice(string.ascii_uppercase),
            str(random.randint(1, 9))
        ])
        ids.add(f"BIN-{hash_part}")
    return sorted(ids)


def main():
    parser = argparse.ArgumentParser(description='Generate hash IDs for bins')
    parser.add_argument('--count', type=int, default=102, help='Number of bin IDs to generate (default: 102)')
    parser.add_argument('--output', type=str, help='Output file (default: print to console)')

    args = parser.parse_args()

    bin_ids = generate_bin_ids(args.count)

    output = []
    output.append(f"# Bin IDs ({len(bin_ids)} total)")
    output.append("# Format: BIN-A3F2, BIN-B7K9, etc.")
    output.append("")
    output.append("BIN_IDS = [")
    for i, bin_id in enumerate(bin_ids):
        if i % 10 == 0 and i > 0:
            output.append("")
        output.append(f'    "{bin_id}",')
    output.append("]")

    result = "\n".join(output)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(result)
        print(f"Generated {len(bin_ids)} bin IDs")
        print(f"Saved to: {args.output}")
    else:
        print(result)


if __name__ == "__main__":
    main()
