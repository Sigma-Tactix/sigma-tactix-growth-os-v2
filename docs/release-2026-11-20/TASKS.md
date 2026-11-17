# Agent task index

Revision 3 adds S22 independent certification. All implementation and application acceptance tasks remain pending. UI inspection is recorded separately in certification/.

| ID | Gate | Role | Depends on | Objective |
| --- | --- | --- | --- | --- |
| S00 | M0 | product | None | Audit every page claim and button for client usefulness |
| S01 | M0 | research | None | Users, jobs and required operation freeze |
| S03 | M0 | integrator | None | Initialize current checkout, runtimes and baseline |
| S02 | M0 | integrator | S01, S03, S00 | Freeze shared contracts and task ownership |
| S04 | M1 | platform | S03 | Prove deployed frontend and API topology |
| S05 | M1 | platform | S02 | Durable Client Enclave lifecycle |
| S06 | M1 | platform | S05 | Enforce selected-client request scope |
| S07 | M1 | platform | S02, S06 | Truthful durable approval and run states |
| S08 | M2 | platform | S02, S04 | Operation-level capabilities and receipts |
| S09 | M2 | product | S02, S06 | VANTA page context and attachments everywhere |
| S10 | M2 | platform | S07, S08 | Typed VANTA tool gateway and consent |
| S11 | M2 | platform | S10 | Isolated browser and file runtime |
| S12 | M2 | platform | S07, S10 | Durable worker, cron and hooks |
| S13 | M3 | platform | S06, S08 | Verify source operations and baseline |
| S14 | M3 | product | S01, S02, S00 | Concise sequential module experience |
| S16 | M3 | product | S02, S13 | Polished PDF PPTX XLSX delivery |
| S15 | M3 | qa | S08, S09, S10, S13, S14, S16 | Verify every released module journey |
| S17 | M4 | qa | S04, S06, S07, S10, S11, S12 | Adversarial isolation and security evidence |
| S19 | M5 | platform | S04, S07, S12 | Operate recover and rollback |
| S18 | M4 | qa | S09, S12, S13, S15, S16, S17, S21 | Fresh-session complete delivery rehearsal |
| S20 | M6 | integrator | S18, S19, S22 | Release exact verified candidate |
| S21 | M4 | product | S07, S10, S16 | Demonstrate development and client learning loops |
| S22 | M6 | qa | S18, S19 | Independent autonomous delivery certification gate |
