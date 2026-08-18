# Security policy 🔒

## Supported versions

The latest commit on `main` is the only supported development line while FINISH is pre-1.0.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could expose local files, execute an unintended command, or bypass an approval boundary. Use GitHub's private security advisory flow for this repository when it is available. If that flow is unavailable, open a minimal issue asking for a private contact channel and do not include exploit details.

Include the affected version or commit, operating system, reproduction steps, and the smallest safe proof. Do not attach real credentials, tokens, private notes, or personal documents.

## Security boundary

FINISH v0.1 is intentionally local and non-executing:

- It does not make network requests or require an account.
- It does not invoke a shell or run installation commands.
- It does not pay, book, send, or submit anything.
- It rejects workspace traversal, outside absolute paths, and symlink escapes.
- It preserves source evidence so users can review where a plan came from.

Security changes must include a regression test and a clear explanation of the new boundary.
