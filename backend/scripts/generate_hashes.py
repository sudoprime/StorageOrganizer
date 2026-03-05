#!/usr/bin/env python3
"""
Generate random hash IDs for bins and containers.

Usage:
    python generate_hashes.py [--bins COUNT] [--containers COUNT] [--output FILE]

Examples:
    python generate_hashes.py --bins 102 --containers 50
    python generate_hashes.py --bins 200 --output ids.txt
"""

import random
import string
import argparse


def generate_bin_ids(count=102):
    """
    Generate 4-character hash IDs for bins.
    Format: Letter-Number-Letter-Number (e.g., A3F2)
    """
    ids = set()
    while len(ids) < count:
        bin_id = ''.join([
            random.choice(string.ascii_uppercase),
            str(random.randint(1, 9)),
            random.choice(string.ascii_uppercase),
            str(random.randint(1, 9))
        ])
        ids.add(bin_id)
    return sorted(ids)


def generate_container_ids(count=50):
    """
    Generate 5-character hash IDs for sub-containers.
    Format: Letter-Number-Letter-Number-Letter (e.g., X4K2P)
    """
    ids = set()
    while len(ids) < count:
        container_id = ''.join([
            random.choice(string.ascii_uppercase),
            str(random.randint(1, 9)),
            random.choice(string.ascii_uppercase),
            str(random.randint(1, 9)),
            random.choice(string.ascii_uppercase)
        ])
        ids.add(container_id)
    return sorted(ids)


def main():
    parser = argparse.ArgumentParser(description='Generate hash IDs for bins and containers')
    parser.add_argument('--bins', type=int, default=102, help='Number of bin IDs to generate (default: 102)')
    parser.add_argument('--containers', type=int, default=50, help='Number of container IDs to generate (default: 50)')
    parser.add_argument('--output', type=str, help='Output file (default: print to console)')

    args = parser.parse_args()

    # Generate IDs
    bin_ids = generate_bin_ids(args.bins)
    container_ids = generate_container_ids(args.containers)

    # Format output
    output = []
    output.append(f"# Bin IDs ({len(bin_ids)} total)")
    output.append("# 4-character format: A3F2, B7K9, etc.")
    output.append("")
    output.append("BIN_IDS = [")
    for i, bin_id in enumerate(bin_ids):
        if i % 10 == 0 and i > 0:
            output.append("")
        output.append(f'    "{bin_id}",')
    output.append("]")
    output.append("")
    output.append("")
    output.append(f"# Container IDs ({len(container_ids)} total)")
    output.append("# 5-character format: X4K2P, Y7M3Q, etc.")
    output.append("")
    output.append("CONTAINER_IDS = [")
    for i, container_id in enumerate(container_ids):
        if i % 10 == 0 and i > 0:
            output.append("")
        output.append(f'    "{container_id}",')
    output.append("]")

    result = "\n".join(output)

    # Output
    if args.output:
        with open(args.output, 'w') as f:
            f.write(result)
        print(f"Generated {len(bin_ids)} bin IDs and {len(container_ids)} container IDs")
        print(f"Saved to: {args.output}")
    else:
        print(result)


if __name__ == "__main__":
    main()
