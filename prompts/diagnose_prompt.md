import csv
import json
import os
import re
 
import anthropic
 
PROMPT_PATH = "../prompts/diagnose_prompt.md"
CASES_PATH = "../data/cases.csv"
RESULTS_PATH = "../data/ai_results.csv"
 
 
def load_prompt_file(path: str) -> str:
    if not os.path.exists(path):
        raise SystemExit(f"Prompt file not found: {path}")
    with open(path, encoding="utf-8") as f:
        return f.read()
 
 
def extract_section(markdown: str, start_heading: str, end_heading: str | None) -> str:
    """Return the text between two '## Heading' markers (end_heading exclusive).
    If end_heading is None, returns everything after start_heading."""
    start_match = re.search(rf"^##\s+{re.escape(start_heading)}\s*$", markdown, re.MULTILINE)
    if not start_match:
        raise SystemExit(f"Could not find section '## {start_heading}' in prompt file.")
    start = start_match.end()
 
    if end_heading is None:
        return markdown[start:].strip()
 
    end_match = re.search(rf"^##\s+{re.escape(end_heading)}\s*$", markdown[start:], re.MULTILINE)
    if not end_match:
        raise SystemExit(f"Could not find section '## {end_heading}' in prompt file.")
    return markdown[start:start + end_match.start()].strip()
 
 
def build_system_prompt(markdown: str) -> str:
    """System Prompt + Worked Examples sections = full system prompt context."""
    system_part = extract_section(markdown, "System Prompt", "Worked Examples (few-shot)")
    examples_part = extract_section(markdown, "Worked Examples (few-shot)", "User Prompt Template")
    return f"{system_part}\n\n{examples_part}"
 
 
def build_user_prompt_template(markdown: str) -> str:
    """Pull the ```-fenced template under '## User Prompt Template'."""
    section = extract_section(markdown, "User Prompt Template", None)
    fenced = re.search(r"```\s*\n(.*?)```", section, re.DOTALL)
    if not fenced:
        raise SystemExit("Could not find fenced template under 'User Prompt Template'.")
    return fenced.group(1).strip()
 
 
def render_user_prompt(template: str, case: dict) -> str:
    return template.format(
        symptom=case["symptom"],
        topology_note=case["topology_note"],
        show_output=case["show_output"],
    )
 
 
def parse_json_response(text: str) -> dict:
    """Strip any accidental markdown fences and parse JSON safely."""
    cleaned = re.sub(r"```json|```", "", text).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {"error": "Could not parse JSON", "raw_response": text}
 
 
def diagnose_case(client: anthropic.Anthropic, system_prompt: str,
                   user_template: str, case: dict) -> dict:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=system_prompt,
        messages=[{"role": "user", "content": render_user_prompt(user_template, case)}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    return parse_json_response(text)
 
 
def matches_expected(ai_root_cause: str, expected_fault: str) -> str:
    """Rough keyword-overlap check to flag cases worth a human review."""
    if not ai_root_cause or not expected_fault:
        return "unknown"
    ai_words = set(re.findall(r"[a-z0-9]+", ai_root_cause.lower()))
    exp_words = set(re.findall(r"[a-z0-9]+", expected_fault.lower()))
    exp_words -= {"the", "a", "an", "on", "in", "of", "to", "for", "not", "no"}
    overlap = ai_words & exp_words
    return "likely_match" if len(overlap) >= 2 else "review"
 
 
def main():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise SystemExit("Set ANTHROPIC_API_KEY before running this script.")
 
    markdown = load_prompt_file(PROMPT_PATH)
    system_prompt = build_system_prompt(markdown)
    user_template = build_user_prompt_template(markdown)
 
    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
 
    with open(CASES_PATH, newline="", encoding="utf-8") as f:
        cases = list(csv.DictReader(f))
 
    results = []
    for case in cases:
        print(f"Diagnosing {case['case_id']}...")
        diagnosis = diagnose_case(client, system_prompt, user_template, case)
        ai_root_cause = diagnosis.get("root_cause", "")
        results.append({
            "case_id": case["case_id"],
            "concept_tag": case.get("concept_tag", ""),
            "severity": case.get("severity", ""),
            "expected_fault": case["expected_fault"],
            "expected_osi_layer": case.get("osi_layer", ""),
            "ai_root_cause": ai_root_cause,
            "ai_confidence": diagnosis.get("confidence", ""),
            "ai_osi_layer": diagnosis.get("osi_layer", ""),
            "ai_evidence": diagnosis.get("evidence", ""),
            "ai_next_command": diagnosis.get("next_command", ""),
            "ai_fix_steps": " | ".join(diagnosis.get("fix_steps", [])),
            "review_flag": matches_expected(ai_root_cause, case["expected_fault"]),
        })
 
    fieldnames = list(results[0].keys()) if results else []
    with open(RESULTS_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
 
    print(f"\nSaved {len(results)} results to {RESULTS_PATH}")
 
 
if __name__ == "__main__":
    main()
 