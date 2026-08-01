# Evaluation Dataset for Hostel/Society App (repo_id: 1ace867376ce381c)
# A structured list of test cases for measuring retrieval quality.

TEST_CASES = [
    # --- KEYWORD-HEAVY QUERIES (Exact function/variable/component names) ---
    {
        "query": "SocietySecretaryDashboard",
        "expected_file_path": "src/components/dashboard/SocietySecretaryDashboard.tsx",
        "notes": "Exact React component class name for the Secretary command center."
    },
    {
        "query": "HostelStudentDashboard",
        "expected_file_path": "src/components/dashboard/HostelStudentDashboard.tsx",
        "notes": "Exact React component class name for the student hostel view."
    },
    {
        "query": "SocietySecurityDashboard",
        "expected_file_path": "src/components/dashboard/SocietySecurityDashboard.tsx",
        "notes": "Exact React component class name for security guards dashboard."
    },
    {
        "query": "SocietyResidentDashboard",
        "expected_file_path": "src/components/dashboard/SocietyResidentDashboard.tsx",
        "notes": "Exact React component class name for society residents dashboard."
    },
    {
        "query": "mockVisitors",
        "expected_file_path": "src/data/mock-visitors.ts",
        "notes": "Variable name storing the seed data list of guest passes."
    },
    {
        "query": "pendingPaymentsCount",
        "expected_file_path": "src/components/dashboard/SocietySecretaryDashboard.tsx",
        "notes": "Key statistics field name tracking late/unpaid maintenance bills."
    },
    {
        "query": "curfew warnings",
        "expected_file_path": "src/app/hostel/announcements/page.tsx",
        "notes": "Specific string used in the announcements page heading."
    },
    {
        "query": "DEMO_CREDENTIALS",
        "expected_file_path": "DEMO_CREDENTIALS.md",
        "notes": "Filename/header name containing mock login credentials for testing."
    },
    {
        "query": "joinedAt",
        "expected_file_path": "src/components/dashboard/SocietySecretaryDashboard.tsx",
        "notes": "Field name for resident profile join date statistics."
    },
    {
        "query": "visitingResident",
        "expected_file_path": "src/data/mock-visitors.ts",
        "notes": "Exact parameter name used in the visitor passes structure."
    },

    # --- VECTOR-HEAVY QUERIES (Paraphrased, conceptual, semantic language) ---
    {
        "query": "broadcasting curfew alerts or gate announcements to all hostel students",
        "expected_file_path": "src/app/hostel/announcements/page.tsx",
        "notes": "Semantic representation of student notices page."
    },
    {
        "query": "hiring local plumbers or technicians for maintenance issues",
        "expected_file_path": "src/app/society/find-local-help/page.tsx",
        "notes": "Semantic query describing the local help hiring component."
    },
    {
        "query": "mock database collection for guest entries and departures",
        "expected_file_path": "src/data/mock-visitors.ts",
        "notes": "Conceptual query for visitor mock datasets."
    },
    {
        "query": "generating OTP gate passes for expected guest pre-approval",
        "expected_file_path": "src/app/hostel/visitors/page.tsx",
        "notes": "Semantic description of pre-approving guest visits with OTP codes."
    },
    {
        "query": "committee command center for tracking pending payments and society invoices",
        "expected_file_path": "src/components/dashboard/SocietySecretaryDashboard.tsx",
        "notes": "Semantic description of Secretary Command Center dashboard."
    },
    {
        "query": "resident dashboard view for tracking corridor maintenance and utility usage",
        "expected_file_path": "src/components/dashboard/SocietyResidentDashboard.tsx",
        "notes": "Semantic description of Resident Dashboard features."
    },
    {
        "query": "resident marketplace for selling and purchasing household items",
        "expected_file_path": "src/app/society/buy-sell/page.tsx",
        "notes": "Semantic representation of society's internal classifieds marketplace."
    },
    {
        "query": "filing maintenance tickets and tracking worker assignments",
        "expected_file_path": "src/app/society/complaints/page.tsx",
        "notes": "Conceptual description of filing complaint logs and assignees."
    },
    {
        "query": "posting missing items and reporting found objects within the society complex",
        "expected_file_path": "src/app/society/lost-found/page.tsx",
        "notes": "Semantic query for the lost & found board."
    },
    {
        "query": "reserving amenities like tennis courts or the community hall",
        "expected_file_path": "src/app/society/facility-booking/page.tsx",
        "notes": "Conceptual description of booking amenities."
    },
    {
        "query": "guard command center for check-in audits and SOS emergency responses",
        "expected_file_path": "src/components/dashboard/SocietySecurityDashboard.tsx",
        "notes": "Semantic description of the gate security guard view."
    },
    {
        "query": "list of login credentials and usernames for testing role-based dashboards",
        "expected_file_path": "DEMO_CREDENTIALS.md",
        "notes": "Conceptual overview of credentials file."
    },

    # --- HYBRID/AMBIGUOUS QUERIES (Refers to both name and concept) ---
    {
        "query": "visitingResident in mock-visitors",
        "expected_file_path": "src/data/mock-visitors.ts",
        "notes": "Combines variable name visitingResident with file name context."
    },
    {
        "query": "announcements page banner notice",
        "expected_file_path": "src/app/hostel/announcements/page.tsx",
        "notes": "Combines page concept with banner notifications string."
    },
    {
        "query": "facility-booking reservation slot",
        "expected_file_path": "src/app/society/facility-booking/page.tsx",
        "notes": "Combines file path parts with reservation slots concept."
    },
    {
        "query": "lost-found missing keys report",
        "expected_file_path": "src/app/society/lost-found/page.tsx",
        "notes": "Combines lost-found keywords with a sample missing item report."
    }
]
