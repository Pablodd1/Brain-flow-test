# Coherence™ Mission Control Security Specifications

This document outlines the strict data invariants and security bounds for our Firestore collections, followed by the "Dirty Dozen" theoretical attack payloads and their expected permission denials.

## 1. Data Invariants

### User Profiles (`users/{userId}`)
*   **Identity Pinning**: A clinician's user profile document ID must strictly match their authenticated Firebase UID (`userId`).
*   **PII Isolation**: Reading of a profile document is restricted exclusively to the profile owner.
*   **Immutability**: Once registered, the user's `email`, `userId`, and `createdAt` cannot be altered.

### Clinical Encounters (`encounters/{encounterId}`)
*   **Ownership Pinning**: The `ownerId` of the encounter must match the active clinician's Firebase UID. No clinician can read or edit another clinician's sessions (Zero-Trust isolation).
*   **Boundary Enforcement**: The `currentEngine` must be an integer between `1` and `10` inclusive.
*   **Size Constraints**: String fields (like `patientName`, `preVisitIntake`, `notes`) must have bounded characters (e.g., `<= 200` to `<= 5000`) to block Denial-of-Wallet resource exhaustion.
*   **Terminal Value Protection**: When `status` is Set to `"completed"`, no fields other than clinician records can be modified, protecting clinical data integrity from retrospective manipulation.
*   **Temporal Integrity**: `createdAt` and `updatedAt` must sync with the exact server-provided time (`request.time`).

---

## 2. The "Dirty Dozen" Malicious Payloads (Vulnerability Controls)

The following payloads attempt to violate security boundaries and must result in `PERMISSION_DENIED`:

1.  **Payload A (Privilege Escalation in Profile)**: An authorized user attempts to rewrite their ID or insert additional unauthorized credentials in their profile document path.
2.  **Payload B (Identity Theft in Profile Create)**: Clinician `A` attempts to create a profile under clinician `B`'s UID path.
3.  **Payload C (Identity Spoofing in Session Create)**: Clinician `A` attempts to create an encounter setting `ownerId` to clinician `B`.
4.  **Payload D (State-Machine Shortcircuiting)**: Clinician attempts to set `currentEngine` to `15` (out of bounds).
5.  **Payload E (Resource Poisoning via Oversized Patient Name)**: Clinician attempts to write a patient name of `500,000` characters to crash the database pricing tier.
6.  **Payload F (Unrestricted List Scraping)**: A non-owner attempts to query the collection `/encounters/` without checking ownership.
7.  **Payload G (Session Hijacking in Update)**: Clinician `B` attempts to read or update Clinician `A`'s encounter details.
8.  **Payload H (Time-Stamp Tampering)**: Clinician attempts to provide a client-side timestamp in the past for `createdAt` during a new encounter creation.
9.  **Payload I (Terminal State Override)**: Clinician attempts to change the `patientName` of an encounter whose status has already been marked as `"completed"`.
10. **Payload J (Orphaned Record Creation)**: Creating an encounter with empty mandatory fields (e.g. Missing `currentEngine`).
11. **Payload K (Unverified Email Write)**: A clinician with `email_verified == false` attempts to write data, triggering a safety block.
12. **Payload L (System Override Forgery)**: A client directly attempts to manipulate unallocated administrative rules using arbitrary field injection.
