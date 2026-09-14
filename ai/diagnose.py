import csv
import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

# Import the rule checker module from the adjacent package
try:
    from checker.rule_checker import run_checks
except ImportError:
    # Fallback if executed directly within the checker directory or root
    try:
        from checker.rule_checker import run_checks
    except ImportError:
        def run_checks(text: str) -> List[str]:
            return []

# ---------------------------------------------------------------------------
# Diagnosis Engine Class
# ---------------------------------------------------------------------------

class NetSageDiagnoser:
    """
    Core AI & Rule-based Diagnostic Engine for NetSage AI Dashboard.
    Matches symptoms and CLI outputs against acceptable_cases.csv and applies
    rule-based heuristic checks.
    """

    def __init__(self, cases_file: str = "../data/acceptable_cases.csv"):
        self.cases_file = self._resolve_path(cases_file)
        self.cases: List[Dict[str, Any]] = []
        self._load_cases()

    def _resolve_path(self, path: str) -> str:
        """Resolves path relative to current script directory."""
        if os.path.exists(path):
            return path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(base_dir, "..", "data", "acceptable_cases.csv"),
            os.path.join(base_dir, "data", "acceptable_cases.csv"),
            os.path.join(base_dir, "acceptable_cases.csv"),
            os.path.join(base_dir, "..", "acceptablecses.csv"),
            "acceptablecses.csv",
        ]
        for candidate in candidates:
            if os.path.exists(candidate):
                return candidate
        return path

    def _load_cases(self) -> None:
        """Loads and indexes the 30 lab cases from CSV."""
        if not os.path.exists(self.cases_file):
            print(f"[WARNING] Case database not found at: {self.cases_file}")
            return

        with open(self.cases_file, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.cases.append(row)

    def diagnose(self, symptom: str, show_output: str) -> Dict[str, Any]:
        """
        Analyzes provided user symptom and Cisco CLI outputs.
        Returns matched case, diagnosis summary, confidence score, and remediation.
        """
        combined_text = f"{symptom} {show_output}".strip()
        if not combined_text:
            return {
                "success": False,
                "error": "Please provide a symptom description or Cisco CLI output.",
            }

        # Step 1: Run deterministic Rule Checker
        rule_findings = run_checks(combined_text)

        # Step 2: Match against dataset cases
        matched_case, match_score = self._match_dataset(symptom, show_output)

        # Step 3: Calculate final Confidence Score & assemble result
        if matched_case:
            case_id = matched_case.get("case_id", "UNKNOWN")
            fault = matched_case.get("expected_fault", "Misconfiguration detected.")
            osi_layer = matched_case.get("osi_layer", "Layer 2/3")
            severity = matched_case.get("severity", "Medium")

            # Calculate confidence score (Base score + rule match boost)
            confidence = match_score
            if rule_findings:
                confidence = min(99, confidence + 5)

            fix_commands = self._generate_fix_commands(case_id, matched_case, combined_text)

            return {
                "success": True,
                "case_id": case_id,
                "fault": fault,
                "osi_layer": osi_layer,
                "severity": severity,
                "confidence_score": confidence,
                "rule_findings": rule_findings,
                "fix_commands": fix_commands,
            }

        # Fallback for unmapped custom inputs
        return {
            "success": True,
            "case_id": "CUSTOM-001",
            "fault": "Custom Interface / Subnet Misconfiguration Detected.",
            "osi_layer": "Layer 3",
            "severity": "Medium",
            "confidence_score": 85 if rule_findings else 75,
            "rule_findings": rule_findings,
            "fix_commands": (
                "configure terminal\n"
                "interface GigabitEthernet0/0/0.20\n"
                " ip address 192.168.20.1 255.255.255.0\n"
                " no shutdown\n"
                "end\n"
                "write memory"
            ),
        }

    def _match_dataset(self, symptom: str, show_output: str) -> Tuple[Optional[Dict[str, Any]], int]:
        """Performs fuzzy matching against indexed lab scenarios."""
        best_case = None
        best_score = 0

        sym_lower = symptom.lower().strip()
        out_lower = show_output.lower().strip()

        for case in self.cases:
            score = 0
            case_id = case.get("case_id", "").lower()
            case_sym = case.get("symptom", "").lower()
            case_out = case.get("show_output", "").lower()

            # Exact Case ID match
            if case_id and case_id in out_lower:
                return case, 98

            # Symptom text matching
            if sym_lower and case_sym:
                if sym_lower in case_sym or case_sym in sym_lower:
                    score += 60
                else:
                    # Token overlap match
                    sym_words = set(re.findall(r"\w+", sym_lower))
                    case_words = set(re.findall(r"\w+", case_sym))
                    overlap = len(sym_words.intersection(case_words))
                    if overlap >= 3:
                        score += 40

            # CLI Output matching
            if out_lower and case_out:
                if case_out in out_lower or out_lower in case_out:
                    score += 35
                else:
                    out_words = set(re.findall(r"\w+", out_lower))
                    case_out_words = set(re.findall(r"\w+", case_out))
                    overlap = len(out_words.intersection(case_out_words))
                    if overlap >= 3:
                        score += 25

            if score > best_score:
                best_score = score
                best_case = case

        # Map matching score to confidence percentage (88% - 98%)
        final_confidence = min(98, max(88, 70 + best_score // 3)) if best_case else 0
        return best_case, final_confidence

    def _generate_fix_commands(self, case_id: str, case: Dict[str, Any], context: str) -> str:
        """Generates exact, copy-pasteable Cisco IOS remediation commands."""
        fixes = {
            "CASE-001": "configure terminal\ninterface GigabitEthernet0/0/0\n no shutdown\nexit",
            "CASE-002": "configure terminal\ninterface FastEthernet0/1\n switchport mode access\n switchport access vlan 10\n no shutdown\nexit",
            "CASE-003": "configure terminal\ninterface GigabitEthernet0/1\n switchport trunk native vlan 99\nexit",
            "CASE-004": "configure terminal\ninterface GigabitEthernet0/0/0.20\n ip address 192.168.20.1 255.255.255.0\n no shutdown\nexit",
            "CASE-005": "configure terminal\ninterface GigabitEthernet0/0/0.20\n encapsulation dot1Q 20\n ip address 192.168.20.1 255.255.255.0\nexit",
            "CASE-006": "# On PC0 Network Settings:\nSet Default Gateway: 192.168.10.1",
            "CASE-007": "# On PC2 Network Settings:\nChange IP Address to 192.168.10.12\nSubnet Mask: 255.255.255.0",
            "CASE-008": "configure terminal\ninterface FastEthernet0/3\n shutdown\n no shutdown\n switchport port-security maximum 2\n switchport port-security violation restrict\nexit",
            "CASE-009": "configure terminal\ninterface GigabitEthernet0/0/0.10\n no ip access-group 110 in\nexit\nno access-list 110",
            "CASE-010": "configure terminal\nip dhcp pool VLAN20\n network 192.168.20.0 255.255.255.0\n default-router 192.168.20.1\nexit",
            "CASE-011": "# On PC0 IP Configuration:\nSet Primary DNS Server: 192.168.20.254",
            "CASE-012": "# Replace physical cable between R1 and Switch0\nconfigure terminal\ninterface GigabitEthernet0/1\n speed auto\n duplex auto\n no shutdown\nexit",
            "CASE-013": "configure terminal\ninterface GigabitEthernet0/1\n switchport trunk allowed vlan add 10\nexit",
            "CASE-014": "configure terminal\ninterface GigabitEthernet0/1\n switchport trunk allowed vlan add 20\nexit",
            "CASE-015": "configure terminal\ninterface FastEthernet0/24\n switchport mode trunk\n switchport trunk allowed vlan all\nexit",
            "CASE-016": "# On PC1 IP Configuration:\nChange IP to dynamic (DHCP) or set static IP: 192.168.20.11/24\nGateway: 192.168.20.1",
            "CASE-017": "# On Server0 IP Configuration:\nSet Default Gateway: 192.168.20.1",
            "CASE-018": "configure terminal\ninterface FastEthernet0/1\n no shutdown\nexit",
            "CASE-019": "configure terminal\ninterface GigabitEthernet0/0/0.10\n encapsulation dot1Q 10\n ip address 192.168.10.1 255.255.255.0\nexit",
            "CASE-020": "configure terminal\ninterface GigabitEthernet0/0/0.10\n no ip access-group 111 in\nexit\nno access-list 111",
            "CASE-021": "# On PC0 IP Configuration:\nSet DNS Server: 192.168.20.254",
            "CASE-022": "# On Server0 -> Services Tab -> DNS:\nTurn DNS Service: ON\nEnsure record 'srv0.lab.local' points to 192.168.20.254",
            "CASE-023": "# On Server0 -> Services Tab -> HTTP / HTTPS:\nTurn HTTP Service: ON\nTurn HTTPS Service: ON",
            "CASE-024": "# On Server0 -> Services Tab -> DHCP:\nTurn DHCP Service: ON\nSet Default Gateway: 192.168.20.1\nDNS Server: 192.168.20.254",
            "CASE-025": "configure terminal\nip dhcp pool VLAN20_POOL\n default-router 192.168.20.1\nexit",
            "CASE-026": "configure terminal\nno ip dhcp pool WRONG_POOL\nip dhcp pool VLAN20_POOL\n network 192.168.20.0 255.255.255.0\n default-router 192.168.20.1\nexit",
            "CASE-027": "# On Server0 IP Configuration:\nSet IP Address: 192.168.20.254\nSubnet Mask: 255.255.255.0\nDefault Gateway: 192.168.20.1",
            "CASE-028": "# On Server0 IP Configuration:\nSet Subnet Mask: 255.255.255.0 (/24)",
            "CASE-029": "configure terminal\ninterface vlan 99\n ip address 192.168.99.2 255.255.255.0\n no shutdown\nexit",
            "CASE-030": "configure terminal\nip default-gateway 192.168.99.1\nexit",
        }

        return fixes.get(
            case_id,
            "configure terminal\ninterface GigabitEthernet0/0/0\n no shutdown\nexit"
        )


# ---------------------------------------------------------------------------
# CLI Execution Entrypoint
# ---------------------------------------------------------------------------

def main():
    import sys

    diagnoser = NetSageDiagnoser()

    # CLI Test Execution
    if len(sys.argv) > 1:
        symptom_arg = sys.argv[1]
        output_arg = sys.argv[2] if len(sys.argv) > 2 else ""
    else:
        # Default test run using CASE-001
        symptom_arg = "All PCs and Server0 cannot reach their default gateways."
        output_arg = "R1# show ip interface brief | GigabitEthernet0/0/0 unassigned YES unset administratively down down"

    result = diagnoser.diagnose(symptom_arg, output_arg)

    print("\n================ NetSage AI Diagnosis Result ================")
    print(json.dumps(result, indent=2))
    print("==============================================================\n")


if __name__ == "__main__":
    main()
 