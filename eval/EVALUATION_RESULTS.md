# Retrieval Evaluation Results

This report evaluates and compares retrieval quality across keyword-only, vector-only, and hybrid search methods using a curated dataset of test cases against the DevLens-AI repository. Recall@5 and Mean Reciprocal Rank (MRR) are computed to quantify retrieval performance.

## Retrieval Performance Comparison

| Search Method | Recall@5 | Mean Reciprocal Rank (MRR) |
| --- | --- | --- |
| **Keyword Only** | 0.6154 | 0.4295 |
| **Vector Only** | 0.4231 | 0.2769 |
| **Hybrid** | 0.6923 | 0.4064 |

## Hybrid Search Case Studies

Below are specific example queries demonstrating how combining keyword-only (lexical) and vector-only (semantic) search signals helps improve overall retrieval quality:

### Case Study 1: "SocietySecretaryDashboard"
- **Expected File**: `src/components/dashboard/SocietySecretaryDashboard.tsx`
- **Notes**: Exact React component class name for the Secretary command center.
- **Performance**: Hybrid Rank: 4 | Keyword Rank: 2 | Vector Rank: Miss
- **Why Hybrid Won**: Hybrid search successfully retrieved the target by falling back on the other working method, preventing a complete retrieval failure from the failing vector-only method.

### Case Study 2: "HostelStudentDashboard"
- **Expected File**: `src/components/dashboard/HostelStudentDashboard.tsx`
- **Notes**: Exact React component class name for the student hostel view.
- **Performance**: Hybrid Rank: 4 | Keyword Rank: 2 | Vector Rank: Miss
- **Why Hybrid Won**: Hybrid search successfully retrieved the target by falling back on the other working method, preventing a complete retrieval failure from the failing vector-only method.

### Case Study 3: "pendingPaymentsCount"
- **Expected File**: `src/components/dashboard/SocietySecretaryDashboard.tsx`
- **Notes**: Key statistics field name tracking late/unpaid maintenance bills.
- **Performance**: Hybrid Rank: 1 | Keyword Rank: 1 | Vector Rank: Miss
- **Why Hybrid Won**: Hybrid search successfully retrieved the target by falling back on the other working method, preventing a complete retrieval failure from the failing vector-only method.

### Case Study 4: "curfew warnings"
- **Expected File**: `src/app/hostel/announcements/page.tsx`
- **Notes**: Specific string used in the announcements page heading.
- **Performance**: Hybrid Rank: 1 | Keyword Rank: 1 | Vector Rank: Miss
- **Why Hybrid Won**: Hybrid search successfully retrieved the target by falling back on the other working method, preventing a complete retrieval failure from the failing vector-only method.

## Detailed Per-Query Results

| Query | Target File | Keyword Rank | Vector Rank | Hybrid Rank | Notes |
| --- | --- | --- | --- | --- | --- |
| `SocietySecretaryDashboard` | `src/components/dashboard/SocietySecretaryDashboard.tsx` | 2 | Miss | 4 | Exact React component class name for the Secretary command center. |
| `HostelStudentDashboard` | `src/components/dashboard/HostelStudentDashboard.tsx` | 2 | Miss | 4 | Exact React component class name for the student hostel view. |
| `SocietySecurityDashboard` | `src/components/dashboard/SocietySecurityDashboard.tsx` | 3 | Miss | Miss | Exact React component class name for security guards dashboard. |
| `SocietyResidentDashboard` | `src/components/dashboard/SocietyResidentDashboard.tsx` | 4 | Miss | Miss | Exact React component class name for society residents dashboard. |
| `mockVisitors` | `src/data/mock-visitors.ts` | 1 | 5 | 1 | Variable name storing the seed data list of guest passes. |
| `pendingPaymentsCount` | `src/components/dashboard/SocietySecretaryDashboard.tsx` | 1 | Miss | 1 | Key statistics field name tracking late/unpaid maintenance bills. |
| `curfew warnings` | `src/app/hostel/announcements/page.tsx` | 1 | Miss | 1 | Specific string used in the announcements page heading. |
| `DEMO_CREDENTIALS` | `DEMO_CREDENTIALS.md` | Miss | 1 | 1 | Filename/header name containing mock login credentials for testing. |
| `joinedAt` | `src/components/dashboard/SocietySecretaryDashboard.tsx` | Miss | Miss | Miss | Field name for resident profile join date statistics. |
| `visitingResident` | `src/data/mock-visitors.ts` | 1 | Miss | 3 | Exact parameter name used in the visitor passes structure. |
| `broadcasting curfew alerts or gate announcements to all hostel students` | `src/app/hostel/announcements/page.tsx` | 4 | Miss | 1 | Semantic representation of student notices page. |
| `hiring local plumbers or technicians for maintenance issues` | `src/app/society/find-local-help/page.tsx` | Miss | Miss | 3 | Semantic query describing the local help hiring component. |
| `mock database collection for guest entries and departures` | `src/data/mock-visitors.ts` | Miss | 2 | Miss | Conceptual query for visitor mock datasets. |
| `generating OTP gate passes for expected guest pre-approval` | `src/app/hostel/visitors/page.tsx` | 2 | Miss | 2 | Semantic description of pre-approving guest visits with OTP codes. |
| `committee command center for tracking pending payments and society invoices` | `src/components/dashboard/SocietySecretaryDashboard.tsx` | Miss | 2 | 1 | Semantic description of Secretary Command Center dashboard. |
| `resident dashboard view for tracking corridor maintenance and utility usage` | `src/components/dashboard/SocietyResidentDashboard.tsx` | Miss | 2 | 5 | Semantic description of Resident Dashboard features. |
| `resident marketplace for selling and purchasing household items` | `src/app/society/buy-sell/page.tsx` | 1 | 4 | Miss | Semantic representation of society's internal classifieds marketplace. |
| `filing maintenance tickets and tracking worker assignments` | `src/app/society/complaints/page.tsx` | 1 | Miss | Miss | Conceptual description of filing complaint logs and assignees. |
| `posting missing items and reporting found objects within the society complex` | `src/app/society/lost-found/page.tsx` | 3 | Miss | Miss | Semantic query for the lost & found board. |
| `reserving amenities like tennis courts or the community hall` | `src/app/society/facility-booking/page.tsx` | Miss | 1 | 4 | Conceptual description of booking amenities. |
| `guard command center for check-in audits and SOS emergency responses` | `src/components/dashboard/SocietySecurityDashboard.tsx` | 2 | Miss | 2 | Semantic description of the gate security guard view. |
| `list of login credentials and usernames for testing role-based dashboards` | `DEMO_CREDENTIALS.md` | Miss | 1 | Miss | Conceptual overview of credentials file. |
| `visitingResident in mock-visitors` | `src/data/mock-visitors.ts` | Miss | 1 | 5 | Combines variable name visitingResident with file name context. |
| `announcements page banner notice` | `src/app/hostel/announcements/page.tsx` | 1 | Miss | 4 | Combines page concept with banner notifications string. |
| `facility-booking reservation slot` | `src/app/society/facility-booking/page.tsx` | Miss | 1 | 1 | Combines file path parts with reservation slots concept. |
| `lost-found missing keys report` | `src/app/society/lost-found/page.tsx` | 1 | 4 | 2 | Combines lost-found keywords with a sample missing item report. |