import csv
import os
import re

# ---------------------------------------------------------------------------
# Individual Rule Checks
# ---------------------------------------------------------------------------

def check_duplicate_ips(show_output: str) -> list[str]:
    issues = []
    if re.search(r"duplicate|address conflict|flip", show_output, re.IGNORECASE):
        issues.append("Duplicate IP address detected")
    return issues


def check_subnet_mask(show_output: str) -> list[str]:
    issues = []
    if re.search(r"255\.255\.255\.128|/25|mask mismatch", show_output, re.IGNORECASE):
        issues.append("Subnet mask mismatch or invalid mask length")
    return issues


def check_gateway_mismatch(show_output: str) -> list[str]:
    issues = []
    if re.search(r"gateway|default-router|default gateway", show_output, re.IGNORECASE):
        if re.search(r"wrong gateway|incorrect|254 instead of 1", show_output, re.IGNORECASE):
            issues.append("Default gateway misconfiguration detected")
    return issues


def check_interface_down(show_output: str) -> list[str]:
    issues = []
    if re.search(r"administratively down|err-disabled|down down|disabled", show_output, re.IGNORECASE):
        issues.append("Interface is down, disabled, or err-disabled")
    return issues


def check_missing_vlan(show_output: str) -> list[str]:
    issues = []
    if re.search(r"vlan\s*\d+.*(missing|not (on|in|present))|missing.*vlan", show_output, re.IGNORECASE):
        issues.append("VLAN missing from trunk/allowed list")
    return issues


def check_missing_route(show_output: str) -> list[str]:
    issues = []
    if re.search(r"no route|no entry for|missing route", show_output, re.IGNORECASE):
        issues.append("Expected route missing from routing table")
    return issues


# Active Rule Registry
CHECKS = [
    check_duplicate_ips,
    check_subnet_mask,
    check_gateway_mismatch,
    check_interface_down,
    check_missing_vlan,
    check_missing_route,
]


def run_checks(show_output: str) -> list[str]:
    findings = []
    for check in CHECKS:
        findings.extend(check(show_output))
    return findings


# ---------------------------------------------------------------------------
# File Loaders & Main Execution
# ---------------------------------------------------------------------------

def resolve_file_path(base_dir: str, filename: str) -> str:
    """Helper to find data files whether in ../data or current directory."""
    candidates = [
        os.path.join(base_dir, "..", "data", filename),
        os.path.join(base_dir, "data", filename),
        os.path.join(base_dir, filename),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return candidates[0]  # Return primary candidate default


def process_cases_file(csv_path: str):
    """Processes acceptable_cases.csv dataset."""
    if not os.path.exists(csv_path):
        print(f"[WARNING] Acceptable cases file not found: {csv_path}")
        return

    print(f"\n--- Loading Acceptable Cases from: {os.path.basename(csv_path)} ---")
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        total_cases = 0
        matched_cases = 0

        for row in reader:
            total_cases += 1
            show_output = (
                row.get("show_output", "") + " " +
                row.get("symptom", "") + " " +
                row.get("expected_fault", "")
            )
            findings = run_checks(show_output)

            if findings:
                matched_cases += 1
                case_id = row.get("case_id", f"Row-{total_cases}")
                print(f"  [MATCH] Case {case_id}: {findings}")

        print(f"Summary: {matched_cases}/{total_cases} cases matched rule checks.")


def process_review_log_file(review_path: str):
    """Processes review_log.csv dataset if present."""
    if not os.path.exists(review_path):
        print(f"\n--- Review Log status: File not found at {review_path} (Optional) ---")
        return

    print(f"\n--- Processing Review Log from: {os.path.basename(review_path)} ---")
    with open(review_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        total_reviews = 0
        flagged_reviews = 0

        for row in reader:
            total_reviews += 1
            log_text = row.get("feedback", "") + " " + row.get("user_output", "") + " " + row.get("symptom", "")
            findings = run_checks(log_text)

            if findings:
                flagged_reviews += 1
                review_id = row.get("review_id", f"Log-{total_reviews}")
                print(f"  [FLAGGED REVIEW] Log {review_id}: {findings}")

        print(f"Summary: {flagged_reviews}/{total_reviews} review logs flagged by rules.")


def main(cases_file: str = "acceptable_cases.csv", review_file: str = "review_log.csv"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    cases_path = resolve_file_path(base_dir, cases_file)
    review_path = resolve_file_path(base_dir, review_file)

    # Process both datasets
    process_cases_file(cases_path)
    process_review_log_file(review_path)


if __name__ == "__main__":
    main(cases_file="acceptable_cases.csv", review_file="review_log.csv")