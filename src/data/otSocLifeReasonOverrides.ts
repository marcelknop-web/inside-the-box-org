/**
 * OT-SOC Life: per-option, per-language rationales for the consequence overlay.
 *
 * English-only content per product decision (the OT variant ships in EN).
 * We still emit a {de, en, fr} object so the existing reasonFor() type stays
 * intact, but every locale points at the same English string.
 */

import type { Lang } from "@/data/socLifeData";

type Reason = Record<Lang, string>;
const R = (en: string): Reason => ({ de: en, en, fr: en });

export const OT_REASON_OVERRIDES: Record<string, Reason> = {
  // 1 — PLC write anomaly
  "plc_write_anomaly::verify::passive_pcap":  R("Passive SPAN preserves the process — and gives engineering the evidence to confirm intent."),
  "plc_write_anomaly::verify::active_scan":   R("Active scans on live OT segments may disrupt legacy PLCs mid-batch and are generally avoided as an initial step. Acceptable only with a documented window and engineering present."),
  "plc_write_anomaly::verify::ping_plc":      R("Even simple probes may impact fragile PLCs depending on vendor and firmware. Touching the process before you understand it is generally avoided."),
  "plc_write_anomaly::contain::conduit_acl":  R("Tightening the L3↔L2 conduit with shift-lead sign-off keeps the batch alive while killing the unauthorised path."),
  "plc_write_anomaly::contain::power_off_plc":R("Cutting power to a running PLC drops the batch and can damage equipment. Safety > Availability — but availability still beats nothing."),
  "plc_write_anomaly::contain::block_all_l2": R("Severing the whole L2/L3 boundary blinds the operator. You isolated the wrong layer."),
  "plc_write_anomaly::coord::safety_first":   R("Safety officer + engineering own the process risk. IT escalation is downstream of life-safety."),
  "plc_write_anomaly::coord::it_only":        R("Skipping the shift lead means the people who can actually stop or contain the process never get the call."),
  "plc_write_anomaly::coord::press_now":      R("Pre-warning press before engineering has a finding manufactures a crisis you don't yet have."),

  // 2 — EWS compromise
  "ews_compromise::scope::ot_telemetry":      R("Confirming whether the EWS already wrote to the PLC tells you if you have a security incident or a process incident."),
  "ews_compromise::scope::wipe_now":          R("Wiping destroys memory, registry, network state — every artefact you'd need to know what the attacker reached on the OT side."),
  "ews_compromise::scope::ask_engineer":      R("Calling the engineer over an unverified channel may alert the attacker if the account or workstation is already compromised. Use an out-of-band channel instead."),
  "ews_compromise::isolate::conduit_block":   R("Conduit-level block plus a backup EWS keeps engineering capable of intervening if the process drifts. Surgical."),
  "ews_compromise::isolate::shutdown_plant":  R("A precautionary plant stop costs more than the incident. OT contain ≠ shut down."),
  "ews_compromise::isolate::ad_disable":      R("AD lock alone leaves the local session and any cached engineering tokens fully alive on the EWS."),
  "ews_compromise::preserve::memory_then_disk":R("Memory first preserves processes, keys, conduit sessions. Disk image and chain-of-custody make it usable in a vendor or regulator dispute."),
  "ews_compromise::preserve::snapshot_only":  R("VM snapshot without a memory dump loses every running process — useless for OT investigation."),
  "ews_compromise::preserve::send_back":      R("Shipping the asset to the vendor breaks chain-of-custody and tips them off if they are the threat actor."),

  // 3 — SIS bypass
  "sis_bypass::verify::lock_safety_first":    R("Engaging the physical write-lock kills the attack vector immediately while you investigate. Safety is non-negotiable."),
  "sis_bypass::verify::wait_log":             R("Waiting on correlation while a SIS write attempt is live trades certainty for life-safety risk. Wrong trade."),
  "sis_bypass::verify::ask_vendor":           R("Email-only to a vendor on a SIL-2 incident burns hours you don't have. Engage safety on-site first."),
  "sis_bypass::contain::isolate_sis_zone":    R("Hard-segregating SIS from BPCS with key-switch enforcement is the textbook IEC 61511 / IEC 62443 response."),
  "sis_bypass::contain::stop_process":        R("An uncontrolled shutdown can introduce additional risk depending on process state; safety response must follow the defined procedure agreed with the safety officer, not be improvised by the SOC. SIS is your last line — keep it intact while you investigate."),
  "sis_bypass::contain::block_engineering":   R("Locking every engineering account globally creates an outage and stops the people who'd legitimately fix this."),
  "sis_bypass::report::regulator_loop":       R("SIS bypass attempts are reportable under Seveso and NIS-2. Plant management, safety committee and regulator on the matrix — not optional."),
  "sis_bypass::report::internal_only":        R("Withholding a confirmed SIS write attempt from the regulator is a compliance breach in its own right."),
  "sis_bypass::report::vendor_first":         R("The vendor isn't the duty-holder — you are."),

  // 4 — Vendor remote access
  "vendor_remote_access::verify::callback_known":  R("Out-of-band callback to the contracted hotline is the only way to confirm vendor identity that an attacker can't spoof."),
  "vendor_remote_access::verify::trust_session":   R("MFA proves a token, not intent. 03:14 with no maintenance window is exactly when you verify, not trust."),
  "vendor_remote_access::verify::kill_now":        R("Terminating an active engineering session without coordination may disrupt PLC programming or leave systems in an inconsistent state. Verify identity out-of-band before you sever."),
  "vendor_remote_access::contain::supervised_session":R("Supervised mode keeps the maintenance happening but under engineering eyes — least-privilege, not no-privilege."),
  "vendor_remote_access::contain::block_vendor_lan":R("Blanket-cutting the vendor VLAN orphans every legitimate ticket and damages the relationship without sharpening the control."),
  "vendor_remote_access::contain::snmp_trap":      R("An SNMP trap is not containment. The session is still live."),
  "vendor_remote_access::harden::policy_window":   R("JIT accounts in named windows with mandatory recording is the IEC 62443 reference pattern. Structural fix."),
  "vendor_remote_access::harden::vpn_only":        R("Adding another VPN layer doesn't change who can do what once they're in. Cosmetic."),
  "vendor_remote_access::harden::trust_contract":  R("Contract clauses don't enforce themselves at 03:14. Technical control or it didn't happen."),

  // 5 — ICS ransomware in DMZ
  "ics_ransomware_dmz::verify::edr_then_path": R("Confirming whether the ransomware already probed L3/L2 paths decides whether this is an IT problem or a plant emergency."),
  "ics_ransomware_dmz::verify::shutdown_dmz":  R("Clean shutdown loses memory and active C2 — you've blinded yourself to the lateral path."),
  "ics_ransomware_dmz::verify::wait_av":       R("Waiting for AV signatures while encryption is active gives the malware free time to reach the next zone."),
  "ics_ransomware_dmz::isolate::close_l3_l2":  R("Deny-by-default at the conduit with explicit allow-listing keeps the plant running while killing the lateral path."),
  "ics_ransomware_dmz::isolate::kill_all_ot":  R("Severing all IT/OT links blinds the operator and triggers cascading process trips. Over-isolation IS damage."),
  "ics_ransomware_dmz::isolate::leave_running":R("Attempting to gather additional IOCs while encryption is ongoing increases the risk of lateral movement toward L3/L2. IDMZ incidents become plant incidents this way."),
  "ics_ransomware_dmz::recover::verified_offline":R("Verified offline backup plus signed-update workflow rebuilds trust in the patch path. Without that, you reinstall the threat."),
  "ics_ransomware_dmz::recover::latest_online":R("Online backup may already be encrypted. Restoring blindly reinstates the damage."),
  "ics_ransomware_dmz::recover::rebuild_blind":R("Rebuild without root cause = same compromise next week, same vendor, same patch path."),

  // 6 — Historian tampering
  "historian_tampering::verify::compare_replica":R("Cross-checking edge replicas and paper logs is the only way to prove tampering versus drift, and preserves the audit trail."),
  "historian_tampering::verify::ask_operator":  R("Operator memory isn't evidence. GMP needs records, not recollection."),
  "historian_tampering::verify::delete_diff":   R("Deleting suspect rows is exactly the data-integrity violation you're trying to prove. Catastrophic."),
  "historian_tampering::preserve::snapshot_chain":R("Read-only snapshot plus chain-of-custody lets QA and the regulator trust your investigation."),
  "historian_tampering::preserve::live_query":  R("Some live queries may alter timestamps or system state, affecting evidentiary integrity on a GMP-relevant record. Snapshot first, then query the copy."),
  "historian_tampering::preserve::wait_qa":     R("Waiting a day on a GMP-relevant integrity issue can mean releasing affected batches in the meantime."),
  "historian_tampering::report::qa_compliance": R("QA, compliance, plant management and regulator on the matrix; affected batches blocked until clarified. By the book."),
  "historian_tampering::report::it_only":       R("This is a GMP issue first, an IT issue second. Wrong audience."),
  "historian_tampering::report::release_anyway":R("Releasing batches with known integrity doubt is a regulatory finding waiting to happen."),

  // 7 — Asset scan storm
  "asset_scan_storm::verify::stop_scan":        R("Stop the scan, then verify with the shift lead — that's the order that protects the process."),
  "asset_scan_storm::verify::let_finish":       R("'We want the report' isn't worth tripping live PLCs. Active scanning has no place in OT."),
  "asset_scan_storm::verify::restart_plc":      R("Restarting PLCs without root cause analysis may reintroduce the fault or destabilize the process — and erases volatile state engineering needs to diagnose it."),
  "asset_scan_storm::remediate::passive_only":  R("Passive discovery via SPAN gives you the inventory without ever touching the protocol stack. Standard practice."),
  "asset_scan_storm::remediate::ban_intern":    R("Firing someone instead of fixing a missing policy guarantees the next intern repeats the mistake."),
  "asset_scan_storm::remediate::no_change":     R("'They'll be careful next time' is not a control. Document the rule or expect repeat."),
  "asset_scan_storm::report::lessons_learned":  R("Lessons-learned in the register with owner and date turns a near-miss into a structural improvement."),
  "asset_scan_storm::report::hush":             R("Quiet near-misses are the ones that recur as real incidents."),
  "asset_scan_storm::report::blame_only":       R("Naming the intern in an all-hands replaces process improvement with a public flogging."),

  // 8 — L2 worm
  "l2_worm_outbreak::scope::graph_lateral":     R("A lateral-movement graph plus per-cell operator awareness is the only way to triage a multi-cell OT outbreak safely."),
  "l2_worm_outbreak::scope::endpoint_only":     R("Single-host deep dive on a worm leaves every other infected EWS free to keep spreading."),
  "l2_worm_outbreak::scope::ask_intern":        R("Asking around tips off the threat and yields no usable scope."),
  "l2_worm_outbreak::contain::cell_quarantine": R("Cell-by-cell quarantine with shift-lead prioritisation contains spread without taking the whole line down."),
  "l2_worm_outbreak::contain::kill_all_smb":    R("Blanket SMB block in OT breaks historian and engineering flows everyone depends on. Over-broad."),
  "l2_worm_outbreak::contain::shutdown_plant":  R("Stopping the line is the most expensive containment option and rarely the right one."),
  "l2_worm_outbreak::recover::golden_image_ews":R("Golden-image rebuild plus hardware USB lockdown plus signed engineering tools removes the vector, not just the symptom."),
  "l2_worm_outbreak::recover::av_scan_only":    R("AV scan finds yesterday's signatures. Today's worm survives untouched."),
  "l2_worm_outbreak::recover::reflash_plc":     R("Re-flashing PLCs without confirmed compromise introduces unnecessary process risk and downtime. Reserve firmware reloads for assets where the worm is evidenced on the controller itself."),

  // 9 — HMI default creds
  "hmi_default_creds::verify::internal_check":  R("Verify reachability and audit-log activity before announcing a breach you can't yet evidence."),
  "hmi_default_creds::verify::live_login":      R("Logging in with default credentials introduces audit and accountability issues and may trigger unintended system behavior. Confirm exposure from logs and a segregated probe instead."),
  "hmi_default_creds::verify::trust_intel":     R("Acting on a feed without verification can mean shutting down your own HMI on a false positive."),
  "hmi_default_creds::contain::edge_acl":       R("Edge allowlist + named accounts + MFA gives operators access while killing the attack surface. Standard hardening."),
  "hmi_default_creds::contain::shutdown_hmi":   R("Pulling the HMI mid-shift puts operators on flying blind. Contain at the edge, not the device."),
  "hmi_default_creds::contain::rename_user":    R("Renaming the user without changing the password is security theatre."),
  "hmi_default_creds::report::policy_audit":    R("Inventory sweep + report + action plan with owner and date is the only response that prevents recurrence."),
  "hmi_default_creds::report::blame_vendor":    R("Vendor blame doesn't change the asset on your network. Internal action required."),
  "hmi_default_creds::report::no_report":       R("'Nobody used it' is not a defence under NIS-2 or operator licence. Exposure is the incident."),

  // 10 — UPS tampering
  "ups_tampering::react::secure_then_ot":       R("Site security secures the place; OT engineering checks if the plant is actually running on UPS. Right roles, right order."),
  "ups_tampering::react::go_alone":             R("Entering a substation alone during a potential security incident violates safety procedures and may expose personnel to risk. Site security goes first, OT engineering follows."),
  "ups_tampering::react::panic_shutdown":       R("Precautionary plant shutdown for an unconfirmed substation event causes more damage than the event itself."),
  "ups_tampering::comms::shift_security_ciso":  R("Brief the people who can act, open the register entry. Factual, not dramatic."),
  "ups_tampering::comms::all_hands":            R("All-hands with a photo of an open door turns rumour into panic."),
  "ups_tampering::comms::silent":               R("Silence prevents the shift lead from preparing a contingency. Quiet ≠ safe."),
};

/** Lookup helper — same shape as the IT version. */
export function lookupOtReasonOverride(
  incidentId: string,
  stepId: string,
  optionId: string,
  lang: Lang,
): string | null {
  const key = `${incidentId}::${stepId}::${optionId}`;
  const entry = OT_REASON_OVERRIDES[key];
  return entry ? entry[lang] : null;
}
