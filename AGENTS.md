# Working agreements

Never make edits without asking me first if I want you to make edits. If I am asking for advice, I am asking for advice. Once we discuss, then I may tell you to make edits.

All automated tests must live under `digital-library-build/tests/`, including tests of website code and cloud-build verification. Never create test files or test directories in website repositories such as `jrp-website` or `1520s-project-website`. Tests must read website inputs from the configured or sibling checkout; they must not depend on being stored in the website repository.
