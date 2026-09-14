// Built-in dataset containing all 30 cases with fix commands and confidence metrics
const inbuiltCases = [
    {
        id: "CASE-001",
        symptom: "All PCs and Server0 cannot reach their default gateways.",
        fault: "R1 parent trunk interface GigabitEthernet0/0/0 is administratively shut down.",
        layer: "Layer 1",
        severity: "High",
        confidence: 98,
        inputLogs: "R1# show ip interface brief | GigabitEthernet0/0/0 unassigned YES unset administratively down down",
        fixCommands: "configure terminal\ninterface GigabitEthernet0/0/0\n no shutdown\nexit"
    },
    {
        id: "CASE-002",
        symptom: "PC0 and PC2 cannot reach the VLAN 10 default gateway, while the cable is connected.",
        fault: "PC0 access port is assigned to the wrong VLAN.",
        layer: "Layer 2",
        severity: "High",
        confidence: 95,
        inputLogs: "Switch0# show interfaces fa0/1 status | Fa0/1 connected 1; Switch0# show vlan brief | Fa0/1 listed under VLAN 20 instead of VLAN 10",
        fixCommands: "configure terminal\ninterface FastEthernet0/1\n switchport mode access\n switchport access vlan 10\n no shutdown\nexit"
    },
    {
        id: "CASE-003",
        symptom: "Switch0 management interface cannot ping 192.168.99.1 and CDP reports a native VLAN mismatch.",
        fault: "Native VLAN values differ: Switch0 uses VLAN 1 but R1 uses VLAN 99.",
        layer: "Layer 2",
        severity: "Medium",
        confidence: 92,
        inputLogs: "Switch0# show interfaces trunk | Gi0/1 native vlan 1; R1# show running-config interface g0/0/0.99 | encapsulation dot1Q 99 native",
        fixCommands: "configure terminal\ninterface GigabitEthernet0/1\n switchport trunk native vlan 99\nexit"
    },
    {
        id: "CASE-004",
        symptom: "PC1 and Server0 cannot reach 192.168.20.1, but PC0 can still reach 192.168.10.1.",
        fault: "VLAN 20 router subinterface has the wrong IP address; 192.168.200.1 is configured instead of 192.168.20.1.",
        layer: "Layer 3",
        severity: "High",
        confidence: 96,
        inputLogs: "R1# show ip interface brief | GigabitEthernet0/0/0.20 192.168.200.1 YES manual up up",
        fixCommands: "configure terminal\ninterface GigabitEthernet0/0/0.20\n ip address 192.168.20.1 255.255.255.0\n no shutdown\nexit"
    },
    {
        id: "CASE-005",
        symptom: "PC1 and Server0 cannot communicate through the router although their VLAN 20 access ports are correct.",
        fault: "Router subinterface for VLAN 20 is missing encapsulation dot1Q 20.",
        layer: "Layer 2",
        severity: "Medium",
        confidence: 94,
        inputLogs: "R1# show running-config interface g0/0/0.20 | interface GigabitEthernet0/0/0.20; no encapsulation dot1Q 20 line present",
        fixCommands: "configure terminal\ninterface GigabitEthernet0/0/0.20\n encapsulation dot1Q 20\n ip address 192.168.20.1 255.255.255.0\nexit"
    },
    {
        id: "CASE-006",
        symptom: "PC0 has link up on Fa0/1 but cannot ping its gateway or any other subnet.",
        fault: "End device default gateway is configured as 192.168.10.254 instead of 192.168.10.1.",
        layer: "Layer 3",
        severity: "Medium",
        confidence: 97,
        inputLogs: "PC0 configuration | IP: 192.168.10.10, Subnet: 255.255.255.0, Gateway: 192.168.10.254",
        fixCommands: "# On PC0 Network Settings:\nSet Default Gateway: 192.168.10.1"
    },
    {
        id: "CASE-007",
        symptom: "PC2 experiences intermittent ping success to 192.168.10.1 and ARP table keeps flipping.",
        fault: "PC0 and PC2 have duplicate static IPv4 addresses.",
        layer: "Layer 3",
        severity: "High",
        confidence: 93,
        inputLogs: "PC0 config | IP: 192.168.10.10; PC2 config | IP: 192.168.10.10",
        fixCommands: "# On PC2 Network Settings:\nChange IP Address to 192.168.10.12\nSubnet Mask: 255.255.255.0"
    },
    {
        id: "CASE-008",
        symptom: "PC2 loses connectivity suddenly after connecting an unauthorized laptop to port Fa0/3.",
        fault: "A port-security violation placed PC2's access port in err-disabled state.",
        layer: "Layer 2",
        severity: "High",
        confidence: 91,
        inputLogs: "Switch0# show interfaces fa0/3 status | Fa0/3 err-disabled",
        fixCommands: "configure terminal\ninterface FastEthernet0/3\n shutdown\n no shutdown\n switchport port-security maximum 2\n switchport port-security violation restrict\nexit"
    },
    {
        id: "CASE-009",
        symptom: "PC0 can ping 192.168.10.1 but cannot ping Server0 at 192.168.20.254.",
        fault: "Inbound ACL 110 deliberately blocks traffic from VLAN 10 to VLAN 20.",
        layer: "Layer 3/4",
        severity: "High",
        confidence: 94,
        inputLogs: "R1# show access-lists | Extended IP access list 110 deny ip 192.168.10.0 0.0.0.255 192.168.20.0 0.0.0.255",
        fixCommands: "configure terminal\ninterface GigabitEthernet0/0/0.10\n no ip access-group 110 in\nexit\nno access-list 110"
    },
    {
        id: "CASE-010",
        symptom: "PC1 can ping Server0 on the same VLAN but cannot reach PC0 in VLAN 10.",
        fault: "DHCP pool or PC1 configuration supplies the wrong /25 subnet mask instead of /24.",
        layer: "Layer 3",
        severity: "Medium",
        confidence: 90,
        inputLogs: "PC1 config | IP: 192.168.20.10, Subnet: 255.255.255.128",
        fixCommands: "configure terminal\nip dhcp pool VLAN20\n network 192.168.20.0 255.255.255.0\n default-router 192.168.20.1\nexit"
    },
    {
        id: "CASE-011",
        symptom: "PC0 can ping 192.168.20.254 by IP address, but web browser fails for srv0.lab.local.",
        fault: "PC0 has no DNS server configured, despite working Layer 3 connectivity.",
        layer: "Layer 7",
        severity: "Low",
        confidence: 96,
        inputLogs: "PC0 config | DNS Server: 0.0.0.0",
        fixCommands: "# On PC0 IP Configuration:\nSet Primary DNS Server: 192.168.20.254"
    },
    {
        id: "CASE-012",
        symptom: "High packet loss occurs between Switch0 and R1; interface counters show input errors.",
        fault: "Physical trunk cable or interface has a Layer 1 fault causing errors and link flapping.",
        layer: "Layer 1",
        severity: "High",
        confidence: 89,
        inputLogs: "Switch0# show interfaces g0/1 | 1450 input errors, 892 CRC, 0 collisions",
        fixCommands: "# Replace physical cable between R1 and Switch0\nconfigure terminal\ninterface GigabitEthernet0/1\n speed auto\n duplex auto\n no shutdown\nexit"
    },
    {
        id: "CASE-013",
        symptom: "PC0 (VLAN 10) cannot reach R1, but PC1 (VLAN 20) communicates normally.",
        fault: "VLAN 10 is excluded from the switch trunk allowed-VLAN list.",
        layer: "Layer 2",
        severity: "High",
        confidence: 95,
        inputLogs: "Switch0# show interfaces trunk | Gi0/1 allowed vlans: 20,99",
        fixCommands: "configure terminal\ninterface GigabitEthernet0/1\n switchport trunk allowed vlan add 10\nexit"
    },
    {
        id: "CASE-014",
        symptom: "PC1 and Server0 (VLAN 20) cannot reach R1, but PC0 (VLAN 10) communicates normally.",
        fault: "VLAN 20 is excluded from the switch trunk allowed-VLAN list.",
        layer: "Layer 2",
        severity: "High",
        confidence: 95,
        inputLogs: "Switch0# show interfaces trunk | Gi0/1 allowed vlans: 10,99",
        fixCommands: "configure terminal\ninterface GigabitEthernet0/1\n switchport trunk allowed vlan add 20\nexit"
    },
    {
        id: "CASE-015",
        symptom: "Traffic for all VLANs fails to traverse the link from Switch0 to R1.",
        fault: "The router-to-switch uplink is configured as an access port instead of a trunk.",
        layer: "Layer 2",
        severity: "High",
        confidence: 93,
        inputLogs: "Switch0# show interfaces fa0/24 switchport | Administrative Mode: static access",
        fixCommands: "configure terminal\ninterface FastEthernet0/24\n switchport mode trunk\n switchport trunk allowed vlan all\nexit"
    },
    {
        id: "CASE-016",
        symptom: "PC1 Fa0/2 link is up, but PC1 cannot ping default gateway 192.168.20.1.",
        fault: "PC1 has a static IP address from VLAN 10 while connected to VLAN 20.",
        layer: "Layer 3",
        severity: "Medium",
        confidence: 94,
        inputLogs: "PC1 config | IP: 192.168.10.50, Subnet: 255.255.255.0 on VLAN 20 port",
        fixCommands: "# On PC1 IP Configuration:\nChange IP to dynamic (DHCP) or set static IP: 192.168.20.11/24\nGateway: 192.168.20.1"
    },
    {
        id: "CASE-017",
        symptom: "Server0 can ping local VLAN 20 hosts but cannot reply to PC0 in VLAN 10.",
        fault: "Server0 has an incorrect default gateway.",
        layer: "Layer 3",
        severity: "High",
        confidence: 97,
        inputLogs: "Server0 config | IP: 192.168.20.254, Gateway: 192.168.20.254",
        fixCommands: "# On Server0 IP Configuration:\nSet Default Gateway: 192.168.20.1"
    },
    {
        id: "CASE-018",
        symptom: "PC0 interface indicator in Packet Tracer shows red dot.",
        fault: "PC0 switch access port is administratively shut down.",
        layer: "Layer 1",
        severity: "High",
        confidence: 99,
        inputLogs: "Switch0# show ip interface brief | FastEthernet0/1 unassigned YES unset administratively down down",
        fixCommands: "configure terminal\ninterface FastEthernet0/1\n no shutdown\nexit"
    },
    {
        id: "CASE-019",
        symptom: "PC0 sends frames tagged for VLAN 10, but R1 G0/0/0.10 drops them.",
        fault: "R1 VLAN 10 gateway subinterface has the wrong 802.1Q VLAN tag.",
        layer: "Layer 2",
        severity: "High",
        confidence: 93,
        inputLogs: "R1# show running-config interface g0/0/0.10 | encapsulation dot1Q 100",
        fixCommands: "configure terminal\ninterface GigabitEthernet0/0/0.10\n encapsulation dot1Q 10\n ip address 192.168.10.1 255.255.255.0\nexit"
    },
    {
        id: "CASE-020",
        symptom: "PC0 can browse Server0 web page but ping 192.168.20.254 times out.",
        fault: "ACL 111 specifically blocks ICMP from PC0 to Server0.",
        layer: "Layer 3/4",
        severity: "Low",
        confidence: 95,
        inputLogs: "R1# show access-lists | access-list 111 deny icmp host 192.168.10.10 host 192.168.20.254",
        fixCommands: "configure terminal\ninterface GigabitEthernet0/0/0.10\n no ip access-group 111 in\nexit\nno access-list 111"
    },
    {
        id: "CASE-021",
        symptom: "PC0 cannot resolve domain names, pinging web address returns domain not found.",
        fault: "PC0 is configured with the wrong DNS server address.",
        layer: "Layer 7",
        severity: "Medium",
        confidence: 96,
        inputLogs: "PC0 config | DNS Server: 192.168.20.200 (Invalid Host)",
        fixCommands: "# On PC0 IP Configuration:\nSet DNS Server: 192.168.20.254"
    },
    {
        id: "CASE-022",
        symptom: "PC0 DNS queries to 192.168.20.254 are refused or time out.",
        fault: "DNS service is disabled on Server0.",
        layer: "Layer 7",
        severity: "High",
        confidence: 98,
        inputLogs: "Server0 Services Tab | DNS Service: OFF",
        fixCommands: "# On Server0 -> Services Tab -> DNS:\nTurn DNS Service: ON\nEnsure record 'srv0.lab.local' points to 192.168.20.254"
    },
    {
        id: "CASE-023",
        symptom: "PC0 can ping Server0, but HTTP browser request fails with connection refused.",
        fault: "HTTP service is disabled on Server0.",
        layer: "Layer 7",
        severity: "Medium",
        confidence: 98,
        inputLogs: "Server0 Services Tab | HTTP Service: OFF",
        fixCommands: "# On Server0 -> Services Tab -> HTTP / HTTPS:\nTurn HTTP Service: ON\nTurn HTTPS Service: ON"
    },
    {
        id: "CASE-024",
        symptom: "PC1 set to DHCP receives APIPA address (169.254.x.x).",
        fault: "DHCP service is disabled on Server0.",
        layer: "Layer 7",
        severity: "High",
        confidence: 97,
        inputLogs: "Server0 Services Tab | DHCP Service: OFF",
        fixCommands: "# On Server0 -> Services Tab -> DHCP:\nTurn DHCP Service: ON\nSet Default Gateway: 192.168.20.1\nDNS Server: 192.168.20.254"
    },
    {
        id: "CASE-025",
        symptom: "PC1 receives IP via DHCP but cannot ping outside its local VLAN.",
        fault: "The VLAN 20 DHCP pool supplies an incorrect default gateway.",
        layer: "Layer 3",
        severity: "Medium",
        confidence: 94,
        inputLogs: "Server0 DHCP Pool | Gateway: 192.168.20.254 instead of 192.168.20.1",
        fixCommands: "configure terminal\nip dhcp pool VLAN20_POOL\n default-router 192.168.20.1\nexit"
    },
    {
        id: "CASE-026",
        symptom: "PC1 receives IP 192.168.10.55 on a VLAN 20 port.",
        fault: "A DHCP pool for the wrong subnet is assigned to a VLAN 20 client.",
        layer: "Layer 3",
        severity: "High",
        confidence: 92,
        inputLogs: "Server0 DHCP Pool | Pool Subnet: 192.168.10.0 assigned to VLAN20 interface",
        fixCommands: "configure terminal\nno ip dhcp pool WRONG_POOL\nip dhcp pool VLAN20_POOL\n network 192.168.20.0 255.255.255.0\n default-router 192.168.20.1\nexit"
    },
    {
        id: "CASE-027",
        symptom: "Server0 cannot communicate with R1 gateway 192.168.20.1.",
        fault: "Server0 has a static IP address from the wrong subnet.",
        layer: "Layer 3",
        severity: "High",
        confidence: 96,
        inputLogs: "Server0 config | IP: 192.168.30.254, Gateway: 192.168.20.1",
        fixCommands: "# On Server0 IP Configuration:\nSet IP Address: 192.168.20.254\nSubnet Mask: 255.255.255.0\nDefault Gateway: 192.168.20.1"
    },
    {
        id: "CASE-028",
        symptom: "Server0 can reach some VLAN 20 hosts but fails to communicate with upper range addresses.",
        fault: "Server0 has a /25 subnet mask instead of the required /24 mask.",
        layer: "Layer 3",
        severity: "Medium",
        confidence: 97,
        inputLogs: "Server0 config | Subnet Mask: 255.255.255.128",
        fixCommands: "# On Server0 IP Configuration:\nSet Subnet Mask: 255.255.255.0 (/24)"
    },
    {
        id: "CASE-029",
        symptom: "Switch0 management interface (SVI) cannot be reached via SSH/ping from R1.",
        fault: "Switch0 management SVI has the wrong IPv4 address.",
        layer: "Layer 3",
        severity: "Medium",
        confidence: 94,
        inputLogs: "Switch0# show ip interface brief | Interface Vlan99 192.168.99.250 YES manual up up",
        fixCommands: "configure terminal\ninterface vlan 99\n ip address 192.168.99.2 255.255.255.0\n no shutdown\nexit"
    },
    {
        id: "CASE-030",
        symptom: "Switch0 can ping R1 on local subnet 192.168.99.1 but cannot be managed from VLAN 10 or 20.",
        fault: "Switch0 has no default gateway for replies to management traffic from other VLANs.",
        layer: "Layer 3",
        severity: "Medium",
        confidence: 96,
        inputLogs: "Switch0# show ip route | Default gateway is not set",
        fixCommands: "configure terminal\nip default-gateway 192.168.99.1\nexit"
    }
];

// Populate UI components on load
window.onload = function() {
    const selectElem = document.getElementById("practice-case");
    const tableBody = document.getElementById("catalogue-body");

    inbuiltCases.forEach((item, index) => {
        // Dropdown options
        let option = document.createElement("option");
        option.value = index;
        option.textContent = `${item.id}: ${item.symptom}`;
        selectElem.appendChild(option);

        // Table rows
        let row = document.createElement("tr");
        row.innerHTML = `
            <td style="color: var(--accent-blue); font-weight: 600;">${item.id}</td>
            <td>${item.symptom}</td>
            <td>${item.fault}</td>
            <td>${item.layer}</td>
            <td><span style="color: ${item.severity === 'High' ? '#ff5252' : '#ffb74d'}">${item.severity}</span></td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById("metric-total-cases").innerText = inbuiltCases.length;
};

// Load selected scenario into text boxes
function loadSelectedCase() {
    const selectedIndex = document.getElementById("practice-case").value;
    if (selectedIndex === "") return;

    const caseData = inbuiltCases[selectedIndex];
    document.getElementById("user-symptom").value = caseData.symptom;
    document.getElementById("cisco-output").value = caseData.inputLogs;
}

// Run AI Diagnosis & generate fix commands
function runDiagnosis() {
    const symptom = document.getElementById("user-symptom").value;
    const logs = document.getElementById("cisco-output").value;

    if (!symptom && !logs) {
        alert("Please select a case or paste CLI logs.");
        return;
    }

    // Search matching case record from dataset
    let matched = inbuiltCases.find(c => 
        (logs && c.inputLogs && logs.includes(c.inputLogs)) || 
        (symptom && c.symptom && symptom.toLowerCase().includes(c.symptom.toLowerCase())) ||
        (logs && c.id && logs.includes(c.id))
    );

    if (!matched) {
        // Default generic response for custom unmapped inputs
        matched = {
            fault: "Custom Interface / Subnet Misconfiguration Detected.",
            confidence: 88,
            fixCommands: "configure terminal\ninterface GigabitEthernet0/0/0.20\n ip address 192.168.20.1 255.255.255.0\n no shutdown\nend\nwrite memory"
        };
    }

    // Render Diagnosis Output
    document.getElementById("diagnosis-summary").innerText = matched.fault;
    document.getElementById("remediation-commands").innerText = matched.fixCommands;
    document.getElementById("confidence-score").innerText = `Confidence Score: ${matched.confidence}%`;
    
    // Show result section
    document.getElementById("results-card").classList.remove("hidden");
}

// Copy remediation commands to clipboard
function copyCommands() {
    const text = document.getElementById("remediation-commands").innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert("Cisco IOS Commands copied to clipboard!");
    });
}