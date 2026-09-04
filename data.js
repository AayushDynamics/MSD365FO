// Central post data — add a new post by adding one object here
// and creating the matching HTML file in /posts/
const SITE_DATA = {
  modules: [
    "Accounts payable",
    "Accounts receivable",
    "Budgeting",
    "Cash and bank management",
    "Consolidations",
    "Cost accounting",
    "Expense management",
    "Fixed assets",
    "General ledger",
    "Inventory management",
    "Production control",
    "Tax"
  ],
  submodules: [
    "Maintaining Master Data",
    "How to Blogs",
    "Module related accounting",
    "Inquiries and reports",
    "Configurations and setups",
    "Major Functionalities"
  ],
  posts: [
    {
      title: "Vendor Payment Proposal in D365 Finance",
      url: "posts/vendor-payment-proposal.html",
      module: "Accounts payable",
      submodule: "Major Functionalities",
      excerpt: "How the payment proposal process automates vendor invoice selection and cash flow planning in D365 F&O.",
      date: "Sep 1, 2026",
      dateSort: "2026-09-01",
      readTime: "7 min"
    },
    {
      title: "From Raw Materials to Finished Goods: A Comprehensive Journey",
      url: "posts/rm-to-fg.html",
      module: "Production control",
      submodule: "Module related accounting",
      excerpt: "Production planning, execution, and costing — with the accounting entries at each step of the RM-to-FG cycle.",
      date: "Aug 31, 2026",
      dateSort: "2026-08-31",
      readTime: "9 min"
    },
    {
      title: "Navigating the Order-to-Cash (O2C) Cycle",
      url: "posts/order-to-cash.html",
      module: "Accounts receivable",
      submodule: "Module related accounting",
      excerpt: "Order creation through picking, invoicing, and payment reconciliation, plus the accounting entries at each stage.",
      date: "Aug 31, 2026",
      dateSort: "2026-08-31",
      readTime: "8 min"
    },
    {
      title: "Understanding the Procure-to-Pay (P2P) Cycle",
      url: "posts/procure-to-pay.html",
      module: "Accounts payable",
      submodule: "Module related accounting",
      excerpt: "From requisition to payment execution — the full P2P journey, including three-way matching and GRNI accounting.",
      date: "Aug 26, 2026",
      dateSort: "2026-08-26",
      readTime: "10 min"
    }
  ]
};
